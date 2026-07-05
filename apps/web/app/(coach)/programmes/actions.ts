"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@cadence/types";
import { decodeAnchor, reIdPlan } from "@/lib/plan";
import { notify } from "@/lib/notify";

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
  const templateId = String(formData.get("templateId") ?? "");
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let plan: Plan = { blocks: [{ id: uid(), focus: "Bloc 1", weeks: [1, 2, 3, 4], sessions: [{ id: uid(), name: "Séance A", exercises: [{ id: uid(), name: "Exercice 1", rule: "", cells: [{ v: "—" }, { v: "—" }, { v: "—" }, { v: "—" }] }] }] }] };
  let title = "Nouveau programme";
  if (templateId) {
    const { data: tpl } = await supabase.from("program_templates").select("title, plan").eq("id", templateId).maybeSingle();
    if (tpl) { plan = reIdPlan(tpl.plan as Plan); title = tpl.title; }
  }

  const { data, error } = await supabase.from("programs").insert({ coach_id: user!.id, student_id: studentId, title, plan, status: "draft" }).select("id").single();
  if (error || !data) return;
  revalidatePath("/programmes");
  redirect(`/programmes/${data.id}`);
}

export async function saveAsTemplate(title: string, plan: Plan) {
  const trimmed = title.trim();
  if (!trimmed || !plan?.blocks?.length) return { ok: false as const, error: "Programme vide." };
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("program_templates").insert({ coach_id: user!.id, title: trimmed, plan });
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/programmes");
  return { ok: true as const };
}

export async function deleteTemplate(formData: FormData) {
  const id = String(formData.get("templateId"));
  if (!id) return;
  const supabase = createClient();
  await supabase.from("program_templates").delete().eq("id", id);
  revalidatePath("/programmes");
}

export async function addCoachAnnotation(formData: FormData) {
  const programId = String(formData.get("programId"));
  const body = String(formData.get("body")).trim();
  if (!body || !programId) return;
  const anchor = decodeAnchor(String(formData.get("anchor") ?? ""));
  const supabase = createClient();
  await supabase.from("program_annotations").insert({ program_id: programId, author: "coach", body, status: "sent", anchor });
  revalidatePath(`/programmes/${programId}`);

  const { data: program } = await supabase.from("programs").select("student_id").eq("id", programId).single();
  if (program?.student_id) {
    await notify(program.student_id, "annotation", { title: "Ton coach a commenté ton programme", href: "/eleve/programme" });
  }
}
