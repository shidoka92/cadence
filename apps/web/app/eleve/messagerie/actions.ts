"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notify } from "@/lib/notify";

export async function sendMessage(formData: FormData) {
  const coachId = String(formData.get("coachId"));
  const body = String(formData.get("body")).trim();
  if (!body || !coachId) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("messages").insert({ coach_id: coachId, student_id: user!.id, sender: "student", body });
  revalidatePath("/eleve/messagerie");
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();
  await notify(coachId, "message", { title: `${profile?.full_name ?? "Un élève"} t'a envoyé un message`, href: `/messagerie?s=${user!.id}` });
}
