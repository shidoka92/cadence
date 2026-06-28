"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function addAnnotation(formData: FormData) {
  const programId = String(formData.get("programId"));
  const body = String(formData.get("body")).trim();
  if (!body || !programId) return;
  const supabase = createClient();
  await supabase.from("program_annotations").insert({ program_id: programId, author: "student", body, status: "sent" });
  revalidatePath("/eleve/programme");
}
