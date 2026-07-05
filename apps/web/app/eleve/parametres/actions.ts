"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { baseUrl } from "@/lib/url";

export async function updateProfile(formData: FormData) {
  const fullName = String(formData.get("full_name")).trim();
  if (!fullName) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("profiles").update({ full_name: fullName }).eq("id", user!.id);
  revalidatePath("/", "layout");
}

/** Portail de facturation Stripe : l'élève met à jour sa carte lui-même (retry auto des impayés par Stripe). */
export async function openBillingPortal() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("stripe_customer_id").eq("id", user!.id).single();
  if (!profile?.stripe_customer_id) return;

  const stripe = getStripe();
  if (!stripe) return;
  const portal = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${baseUrl()}/eleve/parametres`,
  });
  redirect(portal.url);
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
