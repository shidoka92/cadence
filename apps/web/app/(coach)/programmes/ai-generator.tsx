"use client";
import { useFormState, useFormStatus } from "react-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { Card, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { generateProgramWithAI, type AiGenState } from "./actions";

type Student = { id: string; name: string };

const initialState: AiGenState = { error: null };
const fieldClass =
  "w-full bg-surf border border-line rounded-md px-3 py-2 text-sm text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} className="gap-2">
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
      {pending ? "Génération en cours…" : "Générer le brouillon"}
    </Button>
  );
}

export function AiGenerator({ students }: { students: Student[] }) {
  const [state, formAction] = useFormState(generateProgramWithAI, initialState);
  const hasStudents = students.length > 0;

  return (
    <Card className="mb-6">
      <CardHeader>
        <Sparkles size={14} className="text-acid" />
        <CardTitle>Cadence IA · Générateur de programme</CardTitle>
      </CardHeader>
      <form action={formAction} className="p-4 flex flex-col gap-3.5 max-w-2xl">
        <p className="text-[13px] text-muted">
          Cadence propose un brouillon périodisé à partir du profil de l&apos;élève et de ses séances loguées. Tu le relis, l&apos;édites et le signes : rien n&apos;est envoyé sans ta validation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ghost">Élève</span>
            <select name="studentId" required defaultValue="" className={fieldClass} aria-label="Élève">
              <option value="" disabled>Choisir…</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ghost">Semaines</span>
            <Input type="number" name="weeks" min={2} max={16} defaultValue={8} className="w-24" aria-label="Nombre de semaines" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-ghost">Séances/sem.</span>
            <Input type="number" name="sessionsPerWeek" min={1} max={6} defaultValue={3} className="w-24" aria-label="Séances par semaine" />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-widest text-ghost">Consignes (optionnel)</span>
          <textarea
            name="focus"
            rows={2}
            placeholder="Ex. priorité haut du corps, matériel limité, préparer une compétition en mars…"
            className={fieldClass}
          />
        </label>

        {state.error && (
          <p role="alert" className="text-[13px] text-risk">{state.error}</p>
        )}
        {!hasStudents && (
          <p className="text-[13px] text-warn">Invite au moins un élève avant de générer un programme.</p>
        )}

        <div>
          <SubmitButton disabled={!hasStudents} />
        </div>
      </form>
    </Card>
  );
}
