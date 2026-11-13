-- Tabella articoli di prova. Solo gli articoli "published" sono leggibili dal pubblico.
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  lang text not null check (lang in ('en', 'it')),
  slug text not null,
  title text not null,
  meta_description text not null,
  body_md text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (lang, slug)
);

alter table public.articles enable row level security;

-- Lettura pubblica solo degli articoli pubblicati.
create policy "public can read published articles"
  on public.articles
  for select
  to anon, authenticated
  using (status = 'published');

-- Nessuna policy di scrittura: inserimenti e modifiche solo con la chiave di servizio (mai nel frontend).
