import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui";
import { PlanningEvent } from "@/components/coach/planning-event";
import { createClient } from "@/lib/supabase/server";
import { getPlanning } from "@/lib/queries";

export default async function PlanningPage({ searchParams }: { searchParams: { w?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const weekOffset = parseInt(searchParams.w ?? "0", 10) || 0;
  const planning = await getPlanning(supabase, user!.id, weekOffset);

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center gap-4 px-7 py-4 border-b border-line">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Planning</h1>
        <div className="flex items-center gap-2 ml-4">
          <Link href={`/planning?w=${weekOffset - 1}`} aria-label="Semaine précédente" className="flex items-center justify-center w-9 h-9 rounded-md text-muted hover:text-text hover:bg-surf transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70"><ChevronLeft size={18} /></Link>
          <span className="font-mono text-xs text-muted w-44 text-center">{planning.label}</span>
          <Link href={`/planning?w=${weekOffset + 1}`} aria-label="Semaine suivante" className="flex items-center justify-center w-9 h-9 rounded-md text-muted hover:text-text hover:bg-surf transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70"><ChevronRight size={18} /></Link>
        </div>
        <Link href="/planning/nouveau" className="ml-auto"><Button>+ Créer un cours</Button></Link>
      </header>

      <div className="flex items-center gap-4 px-7 py-3 border-b border-line">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-acid"></span><span className="font-mono text-[10px] uppercase tracking-wider text-muted">Cours collectif</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-violet"></span><span className="font-mono text-[10px] uppercase tracking-wider text-muted">Séance ouverte</span></div>
        <div className="flex items-center gap-2 ml-auto">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">Séances ouvertes</span>
          <div className="w-9 h-5 rounded-full bg-acid/30 relative" title="Gouvernance : activées">
            <div className="absolute right-0.5 top-0.5 w-4 h-4 rounded-full bg-acid"></div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-7 py-5">
        <div className="grid grid-cols-7 gap-2.5 min-w-[940px]">
          {planning.days.map((col, ci) => (
            <div key={ci}>
              <div className="flex items-baseline gap-1.5 px-1 pb-2 border-b border-line mb-2.5">
                <span className="font-display text-sm font-semibold uppercase tracking-wide">{col.day}</span>
                <span className="font-mono text-[11px] text-ghost">{col.date}</span>
              </div>
              <div className="space-y-2">
                {col.events.map((e, i) => <PlanningEvent key={i} e={e} />)}
                {col.events.length === 0 && (
                  <Link href={`/planning/nouveau?date=${col.isoDate}`} className="w-full rounded-md border border-dashed border-line2 text-ghost hover:text-muted py-3 flex items-center justify-center transition">
                    <Plus size={14} />
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
