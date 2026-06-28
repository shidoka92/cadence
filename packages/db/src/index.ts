import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

/** Client Supabase (browser). Côté serveur, utiliser la service key. */
export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error("Variables Supabase manquantes (.env.local)");
  return createClient<Database>(url, anon);
}
export type { Database };
