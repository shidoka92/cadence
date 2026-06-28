import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { updateProfile, connectStripe, syncStripeStatus } from "./actions";

export default async function ParametresPage({ searchParams }: { searchParams: { stripe?: string } }) {
  if (searchParams.stripe === "return" || searchParams.stripe === "refresh") {
    await syncStripeStatus();
    redirect("/parametres");
  }

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, stripe_account_id, stripe_charges_enabled, stripe_details_submitted")
    .eq("id", user!.id)
    .single();

  const stripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);
  const connected = Boolean(profile?.stripe_charges_enabled && profile?.stripe_details_submitted);
  const pending = Boolean(profile?.stripe_account_id) && !connected;

  return (
    <div className="px-7 py-6 max-w-lg space-y-4">
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Paramètres</h1>

      <Card>
        <CardHeader><CardTitle>Profil</CardTitle></CardHeader>
        <CardContent>
          <form action={updateProfile} className="space-y-3">
            <div>
              <label className="font-mono text-[10px] uppercase tracking-widest text-ghost">Nom</label>
              <Input name="full_name" defaultValue={profile?.full_name ?? ""} className="mt-1" />
            </div>
            <div className="text-[11px] text-muted">{user?.email}</div>
            <Button type="submit">Enregistrer</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Facturation</CardTitle>
          {stripeConfigured && connected && <Badge variant="done" className="ml-auto">Connecté ✓</Badge>}
          {stripeConfigured && pending && <Badge variant="warn" className="ml-auto">À finaliser</Badge>}
        </CardHeader>
        <CardContent>
          {!stripeConfigured ? (
            <p className="text-sm text-muted">Configuration Stripe manquante côté serveur.</p>
          ) : connected ? (
            <p className="text-sm text-muted">Ton compte Stripe est connecté — tu peux encaisser les abonnements de tes élèves.</p>
          ) : (
            <>
              <p className="text-sm text-muted mb-3">
                {pending
                  ? "L'onboarding Stripe n'est pas terminé — reprends-le pour pouvoir encaisser."
                  : "Connecte ton compte Stripe pour encaisser les abonnements de tes élèves."}
              </p>
              <form action={connectStripe}>
                <Button type="submit">{pending ? "Finaliser sur Stripe" : "Connecter Stripe"}</Button>
              </form>
            </>
          )}
        </CardContent>
      </Card>

      <form action="/auth/signout" method="post">
        <Button variant="secondary" type="submit">Se déconnecter</Button>
      </form>
    </div>
  );
}
