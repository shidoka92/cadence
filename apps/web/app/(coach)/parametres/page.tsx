import { Card, CardHeader, CardTitle, CardContent, Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { updateProfile } from "./actions";

export default async function ParametresPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user!.id).single();

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
        <CardHeader><CardTitle>Facturation</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-muted">La connexion Stripe (encaissements, KYC) arrivera ici.</p></CardContent>
      </Card>

      <form action="/auth/signout" method="post">
        <Button variant="secondary" type="submit">Se déconnecter</Button>
      </form>
    </div>
  );
}
