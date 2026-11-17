-- Einmal in Supabase ausführen: SQL Editor → New query → alles einfügen → Run
-- Sorgt dafür, dass jeder Benutzername nur einmal vergeben werden kann.

-- Benutzernamen eindeutig machen (Groß-/Kleinschreibung egal)
create unique index if not exists profiles_username_unique
  on public.profiles (lower(username)) where username is not null;

-- Prüft bei der Registrierung, ob ein Benutzername noch frei ist.
-- Gibt nur ja/nein zurück, keine E-Mail-Adressen oder anderen Daten.
create or replace function public.username_frei(name text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select not exists (select 1 from public.profiles where lower(username) = lower(name));
$$;
revoke execute on function public.username_frei(text) from public;
grant execute on function public.username_frei(text) to anon, authenticated;
