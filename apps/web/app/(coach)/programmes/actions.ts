"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@cadence/types";
import { decodeAnchor, reIdPlan } from "@/lib/plan";
import { notify } from "@/lib/notify";
import { generatePlan } from "@/lib/ai/generate-plan";

const uid = () => Math.random().toString(36).slice(2, 10);
const clampInt = (raw: FormDataEntryValue | null, lo: number, hi: number, fallback: number) => {
  const n = Math.round(Number(raw));
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback;
};

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

export type AiGenState = { error: string | null };

export async function generateProgramWithAI(_prev: AiGenState, formData: FormData): Promise<AiGenState> {
  const studentId = String(formData.get("studentId") ?? "");
  if (!studentId) return { error: "Choisis un élève." };
  const weeks = clampInt(formData.get("weeks"), 2, 16, 8);
  const sessionsPerWeek = clampInt(formData.get("sessionsPerWeek"), 1, 6, 3);
  const focus = String(formData.get("focus") ?? "").trim();

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Session expirée, reconnecte-toi." };

  // Autorisation : l'élève doit appartenir à ce coach
  const { data: student } = await supabase
    .from("profiles")
    .select("id, full_name, objective, level, injuries")
    .eq("id", studentId)
    .eq("coach_id", user.id)
    .eq("role", "student")
    .maybeSingle();
  if (!student) return { error: "Élève introuvable ou non rattaché à ton compte." };

  // Contexte adaptatif : charges récentes loggées
  const { data: entries = [] } = await supabase
    .from("journal_entries")
    .select("exercise, load, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(60);
  const best = new Map<string, number>();
  for (const e of (entries ?? []) as { exercise: string; load: number | null }[]) {
    if (e.load == null) continue;
    best.set(e.exercise, Math.max(best.get(e.exercise) ?? 0, Number(e.load)));
  }
  const recentPerformance = [...best.entries()].slice(0, 10).map(([ex, load]) => `- ${ex} : ${load} kg`).join("\n") || null;

  let programId: string;
  try {
    const { title, plan } = await generatePlan({
      objective: student.objective ?? "",
      level: student.level ?? "",
      injuries: student.injuries,
      weeks,
      sessionsPerWeek,
      focus: focus || null,
      recentPerformance,
    });
    const { data, error } = await supabase
      .from("programs")
      .insert({ coach_id: user.id, student_id: studentId, title, plan, status: "draft" })
      .select("id")
      .single();
    if (error || !data) return { error: "Enregistrement du programme impossible." };
    programId = data.id;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "La génération a échoué." };
  }

  revalidatePath("/programmes");
  redirect(`/programmes/${programId}`);
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
