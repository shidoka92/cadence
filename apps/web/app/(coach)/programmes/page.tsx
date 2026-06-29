import Link from "next/link";
import { FileText } from "lucide-react";
import { Card, Badge, Button, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getPrograms } from "@/lib/queries";

export default async function ProgrammesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const programs = await getPrograms(supabase, user!.id);

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
    </div>
  );
}
