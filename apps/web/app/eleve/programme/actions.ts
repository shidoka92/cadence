"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { decodeAnchor } from "@/lib/plan";

export async function addAnnotation(formData: FormData) {
  const programId = String(formData.get("programId"));
  const body = String(formData.get("body")).trim();
  if (!body || !programId) return;
  const anchor = decodeAnchor(String(formData.get("anchor") ?? ""));
  const supabase = createClient();
  await supabase.from("program_annotations").insert({ program_id: programId, author: "student", body, status: "sent", anchor });
  revalidatePath("/eleve/programme");
}
