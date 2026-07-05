import Link from "next/link";
import { FileText, X } from "lucide-react";
import { Card, Badge, Button, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getPrograms } from "@/lib/queries";
import { deleteTemplate } from "./actions";

export default async function ProgrammesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [programs, { data: templates = [] }] = await Promise.all([
    getPrograms(supabase, user!.id),
    supabase.from("program_templates").select("id, title, plan").order("created_at", { ascending: false }),
  ]);

  return (
    <div className="px-4 md:px-7 py-6">
      <h1 className="font-display text-2xl font-semibold uppercase tracking-wide mb-5">Programmes</h1>
      {programs.length === 0 ? (
        <Card>
          <EmptyState
            icon={FileText}
            title="Aucun programme créé"
            description="Un programme se crée depuis la fiche d'un élève — ouvre-en une et assigne-lui son premier plan périodisé."
            action={<Link href="/eleves"><Button variant="secondary">Voir mes élèves</Button></Link>}
          />
        </Card>
      ) : (
        <Card>
          {programs.map((p) => (
            <Link key={p.id} href={`/programmes/${p.id}`} className="flex items-center gap-4 px-4 py-3.5 border-b border-line last:border-0 hover:bg-hover transition">
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm font-semibold uppercase tracking-wide">{p.title}</div>
                <div className="text-[11px] text-muted">Pour {p.student} · {p.blocks} blocs · {p.weeks} sem</div>
              </div>
              <Badge variant={p.status === "active" ? "cours" : "default"}>{p.status}</Badge>
            </Link>
          ))}
        </Card>
      )}

      <h2 className="font-display text-sm font-semibold uppercase tracking-wide mt-8 mb-2.5 text-muted">Mes modèles</h2>
      <Card>
        {(templates ?? []).length === 0 && (
          <div className="px-4 py-5 text-sm text-muted">
            Aucun modèle. Ouvre un programme et clique « Enregistrer comme modèle » pour le réutiliser sur tes prochains élèves.
          </div>
        )}
        {(templates ?? []).map((t) => {
          const plan = t.plan as { blocks?: { weeks?: number[] }[] };
          const blocks = plan?.blocks?.length ?? 0;
          const weeks = (plan?.blocks ?? []).reduce((n, b) => n + (b.weeks?.length ?? 0), 0);
          return (
            <div key={t.id} className="flex items-center gap-4 px-4 py-3.5 border-b border-line last:border-0">
              <div className="flex-1 min-w-0">
                <div className="font-display text-sm font-semibold uppercase tracking-wide">{t.title}</div>
                <div className="text-[11px] text-muted">{blocks} blocs · {weeks} sem</div>
              </div>
              <form action={deleteTemplate}>
                <input type="hidden" name="templateId" value={t.id} />
                <button type="submit" aria-label={`Supprimer le modèle ${t.title}`} className="flex items-center justify-center w-8 h-8 rounded-md text-ghost hover:text-risk hover:bg-surf transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acid/70">
                  <X size={14} />
                </button>
              </form>
            </div>
          );
        })}
      </Card>
    </div>
  );
}
