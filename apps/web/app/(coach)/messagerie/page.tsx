import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { cn } from "@/lib/cn";
import { Avatar, Button, Input, EmptyState } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { getConversations, getThread } from "@/lib/queries";
import { sendMessage } from "./actions";

export default async function MessageriePage({ searchParams }: { searchParams: { s?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const convos = await getConversations(supabase, user!.id);
  const selected = searchParams.s ?? convos[0]?.id ?? null;
  const thread = selected ? await getThread(supabase, user!.id, selected) : null;

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-3.5rem)] md:h-screen">
      {/* conversations */}
      <aside className="w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r border-line flex flex-col">
        <div className="px-4 py-3 md:py-4 border-b border-line"><h1 className="font-display text-lg font-semibold uppercase tracking-wide">Messagerie</h1></div>
        <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto">
          {convos.length === 0 && <div className="px-4 py-5 text-xs text-muted">Aucun élève à contacter pour l&apos;instant.</div>}
          {convos.map((c) => (
            <Link key={c.id} href={`/messagerie?s=${c.id}`} className={cn("flex items-center gap-3 px-4 py-3 border-b border-line transition shrink-0 w-52 md:w-auto", c.id === selected ? "bg-surf" : "hover:bg-hover")}>
              <Avatar initials={c.initials} className="w-9 h-9" />
              <div className="min-w-0">
                <div className="font-display text-sm font-semibold uppercase tracking-wide truncate">{c.name}</div>
                <div className="text-[11px] text-muted truncate">{c.last ?? "Aucun message"}</div>
              </div>
            </Link>
          ))}
        </div>
      </aside>

      {/* thread */}
      <div className="flex-1 flex flex-col min-w-0">
        {thread ? (
          <>
            <div className="px-6 py-4 border-b border-line"><span className="font-display text-lg font-semibold uppercase tracking-wide">{thread.name}</span></div>
            <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-2.5">
              {thread.messages.length === 0 && <div className="text-sm text-muted m-auto">Démarre la conversation.</div>}
              {thread.messages.map((m, i) => (
                <div key={i} className={cn("max-w-[70%] rounded-lg px-3.5 py-2.5 text-sm", m.sender === "coach" ? "bg-acid text-on-acid self-end" : "bg-surf border border-line self-start")}>
                  {m.body}
                </div>
              ))}
            </div>
            <form action={sendMessage} className="flex items-center gap-2.5 px-6 py-4 border-t border-line">
              <input type="hidden" name="studentId" value={selected ?? ""} />
              <Input name="body" placeholder="Écrire un message…" autoComplete="off" className="flex-1" />
              <Button type="submit">Envoyer</Button>
            </form>
          </>
        ) : (
          <EmptyState icon={MessageSquare} title="Aucune conversation" description="Invite des élèves pour pouvoir échanger avec eux ici." className="m-auto" />
        )}
      </div>
    </div>
  );
}
