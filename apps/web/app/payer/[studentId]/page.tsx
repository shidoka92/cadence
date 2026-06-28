import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { createCheckoutSession } from "./actions";

type PaymentLinkInfo = {
  student_name: string;
  coach_name: string;
  price: number | null;
  payable: boolean;
  already_subscribed: boolean;
};

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="max-w-sm w-full bg-surf border border-line rounded-lg p-6 text-center">{children}</div>
    </div>
  );
}

export default async function PayerPage({ params }: { params: { studentId: string } }) {
  const supabase = createClient();
  const { data: info } = await supabase.rpc("payment_link_info", { p_student_id: params.studentId }).single<PaymentLinkInfo>();

  if (!info) {
    return <Screen><p className="text-sm text-muted">Lien invalide.</p></Screen>;
  }
  if (info.already_subscribed) {
    return <Screen><p className="text-sm text-muted">Tu es déjà abonné(e) — merci 🙌</p></Screen>;
  }
  if (!info.payable) {
    return <Screen><p className="text-sm text-muted">Le paiement n&apos;est pas encore disponible — reviens un peu plus tard.</p></Screen>;
  }

  return (
    <Screen>
      <h1 className="font-display text-xl font-semibold uppercase tracking-wide mb-1">Coaching {info.coach_name}</h1>
      <p className="text-sm text-muted mb-4">Abonnement mensuel</p>
      <div className="font-display text-4xl font-bold mb-5">
        {info.price}€<span className="text-sm font-normal text-muted">/mois</span>
      </div>
      <form action={createCheckoutSession.bind(null, params.studentId)}>
        <Button type="submit" className="w-full">S&apos;abonner</Button>
      </form>
    </Screen>
  );
}
