"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function sendMessage(formData: FormData) {
  const studentId = String(formData.get("studentId"));
  const body = String(formData.get("body")).trim();
  if (!body || !studentId) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("messages").insert({ coach_id: user!.id, student_id: studentId, sender: "coach", body });
  revalidatePath("/messagerie");
}
