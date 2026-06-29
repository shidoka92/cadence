import { Card, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getStudentJournal } from "@/lib/queries";
import { addJournalEntry } from "./actions";

export default async function EleveJournalPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const entries = await getStudentJournal(supabase, user!.id);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      <header className="px-4 md:px-7 py-4 border-b border-line">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Journal</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-7 py-6 space-y-5 max-w-2xl">
        <Card>
          <CardHeader><CardTitle>Nouvelle entrée</CardTitle></CardHeader>
          <form action={addJournalEntry} className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Input name="sessionRef" placeholder="Séance (ex: Séance A)" />
              <Input name="exercise" placeholder="Exercice" required />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Input name="load" type="number" step="0.5" placeholder="Charge (kg)" />
              <Input name="reps" type="number" placeholder="Reps" />
              <Input name="rpe" type="number" min="1" max="10" placeholder="RPE" />
            </div>
            <Input name="note" placeholder="Note (ex: douleur, sensation…)" />
            <Button type="submit">Ajouter au journal</Button>
          </form>
        </Card>

        <Card>
          <CardHeader><CardTitle>Historique</CardTitle></CardHeader>
          <div>
            {entries.length === 0 && <div className="px-4 py-5 text-sm text-muted">Aucune entrée pour l&apos;instant.</div>}
            {entries.map((j) => (
              <div key={j.id} className="flex items-center gap-3 px-4 py-3 border-b border-line last:border-0">
                <span className="font-mono text-[10px] text-ghost w-9 uppercase">{j.day}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-display text-[13px] font-semibold uppercase tracking-wide">{j.exercise}</div>
                  <div className="font-mono text-[11px] text-muted">
                    {[j.load != null ? `${j.load} kg` : null, j.reps != null ? `${j.reps} reps` : null, j.rpe != null ? `RPE ${j.rpe}` : null].filter(Boolean).join(" · ") || j.note || j.sessionRef}
                  </div>
                </div>
                <span className="font-mono text-[10px] text-ghost whitespace-nowrap">{j.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
