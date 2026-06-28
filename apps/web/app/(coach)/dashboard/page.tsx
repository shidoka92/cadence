import Link from "next/link";
import { MessageSquare, Plus } from "lucide-react";
import { Button, Card, CardHeader, CardTitle, Badge, KpiTile, HealthScore } from "@/components/ui";
import { ActionItem } from "@/components/coach/action-item";
import { createClient } from "@/lib/supabase/server";
import { getDashboard } from "@/lib/queries";

const QUEUE_ICON: Record<string, { icon: typeof Plus; cls: string }> = {
  annotation: { icon: MessageSquare, cls: "bg-acid/15 text-acid" },
  newstudent: { icon: Plus, cls: "bg-acid/15 text-acid" },
  sub: { icon: Plus, cls: "bg-acid/15 text-acid" },
};

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ kpis, queue, risk, week }, { data: profile }] = await Promise.all([
    getDashboard(supabase, user!.id),
    supabase.from("profiles").select("full_name").eq("id", user!.id).single(),
  ]);
  const firstName = (profile?.full_name ?? "Coach").split(" ")[0];
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-4 px-7 py-4 border-b border-line">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Bonjour, <span className="text-acid">{firstName}</span></h1>
        <span className="font-mono text-xs text-muted ml-auto">{today}</span>
        <Button>+ Nouveau programme</Button>
      </header>

      <div className="flex-1 overflow-y-auto px-7 py-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
          {kpis.map((k) => <KpiTile key={k.label} {...k} />)}
        </div>

        <div className="grid lg:grid-cols-[1.4fr_0.95fr] gap-4">
          <Card className="self-start">
            <div className="h-1 caution-stripe" />
            <CardHeader>
              <CardTitle>À traiter</CardTitle>
              <Badge variant="now" className="rounded-full">{queue.length}</Badge>
              <span className="font-mono text-[9px] text-ghost ml-auto tracking-wider">TRIÉ PAR PRIORITÉ</span>
            </CardHeader>
            <div>
              {queue.length === 0 && <div className="px-4 py-6 text-sm text-muted">Rien à traiter pour le moment.</div>}
              {queue.map((a, i) => {
                const m = QUEUE_ICON[a.kind];
                return <ActionItem key={i} icon={m.icon} iconClass={m.cls} time={a.time}
                  title={<><b className="font-semibold">{a.bold}</b>{a.title}</>} sub={a.sub} />;
              })}
            </div>
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader><CardTitle>Élèves à risque</CardTitle><span className="font-mono text-[9px] text-ghost ml-auto tracking-wider">HEALTH SCORE</span></CardHeader>
              <div>
                {risk.length === 0 && <div className="px-4 py-5 text-sm text-muted">Aucun élève à risque 👍</div>}
                {risk.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0">
                    <div className="w-12"><HealthScore score={s.score} /></div>
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-sm font-semibold uppercase tracking-wide">{s.name}</div>
                      <div className="text-[11px] text-muted">{s.why}</div>
                    </div>
                    <Link href={`/eleves/${s.id}`} className="font-display text-xs font-semibold uppercase tracking-wide text-acid whitespace-nowrap">Voir</Link>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader><CardTitle>Cette semaine</CardTitle><span className="font-mono text-[9px] text-ghost ml-auto tracking-wider">PLANNING</span></CardHeader>
              <div>
                {week.length === 0 && <div className="px-4 py-5 text-sm text-muted">Aucune séance planifiée.</div>}
                {week.map((w, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-line last:border-0">
                    <span className="font-mono text-[10px] text-ghost w-8 uppercase">{w.day}</span>
                    <Badge variant={w.type === "cours" ? "cours" : "open"}>{w.type === "cours" ? "COURS" : "OUV."}</Badge>
                    <span className="text-xs">{w.title}</span>
                    <span className="font-mono text-[10px] text-ghost ml-auto">{w.meta}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
