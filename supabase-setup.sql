-- Einmal in Supabase ausführen: SQL Editor → New query → alles einfügen → Run
-- Legt die Tabelle für Konten und Lernfortschritt an.
-- Jeder Nutzer darf nur seine eigene Zeile lesen und ändern.

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  display     text not null,
  data        jsonb not null default '{"progress":{}}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Nur angemeldete Nutzer dürfen über die Website auf die Tabelle zugreifen
-- (welche Zeilen genau, regeln die Policies darunter).
revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

drop policy if exists "eigenes Profil lesen" on public.profiles;
create policy "eigenes Profil lesen" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "eigenes Profil anlegen" on public.profiles;
create policy "eigenes Profil anlegen" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "eigenes Profil ändern" on public.profiles;
create policy "eigenes Profil ändern" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
