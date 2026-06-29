import { createAdminClient } from "@/lib/supabase/admin";

/** Crée une notification pour un autre utilisateur que l'auteur de l'action — nécessite le client service-role
 *  (la policy RLS "notif owner" ne permet à un user d'écrire que ses propres notifications). */
export async function notify(userId: string, type: string, payload: { title: string; href?: string }) {
  const admin = createAdminClient();
  await admin.from("notifications").insert({ user_id: userId, type, payload });
}
