"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Badge, Button, Input } from "@/components/ui";
import type { Plan } from "@cadence/types";
import { logSession, type SessionEntryInput } from "@/app/eleve/seance/actions";

type Phase = "pick" | "run" | "done";

export function SessionRunner({ plan, currentWeek }: { plan: Plan; currentWeek: number }) {
  const [phase, setPhase] = useState<Phase>("pick");
  const [bi, setBi] = useState(0);
  const [si, setSi] = useState(0);
  const [weekIdx, setWeekIdx] = useState(0);
  const [step, setStep] = useState(0);
  const [logged, setLogged] = useState<SessionEntryInput[]>([]);
  const [load, setLoad] = useState("");
  const [reps, setReps] = useState("");
  const [rpe, setRpe] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prCount, setPrCount] = useState(0);

  const bloc = plan.blocks[bi];
  const session = bloc?.sessions[si];
  const exercise = session?.exercises[step];

  function start(blockIdx: number, sessionIdx: number) {
    const b = plan.blocks[blockIdx];
    const idx = b.weeks.indexOf(currentWeek);
    setBi(blockIdx);
    setSi(sessionIdx);
    setWeekIdx(idx >= 0 ? idx : 0);
    setStep(0);
    setLogged([]);
    setPhase("run");
  }

  function resetInputs() { setLoad(""); setReps(""); setRpe(""); setNote(""); }

  function next(save: boolean) {
    if (save && exercise) {
      setLogged((l) => [...l, {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        load: load ? parseFloat(load.replace(",", ".")) : null,
        reps: reps ? parseInt(reps, 10) : null,
        rpe: rpe ? parseInt(rpe, 10) : null,
        note: note.trim() || null,
      }]);
    }
    resetInputs();
    setStep((s) => s + 1);
  }

  async function finish() {
    if (!session) return;
    setSaving(true);
    setError(null);
    const r = await logSession(session.id, session.name, logged);
    setSaving(false);
    if (!r.ok) { setError(r.error); return; }
    setPrCount(r.prCount);
    setPhase("done");
  }

  /* ---------- choix de la séance ---------- */
  if (phase === "pick") {
    return (
      <div className="space-y-5 max-w-md">
        {plan.blocks.map((b, bIdx) => {
          const isCurrent = b.weeks.includes(currentWeek);
          return (
            <div key={b.id}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-ghost">{b.focus} · S{b.weeks[0]}–S{b.weeks[b.weeks.length - 1]}</span>
                {isCurrent && <Badge variant="now">Semaine en cours</Badge>}
              </div>
              <div className="space-y-2">
                {b.sessions.map((s, sIdx) => (
                  <button
                    key={s.id}
                    onClick={() => start(bIdx, sIdx)}
                    disabled={s.exercises.length === 0}
                    className={cn(
                      "w-full flex items-center gap-3 bg-surf border rounded-md px-4 py-3.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70",
                      isCurrent ? "border-acid/40 hover:bg-hover" : "border-line hover:bg-hover",
                      s.exercises.length === 0 && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <span className="font-display text-sm font-semibold uppercase tracking-wide flex-1">{s.name}</span>
                    <span className="font-mono text-[10px] text-ghost">{s.exercises.length} exos</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  /* ---------- fin de séance ---------- */
  if (phase === "done") {
    return (
      <div className="max-w-md text-center py-10">
        <div className="text-4xl mb-3">💪</div>
        <h2 className="font-display text-xl font-semibold uppercase tracking-wide mb-2">Séance enregistrée</h2>
        <p className="text-sm text-muted mb-1">{logged.length} exercice{logged.length > 1 ? "s" : ""} logué{logged.length > 1 ? "s" : ""} — ton coach voit ta progression.</p>
        {prCount > 0 && <p className="text-sm text-acid font-semibold mb-1">{prCount} nouveau{prCount > 1 ? "x" : ""} record{prCount > 1 ? "s" : ""} personnel{prCount > 1 ? "s" : ""} 🎉</p>}
        <div className="flex justify-center gap-2.5 mt-6">
          <Link href="/eleve/accueil"><Button variant="secondary">Accueil</Button></Link>
          <Link href="/eleve/journal"><Button>Voir mon journal</Button></Link>
        </div>
      </div>
    );
  }

  /* ---------- récap avant validation ---------- */
  if (!exercise) {
    return (
      <div className="max-w-md">
        <h2 className="font-display text-lg font-semibold uppercase tracking-wide mb-3">{session?.name} — récap</h2>
        {logged.length === 0 ? (
          <p className="text-sm text-muted mb-4">Aucun exercice validé.</p>
        ) : (
          <div className="bg-surf border border-line rounded-lg mb-4">
            {logged.map((e, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-2.5 border-b border-line last:border-0">
                <span className="font-display text-[13px] font-semibold uppercase tracking-wide flex-1">{e.exerciseName}</span>
                <span className="font-mono text-[11px] text-muted">
                  {[e.load != null ? `${e.load} kg` : null, e.reps != null ? `${e.reps} reps` : null, e.rpe != null ? `RPE ${e.rpe}` : null].filter(Boolean).join(" · ") || "—"}
                </span>
              </div>
            ))}
          </div>
        )}
        {error && <p role="alert" className="text-xs text-risk mb-3">{error}</p>}
        <div className="flex gap-2.5">
          <Button onClick={finish} disabled={saving || logged.length === 0}>{saving ? "Enregistrement…" : "Terminer la séance"}</Button>
          <Button variant="secondary" onClick={() => setPhase("pick")}>Annuler</Button>
        </div>
      </div>
    );
  }

  /* ---------- exercice en cours ---------- */
  const target = exercise.cells[weekIdx]?.v ?? "—";
  return (
    <div className="max-w-md">
      <div className="flex items-center gap-2.5 mb-4">
        <button onClick={() => setPhase("pick")} aria-label="Retour au choix de séance" className="flex items-center justify-center w-8 h-8 rounded-md text-muted hover:text-text hover:bg-surf transition">
          <ChevronLeft size={16} />
        </button>
        <span className="font-display text-sm font-semibold uppercase tracking-wide">{session.name}</span>
        <Badge variant="cours">S{bloc.weeks[weekIdx]}</Badge>
        <span className="font-mono text-[10px] text-ghost ml-auto">{step + 1}/{session.exercises.length}</span>
      </div>

      <div className="bg-surf border border-line rounded-lg p-5">
        <div className="font-display text-xl font-bold uppercase tracking-tight">{exercise.name}</div>
        {exercise.rule && <div className="font-mono text-[11px] text-acid mt-1">{exercise.rule}</div>}
        <div className="mt-4 mb-5 rounded-md bg-surf2 border border-line2 px-4 py-3">
          <div className="font-mono text-[9px] uppercase tracking-widest text-ghost mb-0.5">Objectif de la semaine</div>
          <div className="font-mono text-lg text-text">{target}</div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mb-3">
          <div>
            <label className="font-mono text-[9px] uppercase tracking-widest text-ghost">Charge (kg)</label>
            <Input type="number" inputMode="decimal" step="0.5" value={load} onChange={(e) => setLoad(e.target.value)} className="mt-1 text-center" />
          </div>
          <div>
            <label className="font-mono text-[9px] uppercase tracking-widest text-ghost">Reps</label>
            <Input type="number" inputMode="numeric" value={reps} onChange={(e) => setReps(e.target.value)} className="mt-1 text-center" />
          </div>
          <div>
            <label className="font-mono text-[9px] uppercase tracking-widest text-ghost">RPE</label>
            <Input type="number" inputMode="numeric" min="1" max="10" value={rpe} onChange={(e) => setRpe(e.target.value)} className="mt-1 text-center" />
          </div>
        </div>
        <Input placeholder="Note (douleur, sensation…)" value={note} onChange={(e) => setNote(e.target.value)} className="mb-4" />

        <div className="flex gap-2.5">
          <Button onClick={() => next(true)} className="flex-1 justify-center"><Check size={15} className="inline mr-1.5" />Valider l&apos;exercice</Button>
          <Button variant="ghost" onClick={() => next(false)}>Passer</Button>
        </div>
      </div>
    </div>
  );
}
