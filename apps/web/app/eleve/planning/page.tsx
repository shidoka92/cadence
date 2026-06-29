import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge, Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getPlanning } from "@/lib/queries";
import { enrollClass, requestOpenSession } from "./actions";

export default async function ElevePlanningPage({ searchParams }: { searchParams: { w?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("coach_id").eq("id", user!.id).single();
  const coachId = profile?.coach_id as string | null;
  const weekOffset = parseInt(searchParams.w ?? "0", 10) || 0;

  const planning = coachId ? await getPlanning(supabase, coachId, weekOffset) : null;

  const [{ data: enrollments = [] }, { data: requests = [] }] = await Promise.all([
    supabase.from("class_enrollments").select("class_id").eq("student_id", user!.id),
    supabase.from("open_session_requests").select("session_id, status").eq("student_id", user!.id),
  ]);
  const enrolledIds = new Set((enrollments ?? []).map((e: any) => e.class_id));
  const requestOf: Record<string, string> = Object.fromEntries((requests ?? []).map((r: any) => [r.session_id, r.status]));

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      <header className="flex items-center flex-wrap gap-3 gap-y-2 px-4 md:px-7 py-4 border-b border-line">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Planning</h1>
        {planning && (
          <div className="flex items-center gap-2 ml-4">
            <Link href={`/eleve/planning?w=${weekOffset - 1}`} aria-label="Semaine précédente" className="flex items-center justify-center w-9 h-9 rounded-md text-muted hover:text-text hover:bg-surf transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70"><ChevronLeft size={18} /></Link>
            <span className="font-mono text-xs text-muted w-44 text-center">{planning.label}</span>
            <Link href={`/eleve/planning?w=${weekOffset + 1}`} aria-label="Semaine suivante" className="flex items-center justify-center w-9 h-9 rounded-md text-muted hover:text-text hover:bg-surf transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70"><ChevronRight size={18} /></Link>
          </div>
        )}
        <Link href="/eleve/planning/nouveau" className="ml-auto"><Button variant="secondary"><Plus size={14} className="mr-1.5 inline" />Héberger une séance</Button></Link>
      </header>

      <div className="flex-1 overflow-auto px-4 md:px-7 py-5">
        {!planning ? (
          <p className="text-sm text-muted">Tu n&apos;es relié à aucun coach pour l&apos;instant.</p>
        ) : (
          <div className="grid grid-cols-7 gap-2.5 min-w-[1040px]">
            {planning.days.map((col, ci) => (
              <div key={ci}>
                <div className="flex items-baseline gap-1.5 px-1 pb-2 border-b border-line mb-2.5">
                  <span className="font-display text-sm font-semibold uppercase tracking-wide">{col.day}</span>
                  <span className="font-mono text-[11px] text-ghost">{col.date}</span>
                </div>
                <div className="space-y-2">
                  {col.events.map((e, i) => {
                    const isCours = e.type === "cours";
                    const enrolled = isCours && e.id ? enrolledIds.has(e.id) : false;
                    const reqStatus = !isCours && e.id ? requestOf[e.id] : undefined;
                    return (
                      <div key={i} className={cn("rounded-md border p-2.5", isCours ? "bg-acid/10 border-acid/30" : "bg-violet/10 border-violet/30")}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono text-[10px] text-ghost">{e.time}</span>
                          {isCours
                            ? <Badge variant="cours" className="ml-auto">{e.pricing === "paid" ? e.price : "INCLUS"}</Badge>
                            : <Badge variant="open" className="ml-auto">OUVERTE</Badge>}
                        </div>
                        <div className="font-display text-[13px] font-semibold uppercase tracking-wide leading-tight">{e.title}</div>
                        <div className="font-mono text-[10px] text-muted mt-1">
                          {isCours ? `${e.capacity} · ${e.level}` : `hôte ${e.host} · ${e.slots}`}
                        </div>
                        {isCours && e.id && (
                          enrolled ? (
                            <Badge variant="done" className="mt-1.5">Inscrit ✓</Badge>
                          ) : (
                            <form action={enrollClass} className="mt-1.5">
                              <input type="hidden" name="classId" value={e.id} />
                              <button type="submit" className="font-display text-[10px] font-semibold uppercase tracking-wide text-acid">
                                {e.pricing === "paid" ? `Payer ${e.price}` : "S'inscrire"}
                              </button>
                            </form>
                          )
                        )}
                        {!isCours && e.id && (
                          reqStatus ? (
                            <Badge variant={reqStatus === "accepted" ? "done" : "default"} className="mt-1.5">
                              {reqStatus === "accepted" ? "Accepté ✓" : reqStatus === "declined" ? "Refusé" : "Demande envoyée"}
                            </Badge>
                          ) : (
                            <form action={requestOpenSession} className="mt-1.5">
                              <input type="hidden" name="sessionId" value={e.id} />
                              <button type="submit" className="font-display text-[10px] font-semibold uppercase tracking-wide text-violet">Demander à rejoindre</button>
                            </form>
                          )
                        )}
                      </div>
                    );
                  })}
                  {col.events.length === 0 && <div className="text-[11px] text-ghost py-3 text-center">—</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
