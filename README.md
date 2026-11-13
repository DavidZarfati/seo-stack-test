# SEO Stack Test

Sito di **prova** (contenuti finti) per validare lo stack Next.js + Supabase + Vercel.

- Pagine pre-generate lato server (HTML completo per crawler e AI).
- Database Supabase con RLS: il pubblico legge solo gli articoli `published`.
- Il sito NON è indicizzabile (`noindex`, `robots.txt` bloccante) finché non si imposta `SITE_INDEXABLE=true`.
- Migrazioni in `supabase/migrations/`, dati finti in `supabase/seed.sql`.

## Sicurezza
- Nel frontend solo la chiave **publishable** di Supabase. Mai la chiave `secret`/`service_role`.
- Nessun segreto nel repository: le variabili stanno in `.env.local` (ignorato da Git) e su Vercel.
