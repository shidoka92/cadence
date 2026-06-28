"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export function InviteForm({ token, coachName }: { token: string; coachName: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error: e1 } = await supabase.auth.signUp({ email, password });
    if (e1) { setError(e1.message); setLoading(false); return; }
    if (!data.session) { setLoading(false); setError("Vérifie ton email pour confirmer ton compte, puis rouvre ce lien."); return; }
    const { error: e2 } = await supabase.rpc("accept_invitation", { p_token: token, p_full_name: name });
    if (e2) { setLoading(false); setError(e2.message); return; }
    router.replace("/eleve/accueil");
  }

  return (
    <div className="bg-surf border border-line rounded-lg p-6">
      <h1 className="font-display text-lg font-semibold uppercase tracking-wide mb-1">Rejoindre {coachName}</h1>
      <p className="text-xs text-muted mb-6">Crée ton compte élève.</p>
      <form onSubmit={submit} className="space-y-3">
        <Input placeholder="Ton nom" aria-label="Ton nom" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} />
        <Input type="email" placeholder="Email" aria-label="Email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input type="password" placeholder="Mot de passe" aria-label="Mot de passe" autoComplete="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p role="alert" className="text-xs text-risk">{error}</p>}
        <Button type="submit" className="w-full justify-center" disabled={loading}>
          {loading ? "Création…" : "Créer mon compte"}
        </Button>
      </form>
    </div>
  );
}
