-- kimi-room · Supabase persistence schema (reference adapter · see docs/SELF-HOST.md)
--
-- One uniform table holds all 11 collections + blob, keyed by `collection`.
-- 1v1 / single-user: every row is owned by the signed-in user, and Row-Level
-- Security is the ONLY thing standing between a public URL and your private data
-- — so it is enabled and required below. In the app, use the project's ANON
-- (publishable) key, never the service_role key: the anon key is safe to ship to
-- the browser precisely because these RLS policies gate it. An unauthenticated
-- request has auth.uid() = null, so it matches no rows (reads empty, writes fail).
--
-- Run this once in the Supabase SQL editor (or `psql < supabase/schema.sql`).

create extension if not exists "pgcrypto";

create table if not exists public.store_rows (
  id          text primary key,
  collection  text not null,
  owner       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  data        jsonb not null default '{}'::jsonb
);

create index if not exists store_rows_owner_collection_idx
  on public.store_rows (owner, collection);

alter table public.store_rows enable row level security;

-- Owner-only access across all four verbs. Re-runnable: drop-then-create.
drop policy if exists "store_rows owner select" on public.store_rows;
drop policy if exists "store_rows owner insert" on public.store_rows;
drop policy if exists "store_rows owner update" on public.store_rows;
drop policy if exists "store_rows owner delete" on public.store_rows;

create policy "store_rows owner select" on public.store_rows
  for select using (owner = auth.uid());
create policy "store_rows owner insert" on public.store_rows
  for insert with check (owner = auth.uid());
create policy "store_rows owner update" on public.store_rows
  for update using (owner = auth.uid()) with check (owner = auth.uid());
create policy "store_rows owner delete" on public.store_rows
  for delete using (owner = auth.uid());
