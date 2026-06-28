import Link from "next/link";
import { notFound } from "next/navigation";
import { Button, Card, CardHeader, CardTitle, Badge, Avatar } from "@/components/ui";
import { HealthBreakdown } from "@/components/coach/health-breakdown";
import { EvolutionChart } from "@/components/coach/evolution-chart";
import { createClient } from "@/lib/supabase/server";
import { getStudentDetail } from "@/lib/queries";
import { createProgram } from "@/app/(coach)/programmes/actions";

function tone(score: number) { return score >= 70 ? "text-ok" : score >= 50 ? "text-warn" : "text-risk"; }

export default async function FicheElevePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const s = await getStudentDetail(supabase, params.id);
  if (!s) notFound();

  return (
    <div className="flex flex-col h-screen">
      <div className="px-7 pt-4 text-xs text-muted"><Link href="/eleves" className="text-acid">Élèves</Link> › {s.name}</div>

      <header className="flex items-center gap-4 px-7 py-5 border-b border-line">
        <Avatar initials={s.initials} className="w-16 h-16 rounded-xl text-2xl font-display font-bold" />
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight leading-none">{s.name}</h1>
          <div className="text-xs text-muted mt-1.5 flex items-center gap-2 flex-wrap">
            {s.meta}
            <Badge variant={s.subOk ? "done" : "risk"}>● {s.subscription}</Badge>
            {s.flag && <Badge variant="warn">⚠ {s.flag}</Badge>}
          </div>
        </div>
        <div className="ml-auto flex gap-2.5">
          <Link href={`/messagerie?s=${params.id}`}><Button variant="secondary">Message</Button></Link>
          <form action={createProgram}>
            <input type="hidden" name="studentId" value={params.id} />
            <Button type="submit">{s.program ? "Nouveau programme" : "Assigner un programme"}</Button>
          </form>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-7 py-5 space-y-4">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-4">
          <Card>
            <CardHeader><CardTitle>Health Score</CardTitle>{s.health.score < 70 && <span className="font-mono text-[9px] text-warn ml-auto tracking-wider">À SURVEILLER</span>}</CardHeader>
            <div className="flex items-center gap-4 px-4 py-4 border-b border-line">
              <div>
                <div className={`font-display text-6xl font-bold leading-none ${tone(s.health.score)}`}>{s.health.score}</div>
                <div className="font-mono text-[11px] text-ghost mt-1">/ 100</div>
              </div>
              {s.factors.length > 0 && <p className="text-xs text-muted leading-relaxed">Détail des facteurs ci-dessous — repère ceux en ambre pour savoir où agir.</p>}
            </div>
            <div className="p-4">{s.factors.length ? <HealthBreakdown factors={s.factors} /> : <p className="text-xs text-muted">Pas encore de score calculé.</p>}</div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Évolution</CardTitle><span className="font-mono text-[9px] text-ghost ml-auto tracking-wider">DEPUIS LE PLAN</span></CardHeader>
            <div className="p-4">
              {s.evolution ? (
                <>
                  <div className="flex gap-2 flex-wrap mb-3"><Badge variant="cours">{s.evolution.metric}</Badge></div>
                  <EvolutionChart data={s.evolution.data} labels={s.evolution.labels} yMin={s.evolution.yMin} yMax={s.evolution.yMax} />
                  <p className="text-[11px] text-muted mt-2">Charge prescrite sur la durée du programme.</p>
                </>
              ) : <p className="text-sm text-muted">Pas assez de données pour tracer une évolution.</p>}
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Programme assigné</CardTitle>{s.program && <Badge variant="cours" className="ml-auto">{s.program.status.toUpperCase()}</Badge>}</CardHeader>
            <div className="p-4">
              {s.program ? (
                <>
                  <div className="font-display text-base font-semibold uppercase tracking-wide">{s.program.title}</div>
                  <div className="font-mono text-[11px] text-muted mt-1">{s.program.meta}</div>
                  <div className="mt-3"><Link href={`/programmes/${s.program.id}`} className="font-display text-xs font-semibold uppercase tracking-wide text-acid">Ouvrir l&apos;éditeur →</Link></div>
                </>
              ) : <p className="text-sm text-muted">Aucun programme assigné.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Journal récent</CardTitle><span className="font-mono text-[9px] text-ghost ml-auto tracking-wider">RAPPORTÉ PAR L&apos;ÉLÈVE</span></CardHeader>
            <div>
              {s.journal.length === 0 && <div className="px-4 py-5 text-sm text-muted">Aucune entrée de journal.</div>}
              {s.journal.map((j, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-line last:border-0">
                  <span className="font-mono text-[10px] text-ghost w-9 uppercase">{j.day}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-display text-[13px] font-semibold uppercase tracking-wide">{j.name}</div>
                    <div className="font-mono text-[11px] text-muted">{j.data}</div>
                  </div>
                  {j.flag && <Badge variant="warn">⚠ signalé</Badge>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
