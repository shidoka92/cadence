"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

export default function InviterPage() {
  const [link, setLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée."); setLoading(false); return; }
    const token = crypto.randomUUID();
    const { error } = await supabase.from("invitations").insert({ coach_id: user.id, token });
    setLoading(false);
    if (error) { setError(error.message); return; }
    setLink(`${window.location.origin}/invite/${token}`);
  }

  return (
    <div className="px-7 py-6 max-w-xl">
      <div className="text-xs text-muted mb-4"><Link href="/eleves" className="text-acid">Élèves</Link> › Inviter</div>
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide mb-1">Inviter un élève</h1>
      <p className="text-sm text-muted mb-6">Génère un lien unique. L&apos;élève crée son compte et se relie automatiquement à toi.</p>

      {!link ? (
        <Button onClick={generate} disabled={loading}>{loading ? "Génération…" : "Générer un lien d'invitation"}</Button>
      ) : (
        <div className="bg-surf border border-line rounded-lg p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ghost mb-2">Lien à partager</div>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-surf2 border border-line2 rounded-md px-3 py-2.5 text-xs text-acid truncate">{link}</code>
            <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(link); setCopied(true); }}>
              {copied ? "Copié ✓" : "Copier"}
            </Button>
          </div>
          <button onClick={() => { setLink(null); setCopied(false); }} className="font-display text-xs font-semibold uppercase tracking-wide text-muted mt-3">Générer un autre</button>
        </div>
      )}
      {error && <p className="text-xs text-risk mt-3">{error}</p>}
    </div>
  );
}
