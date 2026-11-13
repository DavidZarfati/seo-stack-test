-- Aggiorna automaticamente updated_at a ogni modifica (serve a sitemap e dati strutturati: dateModified).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger articles_set_updated_at
  before update on public.articles
  for each row
  execute function public.set_updated_at();
