import type { SupabaseClient } from "@supabase/supabase-js";
import type { Plan } from "@cadence/types";
import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_WEEKS = 4;
const WINDOW_MS = WINDOW_WEEKS * 7 * 864e5;

/**
 * Calcule le Health Score d'un élève à partir de signaux réels (aucune donnée fabriquée) :
 *  - Assiduité   : sur les 4 dernières semaines, proportion de semaines avec au moins un log journal.
 *  - Adhérence   : volume de séances loguées vs volume prescrit par le dernier bloc du programme.
 *  - Réactivité  : délai moyen de réponse de l'élève à un message du coach (heures → score).
 *  - Progression : variation moyenne de charge entre 1ère et dernière entrée, par exercice loggé ≥2 fois.
 * Les pondérations/seuils sont un point de départ délibérément simple — à recalibrer avec de vraies
 * données d'usage plutôt que deviné a priori.
 */
export async function computeAndStoreHealthScore(supabase: SupabaseClient, studentId: string) {
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const [progRes, journalRes, msgRes] = await Promise.all([
    supabase.from("programs").select("plan").eq("student_id", studentId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("journal_entries").select("exercise, exercise_id, load, created_at").eq("student_id", studentId).gte("created_at", since).order("created_at", { ascending: true }),
    supabase.from("messages").select("sender, created_at").eq("student_id", studentId).gte("created_at", since).order("created_at", { ascending: true }),
  ]);

  const plan = progRes.data?.plan as Plan | undefined;
  const entries = journalRes.data ?? [];
  const messages = msgRes.data ?? [];

  const attendance = computeAttendance(entries);
  const adherence = computeAdherence(entries, plan);
  const responsiveness = computeResponsiveness(messages);
  const progression = computeProgression(entries);

  const factors = { attendance, adherence, responsiveness, progression };
  const score = Math.round((attendance + adherence + responsiveness + progression) / 4);

  const admin = createAdminClient();
  await admin.from("health_scores").upsert({ student_id: studentId, score, factors, computed_at: new Date().toISOString() });

  return { score, factors };
}

function weekBucket(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (7 * 864e5));
}

function computeAttendance(entries: { created_at: string }[]) {
  const activeWeeks = new Set(entries.map((e) => weekBucket(e.created_at)));
  return Math.round((Math.min(activeWeeks.size, WINDOW_WEEKS) / WINDOW_WEEKS) * 100);
}

function computeAdherence(entries: unknown[], plan: Plan | undefined) {
  const lastBlock = plan?.blocks[plan.blocks.length - 1];
  const sessionsPerWeek = lastBlock?.sessions.length || 1;
  const expected = sessionsPerWeek * WINDOW_WEEKS;
  if (expected === 0) return 100;
  return Math.round(Math.min(1, entries.length / expected) * 100);
}

function computeResponsiveness(messages: { sender: string; created_at: string }[]) {
  const latenciesHours: number[] = [];
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].sender !== "coach") continue;
    const next = messages.slice(i + 1).find((m) => m.sender === "student");
    if (!next) continue;
    latenciesHours.push((new Date(next.created_at).getTime() - new Date(messages[i].created_at).getTime()) / 3.6e6);
  }
  const coachMessages = messages.filter((m) => m.sender === "coach").length;
  if (coachMessages === 0) return 90; // rien à quoi répondre, pas imputable à l'élève
  if (latenciesHours.length === 0) return 20; // le coach a écrit, aucune réponse n'est jamais venue
  const avg = latenciesHours.reduce((a, b) => a + b, 0) / latenciesHours.length;
  return Math.round(Math.max(0, Math.min(100, 100 - avg * 2)));
}

function computeProgression(entries: { exercise: string; exercise_id?: string | null; load: number | null; created_at: string }[]) {
  const byExercise = new Map<string, { load: number; created_at: string }[]>();
  for (const e of entries) {
    if (e.load == null) continue;
    // l'id du plan est fiable (mode séance) ; le nom en texte libre est le fallback historique
    const key = e.exercise_id ?? e.exercise.trim().toLowerCase();
    if (!byExercise.has(key)) byExercise.set(key, []);
    byExercise.get(key)!.push({ load: e.load, created_at: e.created_at });
  }
  const scores: number[] = [];
  for (const points of byExercise.values()) {
    if (points.length < 2) continue;
    const first = points[0].load;
    const last = points[points.length - 1].load;
    const pctChange = ((last - first) / Math.max(1, first)) * 100;
    scores.push(Math.max(0, Math.min(100, 50 + pctChange)));
  }
  if (scores.length === 0) return 70; // pas assez de données pour juger — neutre plutôt qu'alarmant
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}
