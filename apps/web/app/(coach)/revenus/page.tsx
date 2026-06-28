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
      <div className="grid grid-cols-3 gap-3.5 mb-5 max-w-2xl">
        <KpiTile label="Abonnés actifs" value={String(r.active)} accent />
        <KpiTile label="En retard" value={String(r.pastDue)} />
        <KpiTile label="Total" value={String(r.total)} />
      </div>
      <Card className="max-w-2xl">
        {r.rows.length === 0 && <div className="px-4 py-6 text-sm text-muted">Aucun abonnement.</div>}
        {r.rows.map((row, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0">
            <span className="font-display text-sm font-semibold uppercase tracking-wide flex-1">{row.name}</span>
            <Badge variant={row.status === "active" ? "done" : row.status === "past_due" ? "risk" : "default"}>{row.status}</Badge>
          </div>
        ))}
      </Card>
      <p className="text-[11px] text-ghost mt-4 font-mono uppercase tracking-wider max-w-2xl">Montants et encaissements réels arriveront avec l&apos;intégration Stripe Connect.</p>
    </div>
  );
}
