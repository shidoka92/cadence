"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addJournalEntry(formData: FormData) {
  const exercise = String(formData.get("exercise")).trim();
  if (!exercise) return;
  const sessionRef = String(formData.get("sessionRef") ?? "").trim() || "Séance libre";
  const load = formData.get("load") ? parseFloat(String(formData.get("load")).replace(",", ".")) : null;
  const reps = formData.get("reps") ? parseInt(String(formData.get("reps")), 10) : null;
  const rpe = formData.get("rpe") ? parseInt(String(formData.get("rpe")), 10) : null;
  const note = String(formData.get("note") ?? "").trim() || null;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("journal_entries").insert({
    student_id: user!.id, session_ref: sessionRef, exercise, load, reps, rpe, note,
  });
  revalidatePath("/eleve/journal");
}
