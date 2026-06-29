"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export default function NouveauMotDePassePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.replace("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <Link href="/" className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md bg-acid" />
          <span className="font-display font-bold text-2xl uppercase tracking-wider">Cadence</span>
        </Link>
        <div className="bg-surf border border-line rounded-lg p-6">
          <h1 className="font-display text-xl font-semibold uppercase tracking-wide mb-5">Nouveau mot de passe</h1>
          <form onSubmit={submit} className="space-y-3">
            <Input type="password" placeholder="Nouveau mot de passe" aria-label="Nouveau mot de passe" autoComplete="new-password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            {error && <p role="alert" className="text-xs text-risk">{error}</p>}
            <Button type="submit" className="w-full justify-center" disabled={loading}>
              {loading ? "Mise à jour…" : "Mettre à jour"}
            </Button>
          </form>
        </div>
      </div>
    </main>
  );
}
