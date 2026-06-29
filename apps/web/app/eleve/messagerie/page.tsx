import { cn } from "@/lib/cn";
import { Button, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getThread } from "@/lib/queries";
import { sendMessage } from "./actions";

export default async function EleveMessageriePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("coach_id").eq("id", user!.id).single();
  const coachId = profile?.coach_id as string | null;

  const thread = coachId ? await getThread(supabase, coachId, user!.id) : null;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen">
      <div className="px-6 py-4 border-b border-line"><span className="font-display text-lg font-semibold uppercase tracking-wide">{thread?.name ?? "Messagerie"}</span></div>

      {!coachId ? (
        <div className="m-auto text-sm text-muted">Tu n&apos;es relié à aucun coach pour l&apos;instant.</div>
      ) : (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-2.5">
            {thread!.messages.length === 0 && <div className="text-sm text-muted m-auto">Démarre la conversation avec ton coach.</div>}
            {thread!.messages.map((m, i) => (
              <div key={i} className={cn("max-w-[70%] rounded-lg px-3.5 py-2.5 text-sm", m.sender === "student" ? "bg-acid text-on-acid self-end" : "bg-surf border border-line self-start")}>
                {m.body}
              </div>
            ))}
          </div>
          <form action={sendMessage} className="flex items-center gap-2.5 px-6 py-4 border-t border-line">
            <input type="hidden" name="coachId" value={coachId} />
            <Input name="body" placeholder="Écrire un message…" autoComplete="off" className="flex-1" />
            <Button type="submit">Envoyer</Button>
          </form>
        </div>
      )}
    </div>
  );
}
