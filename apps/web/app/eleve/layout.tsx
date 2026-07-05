import { redirect } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getNotifications } from "@/lib/queries";
import { StudentSidebar } from "@/components/student/sidebar";
import { openBillingPortal } from "@/app/eleve/parametres/actions";

export default async function EleveLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Colonnes garanties uniquement : la porte de rôle ne doit jamais casser sur une colonne
  // absente (sinon profile=null → redirection en boucle avec le layout coach = crash).
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, coach_id")
    .eq("id", user.id)
    .single();
  if (profile && profile.role !== "student") redirect("/dashboard");

  // Lecture défensive du client Stripe : dégrade en null si la colonne n'existe pas encore.
  const { data: billing } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  const [{ data: coach }, { data: sub }, notifications] = await Promise.all([
    profile?.coach_id
      ? supabase.from("profiles").select("full_name").eq("id", profile.coach_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("subscriptions").select("status").eq("student_id", user.id).maybeSingle(),
    getNotifications(supabase, user.id),
  ]);
  const pastDue = sub?.status === "past_due";

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg">
      <StudentSidebar studentName={profile?.full_name ?? "Élève"} coachName={coach?.full_name} notifications={notifications} />
      <div className="flex-1 min-w-0">
        {pastDue && (
          <div className="flex items-center flex-wrap gap-3 px-4 md:px-7 py-2.5 bg-risk/15 border-b border-risk/40">
            <AlertTriangle size={15} className="text-risk shrink-0" />
            <p className="text-xs text-text">Ton dernier paiement a échoué — ton abonnement est en pause.</p>
            {billing?.stripe_customer_id && (
              <form action={openBillingPortal} className="ml-auto">
                <button type="submit" className="font-display text-[11px] font-semibold uppercase tracking-wide text-risk hover:underline">
                  Mettre à jour mon paiement →
                </button>
              </form>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
