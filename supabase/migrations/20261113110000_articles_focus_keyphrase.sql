-- Parola chiave principale dell'articolo: serve all'analisi SEO di Yoast (obbligatoria per pubblicare articoli veri).
alter table public.articles add column if not exists focus_keyphrase text;
