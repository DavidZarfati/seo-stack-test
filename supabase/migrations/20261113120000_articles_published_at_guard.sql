-- Un articolo pubblicato deve sempre avere una data di pubblicazione (serve ai dati strutturati e alla sitemap).
create or replace function public.set_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at = now();
  end if;
  return new;
end;
$$;

create trigger articles_set_published_at
  before insert or update on public.articles
  for each row
  execute function public.set_published_at();

-- Sistema gli articoli già pubblicati senza data.
update public.articles set published_at = coalesce(created_at, now())
where status = 'published' and published_at is null;

-- Da ora in poi il database rifiuta la combinazione "pubblicato ma senza data".
alter table public.articles
  add constraint articles_published_has_date check (status <> 'published' or published_at is not null);
