import { createClient } from "@supabase/supabase-js";

/** Service role : bypass RLS. Réservé aux webhooks Stripe — jamais exposé au client. */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
