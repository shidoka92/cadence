import Link from "next/link";
import { Users } from "lucide-react";
import { Card, Avatar, HealthScore, Button, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getRoster } from "@/lib/queries";

export default async function ElevesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const roster = await getRoster(supabase, user!.id);

  return (
    <div className="px-4 md:px-7 py-6">
      <div className="flex items-center flex-wrap gap-3 gap-y-2 mb-5">
        <h1 className="font-display text-2xl font-semibold uppercase tracking-wide">Élèves</h1>
        <Link href="/eleves/inviter" className="ml-auto"><Button>+ Inviter un élève</Button></Link>
      </div>
      {roster.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title="Pas encore d'élève"
            description="Génère un lien d'invitation pour relier ton premier élève — il crée son compte et apparaît ici automatiquement."
            action={<Link href="/eleves/inviter"><Button>+ Inviter un élève</Button></Link>}
          />
        </Card>
      ) : (
        <Card>
          {roster.map((e) => (
            <Link key={e.id} href={`/eleves/${e.id}`} className="flex items-center gap-3 px-4 py-3.5 border-b border-line last:border-0 hover:bg-hover transition">
              <Avatar initials={e.initials} className="w-9 h-9" />
              <span className="font-display text-sm font-semibold uppercase tracking-wide flex-1">{e.name}</span>
              <div className="w-28"><HealthScore score={e.score} /></div>
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}
