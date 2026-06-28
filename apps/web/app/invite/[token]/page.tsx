import { createClient } from "@/lib/supabase/server";
import { InviteForm } from "./invite-form";

export default async function InvitePage({ params }: { params: { token: string } }) {
  const supabase = createClient();
  const { data } = await supabase.rpc("invitation_info", { p_token: params.token });
  const info = data?.[0] as { valid: boolean; coach_name: string } | undefined;

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-8 h-8 rounded-md bg-acid" />
          <span className="font-display font-bold text-2xl uppercase tracking-wider">Cadence</span>
        </div>
        {!info || !info.valid ? (
          <div className="bg-surf border border-line rounded-lg p-6 text-center">
            <h1 className="font-display text-lg font-semibold uppercase tracking-wide mb-2">Invitation invalide</h1>
            <p className="text-xs text-muted">Ce lien est expiré ou a déjà été utilisé. Demande un nouveau lien à ton coach.</p>
          </div>
        ) : (
          <InviteForm token={params.token} coachName={info.coach_name} />
        )}
      </div>
    </main>
  );
}
