import { Card, CardHeader, CardTitle, Badge, Button, Input } from "@/components/ui";
import { ProgramViewer } from "@/components/student/program-viewer";
import { createClient } from "@/lib/supabase/server";
import { getStudentProgram } from "@/lib/queries";
import { flattenPlanRefs, encodeRef } from "@/lib/plan";
import { addAnnotation } from "./actions";

export default async function EleveProgrammePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const program = await getStudentProgram(supabase, user!.id);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      <header className="px-4 md:px-7 py-4 border-b border-line">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Mon programme</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-7 py-6 space-y-5">
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
                    <div className="flex-1">
                      {a.anchorLabel && <Badge variant="default" className="mb-1">{a.anchorLabel}</Badge>}
                      <p className="text-sm">{a.body}</p>
                    </div>
                    <span className="font-mono text-[10px] text-ghost whitespace-nowrap">{a.time}</span>
                  </div>
                ))}
              </div>
              <form action={addAnnotation} className="flex flex-col gap-2.5 px-4 py-3 border-t border-line">
                <input type="hidden" name="programId" value={program.id} />
                <select name="anchor" defaultValue="" className="bg-surf2 border border-line2 rounded-md px-3 py-2 text-xs text-muted outline-none focus:border-acid/60">
                  <option value="">Commentaire général sur le programme</option>
                  {flattenPlanRefs(program.plan).map((ref) => (
                    <option key={encodeRef(ref)} value={encodeRef(ref)}>{ref.label}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2.5">
                  <Input name="body" placeholder="Écrire un commentaire…" autoComplete="off" className="flex-1" />
                  <Button type="submit">Envoyer</Button>
                </div>
              </form>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
