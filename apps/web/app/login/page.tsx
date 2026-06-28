"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setError(error.message);
    else router.replace("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md bg-acid" />
          <span className="font-display font-bold text-2xl uppercase tracking-wider">Cadence</span>
        </div>
        <div className="bg-surf border border-line rounded-lg p-6">
          <h1 className="font-display text-xl font-semibold uppercase tracking-wide mb-1">Connexion</h1>
          <p className="text-xs text-muted mb-6">Espace coach.</p>
          <div className="space-y-3">
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" placeholder="Mot de passe" value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p className="text-xs text-risk">{error}</p>}
            <Button className="w-full justify-center" disabled={loading} onClick={onSubmit}>
              {loading ? "Connexion…" : "Se connecter"}
            </Button>
          </div>
        </div>
        <p className="text-center text-[11px] text-ghost mt-5 font-mono uppercase tracking-wider">
          Élève ? Connecte-toi depuis l&apos;app mobile
        </p>
      </div>
    </main>
  );
}
