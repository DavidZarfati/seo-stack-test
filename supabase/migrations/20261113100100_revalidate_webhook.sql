-- Avvisa il sito quando un articolo cambia, così la pagina si rigenera subito.
-- Il segreto NON è in questo file: sta in Supabase Vault con il nome 'revalidate_secret'
-- (creato a mano una sola volta: select vault.create_secret('<segreto>', 'revalidate_secret');).

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_site_revalidate()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_secret text;
begin
  select decrypted_secret into v_secret
  from vault.decrypted_secrets
  where name = 'revalidate_secret'
  limit 1;

  -- Se il segreto manca non blocchiamo la scrittura dell'articolo: semplicemente non avvisiamo il sito.
  if v_secret is null then
    return coalesce(new, old);
  end if;

  perform net.http_post(
    url := 'https://seo-stack-test.vercel.app/api/revalidate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-revalidate-secret', v_secret
    ),
    body := jsonb_build_object('table', 'articles', 'type', tg_op),
    timeout_milliseconds := 5000
  );

  return coalesce(new, old);
end;
$$;

-- Solo il database può eseguire la funzione: nessun accesso dall'API pubblica.
revoke all on function public.notify_site_revalidate() from public, anon, authenticated;

create trigger articles_notify_site
  after insert or update or delete on public.articles
  for each row
  execute function public.notify_site_revalidate();
