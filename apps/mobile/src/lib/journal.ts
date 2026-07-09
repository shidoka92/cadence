// Journal élève — historique des séries loguées. Miroir de getStudentJournal (web).
import type { SupabaseClient } from "@supabase/supabase-js";
import { dayAbbr, rel } from "./format";

export interface JournalEntry {
  id: string;
  day: string;
  time: string;
  sessionRef: string;
  exercise: string;
  load: number | null;
  reps: number | null;
  rpe: number | null;
  note: string | null;
}

export async function getStudentJournal(supabase: SupabaseClient, studentId: string): Promise<JournalEntry[]> {
  const { data } = await supabase
    .from("journal_entries")
    .select("id, session_ref, exercise, load, reps, rpe, note, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(50);
  return ((data ?? []) as any[]).map((j) => ({
    id: j.id,
    day: dayAbbr(j.created_at),
    time: rel(j.created_at),
    sessionRef: j.session_ref,
    exercise: j.exercise,
    load: j.load,
    reps: j.reps,
    rpe: j.rpe,
    note: j.note,
  }));
}
