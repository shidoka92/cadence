"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("full_name")).trim();
  if (!fullName) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("profiles").update({ full_name: fullName }).eq("id", user!.id);
  revalidatePath("/", "layout");
}
