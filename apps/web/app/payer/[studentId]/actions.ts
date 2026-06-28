"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getStripe, PLATFORM_FEE_PERCENT } from "@/lib/stripe";
import { baseUrl } from "@/lib/url";

type PaymentLinkInfo = {
  coach_id: string;
  coach_name: string;
  stripe_account_id: string | null;
  price: number | null;
  payable: boolean;
  already_subscribed: boolean;
};

export async function createCheckoutSession(studentId: string, _formData: FormData) {
  const supabase = createClient();
  const { data: info } = await supabase.rpc("payment_link_info", { p_student_id: studentId }).single<PaymentLinkInfo>();
  if (!info || !info.payable || info.already_subscribed || !info.stripe_account_id || !info.price) return;

  const stripe = getStripe();
  if (!stripe) return;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{
      price_data: {
        currency: "eur",
        recurring: { interval: "month" },
        unit_amount: Math.round(info.price * 100),
        product_data: { name: `Coaching avec ${info.coach_name}` },
      },
      quantity: 1,
    }],
    subscription_data: {
      application_fee_percent: PLATFORM_FEE_PERCENT,
      transfer_data: { destination: info.stripe_account_id },
      metadata: { studentId, coachId: info.coach_id },
    },
    metadata: { studentId, coachId: info.coach_id },
    success_url: `${baseUrl()}/payer/${studentId}/succes`,
    cancel_url: `${baseUrl()}/payer/${studentId}`,
  });
  redirect(session.url!);
}
