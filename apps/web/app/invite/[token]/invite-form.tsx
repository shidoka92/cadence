"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export function InviteForm({ token, coachName }: { token: string; coachName: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: e1 } = await supabase.auth.signUp({ email, password });
    if (e1) { setError(e1.message); setLoading(false); return; }
    if (!data.session) { setLoading(false); setError("Vérifie ton email pour confirmer ton compte, puis rouvre ce lien."); return; }
    const { error: e2 } = await supabase.rpc("accept_invitation", { p_token: token, p_full_name: name });
    setLoading(false);
    if (e2) { setError(e2.message); return; }
    setDone(true);
  }

  if (done) {
    return (
      <div className="bg-surf border border-line rounded-lg p-6 text-center">
        <div className="text-ok text-3xl mb-2">✓</div>
        <h1 className="font-display text-lg font-semibold uppercase tracking-wide mb-2">Bienvenue !</h1>
        <p className="text-xs text-muted">Ton compte est créé et tu es relié à <span className="text-acid font-semibold">{coachName}</span>. L&apos;app élève arrive bientôt — ton coach voit déjà ton profil.</p>
      </div>
    );
  }

  return (
    <div className="bg-surf border border-line rounded-lg p-6">
      <h1 className="font-display text-lg font-semibold uppercase tracking-wide mb-1">Rejoindre {coachName}</h1>
      <p className="text-xs text-muted mb-6">Crée ton compte élève.</p>
      <div className="space-y-3">
        <Input placeholder="Ton nom" value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-xs text-risk">{error}</p>}
        <Button className="w-full justify-center" disabled={loading} onClick={submit}>
          {loading ? "Création…" : "Créer mon compte"}
        </Button>
      </div>
    </div>
  );
}
