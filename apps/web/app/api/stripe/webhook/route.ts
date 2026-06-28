import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

type DbStatus = "active" | "past_due" | "canceled";

/** Réduit les statuts Stripe (incomplete, trialing, unpaid, paused...) aux 3 valeurs de l'enum DB. */
function mapStatus(status: Stripe.Subscription.Status): DbStatus {
  if (status === "active" || status === "trialing") return "active";
  if (status === "past_due" || status === "unpaid" || status === "incomplete") return "past_due";
  return "canceled"; // canceled, incomplete_expired, paused
}

async function upsertSubscription(studentId: string, coachId: string, stripeSubId: string, status: DbStatus) {
  const admin = createAdminClient();
  await admin.from("subscriptions").upsert(
    { student_id: studentId, coach_id: coachId, stripe_sub_id: stripeSubId, status, updated_at: new Date().toISOString() },
    { onConflict: "student_id" }
  );
}

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });

  const signature = req.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Signature manquante" }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, secret);
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const studentId = session.metadata?.studentId;
      const coachId = session.metadata?.coachId;
      if (session.mode === "subscription" && session.subscription && studentId && coachId) {
        await upsertSubscription(studentId, coachId, String(session.subscription), "active");
      } else if (session.mode === "payment" && session.metadata?.classId && studentId && coachId) {
        const classId = session.metadata.classId;
        const admin = createAdminClient();
        const amount = (session.amount_total ?? 0) / 100;
        const applicationFee = Math.round(amount * PLATFORM_FEE_PERCENT) / 100;
        const { data: payment } = await admin
          .from("payments")
          .upsert({ type: "class", student_id: studentId, coach_id: coachId, stripe_id: session.id, amount, application_fee: applicationFee }, { onConflict: "stripe_id" })
          .select("id")
          .single();
        await admin
          .from("class_enrollments")
          .upsert({ class_id: classId, student_id: studentId, payment_id: payment?.id ?? null }, { onConflict: "class_id,student_id" });
      }
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const studentId = sub.metadata?.studentId;
      const coachId = sub.metadata?.coachId;
      if (studentId && coachId) {
        const status = event.type === "customer.subscription.deleted" ? "canceled" : mapStatus(sub.status);
        await upsertSubscription(studentId, coachId, sub.id, status);
      }
      break;
    }
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;
      if (subId) {
        const sub = await stripe.subscriptions.retrieve(subId);
        const studentId = sub.metadata?.studentId;
        const coachId = sub.metadata?.coachId;
        if (studentId && coachId) {
          const amount = invoice.amount_paid / 100;
          const applicationFee = Math.round(amount * PLATFORM_FEE_PERCENT) / 100;
          const admin = createAdminClient();
          await admin.from("payments").upsert(
            { type: "subscription", student_id: studentId, coach_id: coachId, stripe_id: invoice.id, amount, application_fee: applicationFee },
            { onConflict: "stripe_id" }
          );
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
