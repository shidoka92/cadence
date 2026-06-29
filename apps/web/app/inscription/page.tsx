"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export default function InscriptionPage() {
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
    if (!data.session) { setLoading(false); setError("Vérifie ton email pour confirmer ton compte, puis reviens te connecter."); return; }
    const { error: e2 } = await supabase.from("profiles").insert({ id: data.user!.id, role: "coach", full_name: name });
    if (e2) { setLoading(false); setError(e2.message); return; }
    router.replace("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md bg-acid" />
          <span className="font-display font-bold text-2xl uppercase tracking-wider">Cadence</span>
        </Link>
        <div className="bg-surf border border-line rounded-lg p-6">
          <h1 className="font-display text-xl font-semibold uppercase tracking-wide mb-1">Créer mon espace coach</h1>
          <p className="text-xs text-muted mb-5">Gratuit à l&apos;inscription — tu ne paies rien avant d&apos;encaisser tes élèves.</p>
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
        <p className="text-center text-[11px] text-ghost mt-5 font-mono uppercase tracking-wider">
          Déjà un compte ? <Link href="/login" className="text-acid">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}
