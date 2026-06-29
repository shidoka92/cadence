import { Card, CardHeader, CardTitle, CardContent, Badge, Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { updateProfile, cancelSubscription } from "./actions";

export default async function EleveParametresPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();
  const { data: sub } = await supabase.from("subscriptions").select("status").eq("student_id", user!.id).maybeSingle();

  const active = sub?.status === "active";
  const pastDue = sub?.status === "past_due";

  return (
    <div className="px-4 md:px-7 py-6 max-w-lg space-y-4">
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
          <CardTitle>Abonnement</CardTitle>
          {sub && <Badge variant={active ? "done" : pastDue ? "risk" : "default"} className="ml-auto">{active ? "Actif" : pastDue ? "En retard" : sub.status}</Badge>}
        </CardHeader>
        <CardContent>
          {!sub ? (
            <p className="text-sm text-muted">Tu n&apos;as pas d&apos;abonnement actif. Ton coach peut t&apos;envoyer un lien de paiement.</p>
          ) : (
            <>
              <p className="text-sm text-muted mb-3">
                {active ? "Ton abonnement est actif — tu peux l'annuler à tout moment." : pastDue ? "Ton dernier paiement a échoué — vérifie ton moyen de paiement." : "Ton abonnement n'est plus actif."}
              </p>
              {(active || pastDue) && (
                <form action={cancelSubscription}>
                  <Button type="submit" variant="secondary">Annuler mon abonnement</Button>
                </form>
              )}
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
