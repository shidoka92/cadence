import { Card, Badge, KpiTile } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getRevenue } from "@/lib/queries";

export default async function RevenusPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const r = await getRevenue(supabase, user!.id);

  return (
    <div className="px-7 py-6">
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide mb-5">Revenus</h1>

      <div className="grid grid-cols-2 gap-3.5 mb-3.5 max-w-2xl">
        <KpiTile label="Revenu net (ce mois)" value={`${r.netThisMonth.toFixed(2)}€`} accent />
        <KpiTile label="Revenu net (total)" value={`${r.netTotal.toFixed(2)}€`} />
      </div>
      <div className="grid grid-cols-3 gap-3.5 mb-5 max-w-2xl">
        <KpiTile label="Abonnés actifs" value={String(r.active)} />
        <KpiTile label="En retard" value={String(r.pastDue)} />
        <KpiTile label="Total" value={String(r.total)} />
      </div>

      <Card className="max-w-2xl mb-5">
        {r.rows.length === 0 && <div className="px-4 py-6 text-sm text-muted">Aucun abonnement.</div>}
        {r.rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0">
            <span className="font-display text-sm font-semibold uppercase tracking-wide flex-1">{row.name}</span>
            <Badge variant={row.status === "active" ? "done" : row.status === "past_due" ? "risk" : "default"}>{row.status}</Badge>
          </div>
        ))}
      </Card>

      <h2 className="font-display text-sm font-semibold uppercase tracking-wide mb-2.5 text-muted">Paiements récents</h2>
      <Card className="max-w-2xl">
        {r.recentPayments.length === 0 && <div className="px-4 py-6 text-sm text-muted">Aucun paiement encaissé.</div>}
        {r.recentPayments.map((p, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0">
            <span className="font-mono text-[10px] text-ghost w-12">{p.date}</span>
            <span className="font-display text-sm font-semibold uppercase tracking-wide flex-1">{p.name}</span>
            <span className="font-mono text-[11px] text-muted">{p.amount.toFixed(2)}€</span>
            <span className="font-mono text-xs text-acid w-20 text-right">net {p.net.toFixed(2)}€</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
