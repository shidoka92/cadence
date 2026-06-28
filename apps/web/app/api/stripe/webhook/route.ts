import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

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

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const studentId = session.metadata?.studentId;
    const coachId = session.metadata?.coachId;
    if (session.mode === "subscription" && session.subscription && studentId && coachId) {
      const admin = createAdminClient();
      await admin.from("subscriptions").upsert(
        {
          student_id: studentId,
          coach_id: coachId,
          stripe_sub_id: String(session.subscription),
          status: "active",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id" }
      );
    }
  }

  return NextResponse.json({ received: true });
}
