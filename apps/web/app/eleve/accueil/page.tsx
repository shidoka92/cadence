import Link from "next/link";
import { Card, CardHeader, CardTitle, Badge, HealthScore } from "@/components/ui";
import { HealthBreakdown } from "@/components/coach/health-breakdown";
import { createClient } from "@/lib/supabase/server";
import { getStudentHome } from "@/lib/queries";
import { computeAndStoreHealthScore } from "@/lib/health-score";

export default async function EleveAccueilPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  await computeAndStoreHealthScore(supabase, user!.id);
  const h = await getStudentHome(supabase, user!.id);
  const firstName = h.name.split(" ")[0];
  const today = new Date().toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }).toUpperCase();

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      <header className="flex items-center flex-wrap gap-3 gap-y-2 px-4 md:px-7 py-4 border-b border-line">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Salut, <span className="text-acid">{firstName}</span></h1>
        <span className="font-mono text-xs text-muted ml-auto">{today}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-7 py-6 space-y-4">
        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Health Score</CardTitle></CardHeader>
            <div className="p-4">
              {h.health != null ? (
                <>
                  <HealthScore score={h.health} size="lg" />
                  {h.factors.length > 0 && <div className="mt-4"><HealthBreakdown factors={h.factors} /></div>}
                </>
              ) : <p className="text-sm text-muted">Pas encore de score calculé.</p>}
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Mon programme</CardTitle>{h.program && <Badge variant="cours" className="ml-auto">{h.program.status.toUpperCase()}</Badge>}</CardHeader>
            <div className="p-4">
              {h.program ? (
                <>
                  <div className="font-display text-base font-semibold uppercase tracking-wide mb-3">{h.program.title}</div>
                  <Link href="/eleve/programme" className="font-display text-xs font-semibold uppercase tracking-wide text-acid">Voir mon programme →</Link>
                </>
              ) : <p className="text-sm text-muted">Aucun programme assigné pour le moment.</p>}
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>Prochaine séance</CardTitle></CardHeader>
            <div className="p-4">
              {h.nextSession ? (
                <div className="flex items-center gap-3">
                  <Badge variant={h.nextSession.type === "cours" ? "cours" : "open"}>{h.nextSession.type === "cours" ? "COURS" : "OUV."}</Badge>
                  <div>
                    <div className="font-display text-sm font-semibold uppercase tracking-wide">{h.nextSession.title}</div>
                    <div className="font-mono text-[11px] text-ghost mt-0.5">{h.nextSession.day} · {h.nextSession.meta}</div>
                  </div>
                </div>
              ) : <p className="text-sm text-muted">Rien de planifié pour l&apos;instant.</p>}
              <Link href="/eleve/planning" className="font-display text-xs font-semibold uppercase tracking-wide text-acid mt-3 inline-block">Voir le planning →</Link>
            </div>
          </Card>

          <Card>
            <CardHeader><CardTitle>Dernier message</CardTitle></CardHeader>
            <div className="p-4">
              {h.lastMessage ? (
                <p className="text-sm text-muted">
                  <span className="text-acid font-semibold">{h.lastMessage.fromCoach ? "Coach" : "Toi"}</span> · {h.lastMessage.time} — {h.lastMessage.body}
                </p>
              ) : <p className="text-sm text-muted">Aucun message.</p>}
              <Link href="/eleve/messagerie" className="font-display text-xs font-semibold uppercase tracking-wide text-acid mt-3 inline-block">Ouvrir la messagerie →</Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
