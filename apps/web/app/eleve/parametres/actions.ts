"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("full_name")).trim();
  if (!fullName) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("profiles").update({ full_name: fullName }).eq("id", user!.id);
  revalidatePath("/", "layout");
}

export async function cancelSubscription() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: sub } = await supabase.from("subscriptions").select("stripe_sub_id").eq("student_id", user!.id).maybeSingle();
  if (!sub?.stripe_sub_id) return;

  const stripe = getStripe();
  if (!stripe) return;
  await stripe.subscriptions.cancel(sub.stripe_sub_id);
  revalidatePath("/eleve/parametres");
}
