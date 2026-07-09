// Messagerie élève ↔ coach. RLS "messages participants" : l'élève voit/écrit son propre fil.
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChatMessage {
  id: string;
  fromCoach: boolean;
  body: string;
  createdAt: string;
}

export interface Thread {
  coachId: string | null;
  coachName: string;
  messages: ChatMessage[];
}

export async function getThread(supabase: SupabaseClient, studentId: string): Promise<Thread> {
  const { data: profile } = await supabase.from("profiles").select("coach_id").eq("id", studentId).maybeSingle();
  const coachId = (profile?.coach_id as string | null) ?? null;

  let coachName = "Ton coach";
  if (coachId) {
    const { data: coach } = await supabase.from("profiles").select("full_name").eq("id", coachId).maybeSingle();
    if (coach?.full_name) coachName = coach.full_name as string;
  }

  const { data } = await supabase
    .from("messages")
    .select("id, sender, body, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: true })
    .limit(100);

  const messages: ChatMessage[] = ((data ?? []) as any[]).map((m) => ({
    id: m.id,
    fromCoach: m.sender === "coach",
    body: m.body,
    createdAt: m.created_at,
  }));

  return { coachId, coachName, messages };
}

/** Envoie un message de l'élève à son coach. Renvoie une erreur lisible, ou null si OK. */
export async function sendMessage(supabase: SupabaseClient, coachId: string, studentId: string, body: string): Promise<string | null> {
  const trimmed = body.trim();
  if (!trimmed) return "Message vide.";
  const { error } = await supabase.from("messages").insert({ coach_id: coachId, student_id: studentId, sender: "student", body: trimmed });
  return error ? "Envoi impossible. Réessaie." : null;
}
