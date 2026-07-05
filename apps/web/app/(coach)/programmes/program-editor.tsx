"use client";
import { useState } from "react";
import { ChevronRight, AlertTriangle, Plus, X, Minus } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button, Badge, Card, CardHeader, CardTitle, Input } from "@/components/ui";
import type { Plan } from "@cadence/types";
import { flattenPlanRefs, encodeRef } from "@/lib/plan";
import { savePlan, saveAsTemplate, addCoachAnnotation } from "./actions";

type Annotation = { id: string; author: "coach" | "student"; body: string; time: string; anchorLabel: string | null };

const COLORS = ["acid", "violet", "warn"] as const;
const tint: Record<string, string> = {
  acid: "bg-acid/10 border-acid/40", violet: "bg-violet/10 border-violet/40", warn: "bg-warn/10 border-warn/40",
};
const textTint: Record<string, string> = { acid: "text-acid", violet: "text-violet", warn: "text-warn" };
const colorOf = (i: number) => COLORS[i % COLORS.length];
const uid = () => Math.random().toString(36).slice(2, 10);
const inlineInput = "bg-transparent border border-transparent hover:border-line2 focus:border-acid rounded px-1.5 py-1 outline-none transition w-full";

function renumber(plan: Plan) { let w = 1; for (const b of plan.blocks) b.weeks = b.weeks.map(() => w++); }

