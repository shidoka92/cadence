"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(formData: FormData) {
  const coachId = String(formData.get("coachId"));
  const body = String(formData.get("body")).trim();
  if (!body || !coachId) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("messages").insert({ coach_id: coachId, student_id: user!.id, sender: "student", body });
  revalidatePath("/eleve/messagerie");
}
