-- =====================================================================
-- TEIL 1 – jetzt ausführen (SQL Editor → New query → einfügen → Run)
-- Bereitet die Entwickleroptionen vor.
-- =====================================================================

-- Benutzername zusätzlich in der Profil-Tabelle speichern
alter table public.profiles add column if not exists username text;
update public.profiles p
   set username = split_part(u.email, '@', 1)
  from auth.users u
 where u.id = p.id and p.username is null;

-- Liste der Entwickler. Niemand kann sich über die Website selbst eintragen:
-- es gibt absichtlich keine Regel zum Anlegen/Ändern, nur hier im SQL Editor.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- Prüft, ob der angemeldete Nutzer Entwickler ist
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- Entwickler dürfen ALLE Profile lesen (aber nicht ändern)
drop policy if exists "Entwickler sehen alle Profile" on public.profiles;
create policy "Entwickler sehen alle Profile" on public.profiles
  for select using (public.is_admin());


-- =====================================================================
-- TEIL 2 – erst ausführen, NACHDEM du dich auf der Website mit dem
-- Benutzernamen simon.fleck registriert hast. Macht dieses Konto zum Entwickler.
-- (Nur die drei Zeilen unten markieren und "Run" drücken.)
-- =====================================================================

-- insert into public.admins (user_id)
-- select id from auth.users where email = 'simon.fleck@users.sportabilernkarten.store'
-- on conflict do nothing;
