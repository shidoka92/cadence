import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// jamais pré-rendue : dépend des headers et du service role à l'exécution
export const dynamic = "force-dynamic";
import { computeAndStoreHealthScore } from "@/lib/health-score";
import { notify } from "@/lib/notify";

const DAY_MS = 864e5;
const DROP_THRESHOLD = 50;   // passer sous ce score déclenche une alerte coach
const DROP_DELTA = 15;       // ou une chute d'au moins ce nombre de points
const INACTIVE_DAYS = 7;     // nudge élève après ce nombre de jours sans journal

/** Évite de renvoyer la même alerte chaque nuit tant que la situation n'a pas changé. */
async function alreadyNotified(admin: ReturnType<typeof createAdminClient>, userId: string, type: string, href: string, sinceDays: number) {
  const since = new Date(Date.now() - sinceDays * DAY_MS).toISOString();
  const { count } = await admin
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("type", type)
    .eq("payload->>href", href)
    .gte("created_at", since);
  return (count ?? 0) > 0;
}

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: students = [] } = await admin
    .from("profiles")
    .select("id, full_name, coach_id")
    .eq("role", "student")
    .not("coach_id", "is", null);

  let alerts = 0, nudges = 0, reminders = 0;

  for (const s of students ?? []) {
    const { data: prev } = await admin.from("health_scores").select("score").eq("student_id", s.id).maybeSingle();
    const { score } = await computeAndStoreHealthScore(admin, s.id);

    // alerte coach : passage sous le seuil ou chute brutale
    const crossed = prev != null && prev.score >= DROP_THRESHOLD && score < DROP_THRESHOLD;
    const plunged = prev != null && prev.score - score >= DROP_DELTA;
    if ((crossed || plunged) && !(await alreadyNotified(admin, s.coach_id, "health_drop", `/eleves/${s.id}`, 7))) {
      await notify(s.coach_id, "health_drop", {
        title: `${s.full_name} décroche — Health Score ${prev!.score} → ${score}`,
        href: `/eleves/${s.id}`,
      });
      alerts++;
    }

    // nudge élève : inactif depuis INACTIVE_DAYS alors qu'il a un programme
    const [{ data: lastEntry }, { count: programCount }] = await Promise.all([
      admin.from("journal_entries").select("created_at").eq("student_id", s.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
      admin.from("programs").select("id", { count: "exact", head: true }).eq("student_id", s.id),
    ]);
    const inactive = (programCount ?? 0) > 0 && (!lastEntry || Date.now() - new Date(lastEntry.created_at).getTime() > INACTIVE_DAYS * DAY_MS);
    if (inactive && !(await alreadyNotified(admin, s.id, "nudge", "/eleve/seance", INACTIVE_DAYS))) {
      await notify(s.id, "nudge", { title: "Ta prochaine séance t'attend 💪", href: "/eleve/seance" });
      nudges++;
    }
  }

  // relance douce des impayés (le retry carte lui-même est géré par Stripe)
  const { data: pastDue = [] } = await admin.from("subscriptions").select("student_id").eq("status", "past_due");
  for (const sub of pastDue ?? []) {
    if (!(await alreadyNotified(admin, sub.student_id, "past_due", "/eleve/parametres", 3))) {
      await notify(sub.student_id, "past_due", { title: "Ton paiement a échoué — mets à jour ta carte", href: "/eleve/parametres" });
      reminders++;
    }
  }

  return NextResponse.json({ students: (students ?? []).length, alerts, nudges, reminders });
}
