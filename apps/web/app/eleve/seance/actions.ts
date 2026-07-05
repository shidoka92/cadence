"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SessionEntryInput = {
  exerciseId: string;
  exerciseName: string;
  load: number | null;
  reps: number | null;
  rpe: number | null;
  note: string | null;
};

const exerciseKey = (exerciseId: string | null, name: string) => exerciseId ?? name.trim().toLowerCase();

export async function logSession(sessionId: string, sessionName: string, entries: SessionEntryInput[]) {
  if (!sessionId || entries.length === 0) return { ok: false as const, error: "Séance vide." };
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Session expirée." };

  // records existants AVANT insertion, pour détecter les nouveaux
  const { data: previous = [] } = await supabase
    .from("journal_entries")
    .select("exercise, exercise_id, load")
    .eq("student_id", user.id)
    .not("load", "is", null)
    .limit(1000);
  const bestOf = new Map<string, number>();
  for (const p of previous ?? []) {
    const key = exerciseKey(p.exercise_id, p.exercise);
    bestOf.set(key, Math.max(bestOf.get(key) ?? 0, Number(p.load)));
  }

  const rows = entries.map((e) => ({
    student_id: user.id,
    session_ref: sessionName,
    session_id: sessionId,
    exercise: e.exerciseName,
    exercise_id: e.exerciseId,
    load: e.load,
    reps: e.reps,
    rpe: e.rpe,
    note: e.note,
  }));
  const { error } = await supabase.from("journal_entries").insert(rows);
  if (error) return { ok: false as const, error: error.message };

  // nouveaux records → notification à soi-même (la policy RLS "notif owner" l'autorise)
  const prs = entries.filter((e) => e.load != null && e.load > (bestOf.get(exerciseKey(e.exerciseId, e.exerciseName)) ?? 0) && bestOf.has(exerciseKey(e.exerciseId, e.exerciseName)));
  if (prs.length > 0) {
    await supabase.from("notifications").insert(
      prs.map((e) => ({
        user_id: user.id,
        type: "pr",
        payload: { title: `Nouveau record : ${e.load} kg au ${e.exerciseName} 🎉`, href: "/eleve/progres" },
      }))
    );
  }

  revalidatePath("/eleve/journal");
  revalidatePath("/eleve/accueil");
  return { ok: true as const, prCount: prs.length };
}
