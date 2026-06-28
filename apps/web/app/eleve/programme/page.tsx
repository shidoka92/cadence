import { Card, CardHeader, CardTitle, Button, Input } from "@/components/ui";
import { ProgramViewer } from "@/components/student/program-viewer";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgram } from "@/lib/queries";
import { addAnnotation } from "./actions";

export default async function EleveProgrammePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const program = await getStudentProgram(supabase, user!.id);

  return (
    <div className="flex flex-col h-screen">
      <header className="px-7 py-4 border-b border-line">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Mon programme</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-7 py-6 space-y-5">
        {!program ? (
          <p className="text-sm text-muted">Aucun programme assigné pour le moment.</p>
        ) : (
          <>
            <ProgramViewer title={program.title} plan={program.plan} />

            <Card className="max-w-2xl">
              <CardHeader><CardTitle>Commentaires</CardTitle></CardHeader>
              <div>
                {program.annotations.length === 0 && <div className="px-4 py-5 text-sm text-muted">Aucun commentaire pour l&apos;instant.</div>}
                {program.annotations.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 px-4 py-3 border-b border-line last:border-0">
                    <span className="font-display text-xs font-semibold uppercase tracking-wide text-acid shrink-0">{a.author === "coach" ? "Coach" : "Toi"}</span>
                    <span className="text-sm flex-1">{a.body}</span>
                    <span className="font-mono text-[10px] text-ghost whitespace-nowrap">{a.time}</span>
                  </div>
                ))}
              </div>
              <form action={addAnnotation} className="flex items-center gap-2.5 px-4 py-3 border-t border-line">
                <input type="hidden" name="programId" value={program.id} />
                <Input name="body" placeholder="Écrire un commentaire sur ton programme…" autoComplete="off" className="flex-1" />
                <Button type="submit">Envoyer</Button>
              </form>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