export function ProgramEditor({ programId, title: initialTitle, student, initialPlan, annotations }: {
  programId: string; title: string; student: string; initialPlan: Plan; annotations: Annotation[];
}) {
  const [plan, setPlan] = useState<Plan>(initialPlan);
  const [title, setTitle] = useState(initialTitle);
  const [zoom, setZoom] = useState<"macro" | "bloc" | "seance">("macro");
  const [bi, setBi] = useState(0);
  const [si, setSi] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tplState, setTplState] = useState<"idle" | "saving" | "saved">("idle");

  const bloc = plan.blocks[bi];
  const session = bloc?.sessions[si];
  const totalWeeks = plan.blocks.reduce((n, b) => n + b.weeks.length, 0);

  function mutate(fn: (p: Plan) => void) {
    setPlan((p) => { const np: Plan = structuredClone(p); fn(np); return np; });
    setDirty(true);
  }

  // blocs
  const renameBlock = (i: number, focus: string) => mutate((p) => { p.blocks[i].focus = focus; });
  const addBlock = () => mutate((p) => { p.blocks.push({ id: uid(), focus: "Nouveau bloc", weeks: [0], sessions: [{ id: uid(), name: "Séance A", exercises: [] }] }); renumber(p); });
  const removeBlock = (i: number) => mutate((p) => { p.blocks.splice(i, 1); renumber(p); if (bi >= p.blocks.length) setBi(Math.max(0, p.blocks.length - 1)); });
  function changeWeeks(i: number, delta: number) {
    mutate((p) => {
      const b = p.blocks[i];
      if (delta > 0) { b.weeks.push(0); for (const s of b.sessions) for (const e of s.exercises) e.cells.push({ v: e.cells[e.cells.length - 1]?.v ?? "—" }); }
      else if (b.weeks.length > 1) { b.weeks.pop(); for (const s of b.sessions) for (const e of s.exercises) e.cells.pop(); }
      renumber(p);
    });
  }
  // séances
  const renameSession = (i: number, name: string) => mutate((p) => { p.blocks[bi].sessions[i].name = name; });
  const addSession = () => mutate((p) => { p.blocks[bi].sessions.push({ id: uid(), name: "Nouvelle séance", exercises: [] }); });
  const removeSession = (i: number) => mutate((p) => { p.blocks[bi].sessions.splice(i, 1); if (si >= p.blocks[bi].sessions.length) setSi(Math.max(0, p.blocks[bi].sessions.length - 1)); });
  // exercices
  const renameExercise = (i: number, name: string) => mutate((p) => { p.blocks[bi].sessions[si].exercises[i].name = name; });
  const setRule = (i: number, rule: string) => mutate((p) => { p.blocks[bi].sessions[si].exercises[i].rule = rule; });
  const addExercise = () => mutate((p) => { const len = p.blocks[bi].weeks.length; p.blocks[bi].sessions[si].exercises.push({ id: uid(), name: "Nouvel exercice", rule: "", cells: Array.from({ length: len }, () => ({ v: "—" })) }); });
  const removeExercise = (i: number) => mutate((p) => { p.blocks[bi].sessions[si].exercises.splice(i, 1); });
  const editCell = (ei: number, wi: number, v: string) => mutate((p) => { const c = p.blocks[bi].sessions[si].exercises[ei].cells[wi]; c.v = v; c.over = true; });
  const resetCell = (ei: number, wi: number) => mutate((p) => { p.blocks[bi].sessions[si].exercises[ei].cells[wi].over = false; });

  async function onSave() {
    setSaving(true); setError(null);
    const r = await savePlan(programId, plan, title);
    setSaving(false);
    if (r.ok) setDirty(false); else setError(r.error);
  }

  async function onSaveTemplate() {
    setTplState("saving"); setError(null);
    const r = await saveAsTemplate(title, plan);
    if (!r.ok) { setTplState("idle"); setError(r.error); return; }
    setTplState("saved");
    setTimeout(() => setTplState("idle"), 2000);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      <header className="flex items-center gap-4 px-4 md:px-7 py-4 border-b border-line">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <input value={title} onChange={(e) => { setTitle(e.target.value); setDirty(true); }}
              className={cn("font-display text-2xl font-semibold uppercase tracking-wide", inlineInput)} />
            <Badge variant="cours" className="shrink-0">{plan.blocks.length} blocs · {totalWeeks} sem</Badge>
            {dirty && <span className="w-2 h-2 rounded-full bg-warn shrink-0" title="Non enregistré" />}
          </div>
          <div className="text-xs text-muted mt-0.5 px-1.5">Pour {student}</div>
        </div>
        <div className="ml-auto flex items-center gap-2.5 shrink-0">
          {error && <span role="alert" className="text-xs text-risk">{error}</span>}
          <Button variant="secondary" onClick={onSaveTemplate} disabled={tplState === "saving"}>
            {tplState === "saved" ? "Modèle enregistré ✓" : tplState === "saving" ? "Enregistrement…" : "Enregistrer comme modèle"}
          </Button>
          <Button onClick={onSave} disabled={!dirty || saving}>{saving ? "Enregistrement…" : dirty ? "Enregistrer" : "Enregistré ✓"}</Button>
        </div>
      </header>

      <div className="flex items-center gap-1.5 px-4 md:px-7 py-2.5 border-b border-line text-xs">
        <button onClick={() => setZoom("macro")} className={cn("font-display uppercase tracking-wide", zoom === "macro" ? "text-acid" : "text-muted")}>Macro</button>
        {zoom !== "macro" && bloc && <><ChevronRight size={12} className="text-ghost" /><button onClick={() => setZoom("bloc")} className={cn("font-display uppercase tracking-wide", zoom === "bloc" ? "text-acid" : "text-muted")}>Bloc · {bloc.focus}</button></>}
        {zoom === "seance" && session && <><ChevronRight size={12} className="text-ghost" /><span className="font-display uppercase tracking-wide text-acid">{session.name}</span></>}
      </div>

      <div className="flex-1 overflow-auto px-4 md:px-7 py-6">
        {/* MACRO */}
        {zoom === "macro" && (
          <div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-ghost mb-3">Périodisation — édite, ajoute ou ouvre un bloc</div>
            <div className="flex gap-2 items-stretch mb-2 overflow-x-auto">
              {plan.blocks.map((b, i) => (
                <div key={b.id} style={{ flexGrow: b.weeks.length, flexBasis: 0 }} className={cn("rounded-md border p-3 relative group min-w-[150px]", tint[colorOf(i)])}>
                  <button onClick={() => removeBlock(i)} aria-label="Supprimer le bloc" className="absolute top-1.5 right-1.5 text-ghost hover:text-risk opacity-0 group-hover:opacity-100 transition"><X size={13} /></button>
                  <input value={b.focus} onChange={(e) => renameBlock(i, e.target.value)} className={cn("font-display font-semibold uppercase tracking-wide", textTint[colorOf(i)], inlineInput)} />
                  <div className="flex items-center gap-2 mt-1 px-1.5">
                    <span className="font-mono text-[10px] text-muted">S{b.weeks[0]}–S{b.weeks[b.weeks.length - 1]}</span>
                    <div className="flex items-center gap-1 ml-auto">
                      <button onClick={() => changeWeeks(i, -1)} aria-label="Retirer une semaine" className="w-4 h-4 rounded bg-surf2 border border-line2 text-muted flex items-center justify-center"><Minus size={10} /></button>
                      <span className="font-mono text-[10px] text-ghost w-7 text-center">{b.weeks.length} sem</span>
                      <button onClick={() => changeWeeks(i, 1)} aria-label="Ajouter une semaine" className="w-4 h-4 rounded bg-surf2 border border-line2 text-muted flex items-center justify-center"><Plus size={10} /></button>
                    </div>
                  </div>
                  <button onClick={() => { setBi(i); setSi(0); setZoom("bloc"); }} className="mt-2 w-full text-center font-display text-[10px] font-semibold uppercase tracking-wide text-acid border-t border-line/50 pt-1.5">Ouvrir →</button>
                </div>
              ))}
              <button onClick={addBlock} className="rounded-md border border-dashed border-line2 text-ghost hover:text-muted px-4 flex items-center justify-center shrink-0"><Plus size={16} /></button>
            </div>
          </div>
        )}

        {/* BLOC */}
        {zoom === "bloc" && bloc && (
          <div className="max-w-2xl">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ghost mb-3">Séances du bloc — renomme, ouvre, ou ajoute</div>
            <div className="space-y-2">
              {bloc.sessions.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-2 bg-surf border border-line rounded-md px-3 py-2.5">
                  <input value={s.name} onChange={(e) => renameSession(idx, e.target.value)} className={cn("font-display text-sm font-semibold uppercase tracking-wide flex-1", inlineInput)} />
                  <span className="font-mono text-[10px] text-ghost">{s.exercises.length} exos</span>
                  <button onClick={() => { setSi(idx); setZoom("seance"); }} className="font-display text-xs font-semibold uppercase tracking-wide text-acid px-2">Ouvrir</button>
                  <button onClick={() => removeSession(idx)} aria-label="Supprimer la séance" className="text-ghost hover:text-risk"><X size={14} /></button>
                </div>
              ))}
              <button onClick={addSession} className="w-full rounded-md border border-dashed border-line2 text-ghost hover:text-muted py-2.5 flex items-center justify-center gap-1.5 text-xs font-display uppercase tracking-wide"><Plus size={14} /> Séance</button>
            </div>
          </div>
        )}

        {/* SÉANCE */}
        {zoom === "seance" && bloc && session && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="font-mono text-[10px] uppercase tracking-widest text-ghost">Matrice — édite une cellule pour un override, le × la repasse en auto</div>
              <div className="flex items-center gap-3 font-mono text-[10px] text-muted">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-surf2 border border-line2"></span>auto</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-warn/20 border border-warn/50"></span>override</span>
              </div>
            </div>
            <div className="border border-line rounded-lg overflow-x-auto">
              <div className="grid items-stretch min-w-[600px]" style={{ gridTemplateColumns: `180px 120px repeat(${bloc.weeks.length}, 1fr) 36px` }}>
                <div className="bg-surf2 px-3 py-2.5 font-mono text-[10px] uppercase text-ghost">Exercice</div>
                <div className="bg-surf2 px-3 py-2.5 font-mono text-[10px] uppercase text-ghost border-l border-line">Règle</div>
                {bloc.weeks.map((w) => <div key={w} className="bg-surf2 px-2 py-2.5 font-mono text-[10px] uppercase text-ghost border-l border-line text-center">S{w}</div>)}
                <div className="bg-surf2 border-l border-line" />
                {session.exercises.map((ex, ei) => (
                  <Row key={ex.id}>
                    <div className="bg-surf px-2 py-2 border-t border-line flex items-center gap-1">
                      {ex.flag && <AlertTriangle size={12} className="text-warn shrink-0" />}
                      <input value={ex.name} onChange={(e) => renameExercise(ei, e.target.value)} className={cn("font-display text-[13px] font-semibold uppercase tracking-wide", inlineInput)} />
                    </div>
                    <input value={ex.rule ?? ""} onChange={(e) => setRule(ei, e.target.value)} placeholder="règle…" className={cn("bg-surf px-2 py-2 border-t border-l border-line font-mono text-[10px] text-acid outline-none focus:bg-surf2")} />
                    {ex.cells.map((c, wi) => (
                      <div key={wi} className="bg-surf px-1.5 py-2 border-t border-l border-line relative">
                        <input value={c.v} onChange={(e) => editCell(ei, wi, e.target.value)}
                          className={cn("w-full rounded border px-1 py-1.5 font-mono text-xs text-center outline-none focus:border-acid", c.over ? "border-warn/50 bg-warn/10 text-warn" : "border-line2 bg-surf2 text-text")} />
                        {c.over && <button onClick={() => resetCell(ei, wi)} title="auto" aria-label="Repasser en auto" className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-surf2 border border-line2 text-ghost text-[8px] leading-none">×</button>}
                      </div>
                    ))}
                    <button onClick={() => removeExercise(ei)} aria-label="Supprimer l'exercice" className="bg-surf border-t border-l border-line text-ghost hover:text-risk flex items-center justify-center"><X size={13} /></button>
                  </Row>
                ))}
              </div>
            </div>
            <button onClick={addExercise} className="mt-2 w-full rounded-md border border-dashed border-line2 text-ghost hover:text-muted py-2.5 flex items-center justify-center gap-1.5 text-xs font-display uppercase tracking-wide"><Plus size={14} /> Exercice</button>
          </div>
        )}

        <Card className="max-w-2xl mt-6">
          <CardHeader><CardTitle>Commentaires</CardTitle></CardHeader>
          <div>
            {annotations.length === 0 && <div className="px-4 py-5 text-sm text-muted">Aucun commentaire pour l&apos;instant.</div>}
            {annotations.map((a) => (
              <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-line last:border-0">
                <span className="font-display text-xs font-semibold uppercase tracking-wide text-acid shrink-0">{a.author === "coach" ? "Toi" : student}</span>
                <div className="flex-1">
                  {a.anchorLabel && <Badge variant="default" className="mb-1">{a.anchorLabel}</Badge>}
                  <p className="text-sm">{a.body}</p>
                </div>
                <span className="font-mono text-[10px] text-ghost whitespace-nowrap">{a.time}</span>
              </div>
            ))}
          </div>
          <form action={addCoachAnnotation} className="flex flex-col gap-2.5 px-4 py-3 border-t border-line">
            <input type="hidden" name="programId" value={programId} />
            <select name="anchor" defaultValue="" className="bg-surf2 border border-line2 rounded-md px-3 py-2 text-xs text-muted outline-none focus:border-acid/60">
              <option value="">Commentaire général sur le programme</option>
              {flattenPlanRefs(plan).map((ref) => (
                <option key={encodeRef(ref)} value={encodeRef(ref)}>{ref.label}</option>
              ))}
            </select>
            <div className="flex items-center gap-2.5">
              <Input name="body" placeholder={`Répondre à ${student}…`} autoComplete="off" className="flex-1" />
              <Button type="submit">Envoyer</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) { return <>{children}</>; }
