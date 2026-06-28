"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@cadence/types";

const uid = () => Math.random().toString(36).slice(2, 10);

export async function savePlan(programId: string, plan: Plan, title: string) {
  const supabase = createClient();
  const { error } = await supabase.from("programs").update({ plan, title, updated_at: new Date().toISOString() }).eq("id", programId);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/programmes");
  return { ok: true as const };
}

export async function createProgram(formData: FormData) {
  const studentId = String(formData.get("studentId"));
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const starter: Plan = { blocks: [{ id: uid(), focus: "Bloc 1", weeks: [1, 2, 3, 4], sessions: [{ id: uid(), name: "Séance A", exercises: [{ id: uid(), name: "Exercice 1", rule: "", cells: [{ v: "—" }, { v: "—" }, { v: "—" }, { v: "—" }] }] }] }] };
  const { data, error } = await supabase.from("programs").insert({ coach_id: user!.id, student_id: studentId, title: "Nouveau programme", plan: starter, status: "draft" }).select("id").single();
  if (error || !data) return;
  revalidatePath("/programmes");
  redirect(`/programmes/${data.id}`);
}
