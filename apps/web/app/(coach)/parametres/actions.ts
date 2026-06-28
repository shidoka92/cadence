"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
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

function baseUrl() {
  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${h.get("host")}`;
}

/** Crée (si besoin) le compte Connect du coach et l'envoie sur l'onboarding hébergé Stripe.
 *  Idempotent : ré-appeler quand le compte existe déjà régénère juste un lien (les Account Links
 *  sont à usage unique / courte durée de vie) et reprend l'onboarding là où il a été laissé. */
export async function connectStripe() {
  const stripe = getStripe();
  if (!stripe) return;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("stripe_account_id").eq("id", user!.id).single();

  let accountId = profile?.stripe_account_id as string | null;
  if (!accountId) {
    const account = await stripe.accounts.create({ type: "express", email: user!.email ?? undefined });
    accountId = account.id;
    await supabase.from("profiles").update({ stripe_account_id: accountId }).eq("id", user!.id);
  }

  const link = await stripe.accountLinks.create({
    account: accountId,
    type: "account_onboarding",
    return_url: `${baseUrl()}/parametres?stripe=return`,
    refresh_url: `${baseUrl()}/parametres?stripe=refresh`,
  });
  redirect(link.url);
}

/** Resynchronise l'état réel du compte Connect depuis Stripe (appelé au retour de l'onboarding). */
export async function syncStripeStatus() {
  const stripe = getStripe();
  if (!stripe) return;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("stripe_account_id").eq("id", user!.id).single();
  if (!profile?.stripe_account_id) return;

  const account = await stripe.accounts.retrieve(profile.stripe_account_id);
  await supabase.from("profiles").update({
    stripe_charges_enabled: account.charges_enabled,
    stripe_details_submitted: account.details_submitted,
  }).eq("id", user!.id);
}
