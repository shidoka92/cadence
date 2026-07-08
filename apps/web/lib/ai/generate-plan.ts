import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import type { Plan } from "@cadence/types";

/** Entrées de génération, déjà autorisées et hydratées par la server action. */
export interface GenerateInput {
  objective: string;
  level: string;
  injuries?: string | null;
  weeks: number;
  sessionsPerWeek: number;
  focus?: string | null;
  /** Résumé des charges récentes par exercice, pour l'ajustement adaptatif. */
  recentPerformance?: string | null;
}

const MODEL = "claude-sonnet-5";
const MAX_WEEKS_PER_BLOCK = 8;

/** Forme brute demandée au modèle (sans ids ni structure de cellules). */
const generatedPlanSchema = z.object({
  title: z.string(),
  blocks: z.array(
    z.object({
      focus: z.string(),
      weeks: z.number(),
      sessions: z.array(
        z.object({
          name: z.string(),
          exercises: z.array(
            z.object({
              name: z.string(),
              consigne: z.string(),
              semaines: z.array(z.string()),
            })
          ),
        })
      ),
    })
  ),
});

/** JSON Schema équivalent, passé à l'API pour garantir la forme de sortie. */
const PLAN_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string", description: "Titre court du programme, en français" },
    blocks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          focus: { type: "string", description: "Objectif du bloc (ex. Hypertrophie, Force)" },
          weeks: { type: "integer", description: "Nombre de semaines du bloc (1 à 8)" },
          sessions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string", description: "Nom de la séance (ex. Séance A · Haut du corps)" },
                exercises: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      name: { type: "string" },
                      consigne: { type: "string", description: "Consigne courte (tempo, RPE, repos)" },
                      semaines: {
                        type: "array",
                        items: { type: "string" },
                        description: "Une prescription par semaine du bloc (ex. '4×8 @ 60kg')",
                      },
                    },
                    required: ["name", "consigne", "semaines"],
                  },
                },
              },
              required: ["name", "exercises"],
            },
          },
        },
        required: ["focus", "weeks", "sessions"],
      },
    },
  },
  required: ["title", "blocks"],
} as const;

const SYSTEM_PROMPT = `Tu es un préparateur physique expert. Tu conçois des programmes d'entraînement périodisés, structurés en blocs (mésocycles), séances et exercices.

Règles :
- Réponds UNIQUEMENT via le schéma structuré demandé, en français.
- Périodise : progression réaliste de la charge/volume d'une semaine à l'autre à l'intérieur d'un bloc.
- Chaque exercice a un tableau "semaines" dont la longueur ÉGALE le nombre de semaines du bloc ; chaque entrée est une prescription concrète (ex. "4×8 @ 60kg", "3×12 @ RPE 7", "5×5 @ 80%").
- Respecte le niveau, l'objectif, le matériel implicite et surtout les éventuelles blessures (adapte ou évite les mouvements à risque).
- Si des charges récentes sont fournies, sers-t'en comme point de départ réaliste plutôt que de repartir de zéro.
- Reste raisonnable : le coach relira et ajustera. Produis un brouillon solide, pas parfait.`;

function buildUserPrompt(input: GenerateInput): string {
  const lines = [
    `Objectif de l'élève : ${input.objective || "non précisé"}`,
    `Niveau : ${input.level || "non précisé"}`,
    input.injuries ? `Blessures / limitations : ${input.injuries}` : "Blessures / limitations : aucune signalée",
    `Durée cible : ${input.weeks} semaines au total`,
    `Fréquence : ${input.sessionsPerWeek} séances par semaine`,
    input.focus ? `Consignes du coach : ${input.focus}` : null,
    input.recentPerformance ? `\nCharges récentes loggées :\n${input.recentPerformance}` : null,
    `\nConçois le programme. Découpe les ${input.weeks} semaines en 1 à 3 blocs cohérents (chaque bloc ≤ ${MAX_WEEKS_PER_BLOCK} semaines) avec ${input.sessionsPerWeek} séance(s) par semaine.`,
  ].filter(Boolean);
  return lines.join("\n");
}

const uid = () => Math.random().toString(36).slice(2, 10);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Ajuste un tableau de prescriptions à exactement `n` semaines. */
function normalizeCells(weekly: string[], n: number) {
  const out: { v: string }[] = [];
  for (let i = 0; i < n; i++) {
    const v = weekly[i] ?? weekly[weekly.length - 1] ?? "—";
    out.push({ v: v.trim() || "—" });
  }
  return out;
}

type Generated = z.infer<typeof generatedPlanSchema>;

/** Convertit la sortie modèle en Plan (ids, semaines indexées, cellules). */
function toPlan(gen: Generated): { title: string; plan: Plan } {
  let weekCursor = 1;
  const blocks = gen.blocks.map((b) => {
    const weekCount = clamp(Math.round(b.weeks) || 1, 1, MAX_WEEKS_PER_BLOCK);
    const weeks = Array.from({ length: weekCount }, (_, i) => weekCursor + i);
    weekCursor += weekCount;
    return {
      id: uid(),
      focus: b.focus,
      weeks,
      sessions: b.sessions.map((s) => ({
        id: uid(),
        name: s.name,
        exercises: s.exercises.map((e) => ({
          id: uid(),
          name: e.name,
          rule: e.consigne,
          cells: normalizeCells(e.semaines, weekCount),
        })),
      })),
    };
  });
  return { title: gen.title.trim() || "Programme IA", plan: { blocks } };
}

/**
 * Génère un brouillon de programme via Claude.
 * @throws Error si la clé API manque ou si la réponse est invalide.
 */
export async function generatePlan(input: GenerateInput): Promise<{ title: string; plan: Plan }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Cadence IA n'est pas configuré : la clé ANTHROPIC_API_KEY est absente.");
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: PLAN_JSON_SCHEMA },
    },
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  } as Anthropic.MessageCreateParamsNonStreaming);

  if (response.stop_reason === "refusal") {
    throw new Error("La génération a été refusée. Reformule les consignes.");
  }

  const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  if (!textBlock) throw new Error("Réponse IA vide.");

  const parsed = generatedPlanSchema.safeParse(JSON.parse(textBlock.text));
  if (!parsed.success || parsed.data.blocks.length === 0) {
    throw new Error("Le programme généré est invalide.");
  }
  return toPlan(parsed.data);
}
