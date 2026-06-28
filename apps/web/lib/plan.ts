import type { Plan } from "@cadence/types";

export type PlanAnchor = { sessionId?: string; exerciseId?: string } | null;
export type PlanRef = { sessionId: string; exerciseId?: string; label: string };

/** Liste à plat des séances et exercices d'un Plan, pour ancrer un commentaire dessus. */
export function flattenPlanRefs(plan: Plan): PlanRef[] {
  const refs: PlanRef[] = [];
  for (const b of plan.blocks) {
    for (const s of b.sessions) {
      refs.push({ sessionId: s.id, label: `${b.focus} · ${s.name}` });
      for (const e of s.exercises) {
        refs.push({ sessionId: s.id, exerciseId: e.id, label: `${b.focus} · ${s.name} · ${e.name}` });
      }
    }
  }
  return refs;
}

/** Encode une référence pour la valeur d'un <select> : "sessionId" ou "sessionId|exerciseId". */
export function encodeRef(ref: PlanRef) {
  return ref.exerciseId ? `${ref.sessionId}|${ref.exerciseId}` : ref.sessionId;
}

export function decodeAnchor(raw: string): PlanAnchor {
  if (!raw) return null;
  const [sessionId, exerciseId] = raw.split("|");
  return { sessionId, exerciseId: exerciseId || undefined };
}

export function resolveAnchorLabel(plan: Plan, anchor: PlanAnchor): string | null {
  if (!anchor?.sessionId) return null;
  const refs = flattenPlanRefs(plan);
  const match = anchor.exerciseId
    ? refs.find((r) => r.sessionId === anchor.sessionId && r.exerciseId === anchor.exerciseId)
    : refs.find((r) => r.sessionId === anchor.sessionId && !r.exerciseId);
  return match?.label ?? null;
}
