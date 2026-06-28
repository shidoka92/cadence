"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function enrollClass(formData: FormData) {
  const classId = String(formData.get("classId"));
  if (!classId) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("class_enrollments").insert({ class_id: classId, student_id: user!.id });
  revalidatePath("/eleve/planning");
}

export async function requestOpenSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  if (!sessionId) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("open_session_requests").insert({ session_id: sessionId, student_id: user!.id });
  revalidatePath("/eleve/planning");
}

export async function hostOpenSession(formData: FormData) {
  const title = String(formData.get("title")).trim();
  const date = String(formData.get("date"));
  const time = String(formData.get("time"));
  const slots = parseInt(String(formData.get("slots")), 10) || 1;
  const level = String(formData.get("level") ?? "").trim() || null;
  if (!title || !date || !time) return;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name, coach_id").eq("id", user!.id).single();
  if (!profile?.coach_id) return;

  await supabase.from("open_sessions").insert({
    host_student_id: user!.id,
    coach_id: profile.coach_id,
    host_name: profile.full_name,
    title, level, slots,
    is_open: true,
    starts_at: new Date(`${date}T${time}`).toISOString(),
  });
  revalidatePath("/eleve/planning");
  redirect("/eleve/planning");
}
