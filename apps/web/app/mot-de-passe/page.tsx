"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export default function MotDePassePage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/mot-de-passe/nouveau`,
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md bg-acid" />
          <span className="font-display font-bold text-2xl uppercase tracking-wider">Cadence</span>
        </Link>
        <div className="bg-surf border border-line rounded-lg p-6">
          <h1 className="font-display text-xl font-semibold uppercase tracking-wide mb-1">Mot de passe oublié</h1>
          {sent ? (
            <p className="text-sm text-muted mt-3">Si un compte existe pour <span className="text-text">{email}</span>, un lien de réinitialisation vient d&apos;être envoyé.</p>
          ) : (
            <>
              <p className="text-xs text-muted mb-5">On t&apos;envoie un lien pour en choisir un nouveau.</p>
              <form onSubmit={submit} className="space-y-3">
                <Input type="email" placeholder="Email" aria-label="Email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                {error && <p role="alert" className="text-xs text-risk">{error}</p>}
                <Button type="submit" className="w-full justify-center" disabled={loading}>
                  {loading ? "Envoi…" : "Envoyer le lien"}
                </Button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-[11px] text-ghost mt-5 font-mono uppercase tracking-wider">
          <Link href="/login" className="text-acid">Retour à la connexion</Link>
        </p>
      </div>
    </main>
  );
}
