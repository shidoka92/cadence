"use client";
import { useState, Fragment } from "react";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui";
import type { Plan } from "@cadence/types";

const COLORS = ["acid", "violet", "warn"] as const;
const tint: Record<string, string> = {
  acid: "bg-acid/10 border-acid/40", violet: "bg-violet/10 border-violet/40", warn: "bg-warn/10 border-warn/40",
};
const textTint: Record<string, string> = { acid: "text-acid", violet: "text-violet", warn: "text-warn" };
const colorOf = (i: number) => COLORS[i % COLORS.length];

export function ProgramViewer({ title, plan }: { title: string; plan: Plan }) {
  const [zoom, setZoom] = useState<"macro" | "bloc" | "seance">("macro");
  const [bi, setBi] = useState(0);
  const [si, setSi] = useState(0);

  const bloc = plan.blocks[bi];
  const session = bloc?.sessions[si];
  const totalWeeks = plan.blocks.reduce((n, b) => n + b.weeks.length, 0);

  return (
    <div>
      <div className="flex items-center gap-2.5 mb-3">
        <h2 className="font-display text-xl font-semibold uppercase tracking-wide">{title}</h2>
        <Badge variant="cours">{plan.blocks.length} blocs · {totalWeeks} sem</Badge>
      </div>

      <div className="flex items-center gap-1.5 mb-4 text-xs">
        <button onClick={() => setZoom("macro")} className={cn("font-display uppercase tracking-wide", zoom === "macro" ? "text-acid" : "text-muted")}>Macro</button>
        {zoom !== "macro" && bloc && <><ChevronRight size={12} className="text-ghost" /><button onClick={() => setZoom("bloc")} className={cn("font-display uppercase tracking-wide", zoom === "bloc" ? "text-acid" : "text-muted")}>Bloc · {bloc.focus}</button></>}
        {zoom === "seance" && session && <><ChevronRight size={12} className="text-ghost" /><span className="font-display uppercase tracking-wide text-acid">{session.name}</span></>}
      </div>

      {zoom === "macro" && (
        <div className="flex gap-2 items-stretch overflow-x-auto">
          {plan.blocks.map((b, i) => (
            <div key={b.id} style={{ flexGrow: b.weeks.length, flexBasis: 0 }} className={cn("rounded-md border p-3 min-w-[140px]", tint[colorOf(i)])}>
              <div className={cn("font-display font-semibold uppercase tracking-wide", textTint[colorOf(i)])}>{b.focus}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="font-mono text-[10px] text-muted">S{b.weeks[0]}–S{b.weeks[b.weeks.length - 1]}</span>
                <span className="font-mono text-[10px] text-ghost ml-auto">{b.weeks.length} sem</span>
              </div>
              <button onClick={() => { setBi(i); setSi(0); setZoom("bloc"); }} className="mt-2 w-full text-center font-display text-[10px] font-semibold uppercase tracking-wide text-acid border-t border-line/50 pt-1.5">Ouvrir →</button>
            </div>
          ))}
        </div>
      )}

      {zoom === "bloc" && bloc && (
        <div className="max-w-2xl space-y-2">
          {bloc.sessions.map((s, idx) => (
            <div key={s.id} className="flex items-center gap-2 bg-surf border border-line rounded-md px-3 py-2.5">
              <span className="font-display text-sm font-semibold uppercase tracking-wide flex-1">{s.name}</span>
              <span className="font-mono text-[10px] text-ghost">{s.exercises.length} exos</span>
              <button onClick={() => { setSi(idx); setZoom("seance"); }} className="font-display text-xs font-semibold uppercase tracking-wide text-acid px-2">Ouvrir</button>
            </div>
          ))}
        </div>
      )}

      {zoom === "seance" && bloc && session && (
        <div className="border border-line rounded-lg overflow-x-auto">
          <div className="grid items-stretch min-w-[560px]" style={{ gridTemplateColumns: `180px 120px repeat(${bloc.weeks.length}, 1fr)` }}>
            <div className="bg-surf2 px-3 py-2.5 font-mono text-[10px] uppercase text-ghost">Exercice</div>
            <div className="bg-surf2 px-3 py-2.5 font-mono text-[10px] uppercase text-ghost border-l border-line">Règle</div>
            {bloc.weeks.map((w) => <div key={w} className="bg-surf2 px-2 py-2.5 font-mono text-[10px] uppercase text-ghost border-l border-line text-center">S{w}</div>)}
            {session.exercises.map((ex) => (
              <Fragment key={ex.id}>
                <div className="bg-surf px-2 py-2 border-t border-line flex items-center gap-1">
                  {ex.flag && <AlertTriangle size={12} className="text-warn shrink-0" />}
                  <span className="font-display text-[13px] font-semibold uppercase tracking-wide">{ex.name}</span>
                </div>
                <div className="bg-surf px-2 py-2 border-t border-l border-line font-mono text-[10px] text-acid">{ex.rule}</div>
                {ex.cells.map((c, wi) => (
                  <div key={wi} className={cn("px-1.5 py-2 border-t border-l border-line text-center font-mono text-xs", c.over ? "bg-warn/10 text-warn" : "bg-surf text-text")}>{c.v}</div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
