"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { baseUrl } from "@/lib/url";
import { notify } from "@/lib/notify";

export async function enrollClass(formData: FormData) {
  const classId = String(formData.get("classId"));
  if (!classId) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: klass } = await supabase.from("classes").select("coach_id, title, pricing, price").eq("id", classId).single();
  if (!klass) return;

  if (klass.pricing !== "paid" || !klass.price) {
    await supabase.from("class_enrollments").insert({ class_id: classId, student_id: user!.id });
    revalidatePath("/eleve/planning");
    return;
  }

  // cours payant : paiement Stripe unique, commission Cadence comme pour les abonnements
  const { data: coach } = await supabase.from("profiles").select("stripe_account_id, stripe_charges_enabled").eq("id", klass.coach_id).single();
  if (!coach?.stripe_account_id || !coach.stripe_charges_enabled) return;

  const stripe = getStripe();
  if (!stripe) return;

  const amountCents = Math.round(klass.price * 100);
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price_data: { currency: "eur", unit_amount: amountCents, product_data: { name: klass.title } }, quantity: 1 }],
    payment_intent_data: {
      application_fee_amount: Math.round((amountCents * PLATFORM_FEE_PERCENT) / 100),
      transfer_data: { destination: coach.stripe_account_id },
    },
    metadata: { classId, studentId: user!.id, coachId: klass.coach_id },
    success_url: `${baseUrl()}/eleve/planning`,
    cancel_url: `${baseUrl()}/eleve/planning`,
  });
  redirect(session.url!);
}

export async function requestOpenSession(formData: FormData) {
  const sessionId = String(formData.get("sessionId"));
  if (!sessionId) return;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("open_session_requests").insert({ session_id: sessionId, student_id: user!.id });
  revalidatePath("/eleve/planning");

  const [{ data: session }, { data: profile }] = await Promise.all([
    supabase.from("open_sessions").select("host_student_id, title").eq("id", sessionId).single(),
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
  ]);
  if (session?.host_student_id) {
    await notify(session.host_student_id, "open_request", { title: `${profile?.full_name ?? "Quelqu'un"} veut rejoindre « ${session.title} »`, href: "/eleve/planning" });
  }
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
