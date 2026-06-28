"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Input } from "@/components/ui";

export default function NouveauCoursPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(searchParams.get("date") ?? "");
  const [time, setTime] = useState("09:00");
  const [capacity, setCapacity] = useState("8");
  const [level, setLevel] = useState("");
  const [pricing, setPricing] = useState<"included" | "paid">("included");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !date || !time) { setError("Titre, date et heure sont requis."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Session expirée."); setLoading(false); return; }
    const { error } = await supabase.from("classes").insert({
      coach_id: user.id,
      title,
      capacity: parseInt(capacity, 10) || 1,
      level: level || null,
      pricing,
      price: pricing === "paid" ? parseFloat(price.replace(",", ".")) || 0 : null,
      starts_at: new Date(`${date}T${time}`).toISOString(),
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    router.push("/planning");
  }

  return (
    <div className="px-7 py-6 max-w-md">
      <div className="text-xs text-muted mb-4"><Link href="/planning" className="text-acid">Planning</Link> › Créer un cours</div>
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide mb-6">Créer un cours</h1>

      <form onSubmit={onSubmit} className="space-y-4">
        <Input placeholder="Titre du cours" value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="flex gap-3">
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="flex-1" />
          <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="flex-1" />
        </div>
        <div className="flex gap-3">
          <Input type="number" min="1" placeholder="Capacité" value={capacity} onChange={(e) => setCapacity(e.target.value)} className="flex-1" />
          <Input placeholder="Niveau (ex: Tous niveaux)" value={level} onChange={(e) => setLevel(e.target.value)} className="flex-1" />
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-1.5 text-sm">
            <input type="radio" name="pricing" checked={pricing === "included"} onChange={() => setPricing("included")} /> Inclus
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input type="radio" name="pricing" checked={pricing === "paid"} onChange={() => setPricing("paid")} /> Payant
          </label>
          {pricing === "paid" && (
            <Input type="number" min="0" step="0.01" placeholder="Prix €" value={price} onChange={(e) => setPrice(e.target.value)} className="w-28" />
          )}
        </div>

        {error && <p role="alert" className="text-xs text-risk">{error}</p>}

        <div className="flex gap-2.5 pt-2">
          <Button type="submit" disabled={loading}>{loading ? "Création…" : "Créer le cours"}</Button>
          <Link href="/planning"><Button type="button" variant="secondary">Annuler</Button></Link>
        </div>
      </form>
    </div>
  );
}
