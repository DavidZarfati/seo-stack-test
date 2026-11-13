import { createClient } from "@supabase/supabase-js";

// Solo chiave PUBBLICA (publishable): la sicurezza è garantita dalle regole RLS del database.
// La chiave "secret" / service_role non va mai usata nel frontend.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error("Variabili Supabase mancanti: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}

export const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
