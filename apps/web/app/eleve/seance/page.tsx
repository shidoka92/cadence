import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";
import { SessionRunner } from "@/components/student/session-runner";
import { createClient } from "@/lib/supabase/server";
import type { Plan } from "@cadence/types";

const WEEK_MS = 7 * 864e5;

export default async function EleveSeancePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: prog } = await supabase
    .from("programs")
    .select("plan, created_at")
    .eq("student_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const plan = prog?.plan as Plan | undefined;
  const totalWeeks = plan?.blocks.reduce((n, b) => n + b.weeks.length, 0) ?? 0;
  // semaine courante estimée depuis l'assignation du programme, bornée à sa durée
  const elapsed = prog ? Math.floor((Date.now() - new Date(prog.created_at).getTime()) / WEEK_MS) + 1 : 1;
  const currentWeek = Math.min(Math.max(elapsed, 1), Math.max(totalWeeks, 1));

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      <header className="px-4 md:px-7 py-4 border-b border-line">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Ma séance</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 md:px-7 py-6">
        {!plan || plan.blocks.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title="Aucun programme assigné"
            description="Ton coach doit d'abord t'assigner un programme — ta séance guidée apparaîtra ici."
            action={<Link href="/eleve/messagerie"><Button variant="secondary">Contacter mon coach</Button></Link>}
          />
        ) : (
          <SessionRunner plan={plan} currentWeek={currentWeek} />
        )}
      </div>
    </div>
  );
}
