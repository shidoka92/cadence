"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { decodeAnchor } from "@/lib/plan";
import { notify } from "@/lib/notify";

export async function addAnnotation(formData: FormData) {
  const programId = String(formData.get("programId"));
  const body = String(formData.get("body")).trim();
  if (!body || !programId) return;
  const anchor = decodeAnchor(String(formData.get("anchor") ?? ""));
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("program_annotations").insert({ program_id: programId, author: "student", body, status: "sent", anchor });
  revalidatePath("/eleve/programme");

  const [{ data: program }, { data: profile }] = await Promise.all([
    supabase.from("programs").select("coach_id").eq("id", programId).single(),
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
  ]);
  if (program?.coach_id) {
    await notify(program.coach_id, "annotation", { title: `${profile?.full_name ?? "Un élève"} a commenté son programme`, href: `/programmes/${programId}` });
  }
}
