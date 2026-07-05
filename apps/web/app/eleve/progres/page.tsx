import Link from "next/link";
import { TrendingUp, Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle, Button, KpiTile, EmptyState } from "@/components/ui";
import { EvolutionChart } from "@/components/coach/evolution-chart";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgress } from "@/lib/queries";

export default async function EleveProgresPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const p = await getStudentProgress(supabase, user!.id);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      <header className="px-4 md:px-7 py-4 border-b border-line">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Mes progrès</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-7 py-6 space-y-5">
        {!p.hasEntries ? (
          <EmptyState
            icon={TrendingUp}
            title="Pas encore de données"
            description="Logue tes séances pour voir tes courbes de charge, tes records et ta régularité apparaître ici."
            action={<Link href="/eleve/seance"><Button>Démarrer ma séance</Button></Link>}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl">
              <KpiTile label="Semaines actives d'affilée" value={String(p.streak)} accent />
              <KpiTile label="Exos logués (30 j)" value={String(p.monthCount)} />
              <KpiTile label="Records personnels" value={String(p.prs.length)} />
            </div>

            {p.prs.length > 0 && (
              <Card className="max-w-2xl">
                <CardHeader><CardTitle>Records personnels</CardTitle><Trophy size={14} className="text-acid ml-auto" /></CardHeader>
                <div>
                  {p.prs.slice(0, 6).map((pr, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-line last:border-0">
                      <span className="font-display text-[13px] font-semibold uppercase tracking-wide flex-1">{pr.name}</span>
                      <span className="font-mono text-sm text-acid">{pr.load} kg</span>
                      <span className="font-mono text-[10px] text-ghost w-14 text-right">{pr.date}</span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {p.charts.length > 0 && (
              <div className="grid lg:grid-cols-2 gap-4">
                {p.charts.map((c, i) => (
                  <Card key={i}>
                    <CardHeader><CardTitle>{c.name}</CardTitle><span className="font-mono text-[9px] text-ghost ml-auto tracking-wider">CHARGE RÉELLE</span></CardHeader>
                    <div className="p-4">
                      <EvolutionChart data={c.data} labels={c.labels} yMin={c.yMin} yMax={c.yMax} />
                    </div>
                  </Card>
                ))}
              </div>
            )}
            {p.charts.length === 0 && (
              <p className="text-sm text-muted max-w-md">Logue le même exercice au moins deux fois (avec une charge) pour voir ta courbe de progression.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
