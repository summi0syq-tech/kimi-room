> 中文（原文）: ./SELF-HOST.md

# Self-host persistence

By default kimi-room keeps the dashboard (calendar / sleep / keepsakes / study /
memory lorebook …) in the browser's IndexedDB: zero config, no backend, lost when
you switch devices. This page gives two reference adapters that move that data onto
**your own server** — so it persists and syncs across devices. It is the
persistence layer of README's "Path B: I have a VPS, I want the full system."

This is a **reference example, not a hosted service.** Every deployment is one
person and one AI (1v1), your own database, your own key. Both adapters are written
for that premise: no multi-tenancy, no billing, the schema is a single table.

## Read first: a single user still needs a lock

It runs on a public URL. The only thing between your private data and the world is
authentication, so both adapters are locked by default — do not bypass it:

- **Supabase**: use the project's **anon (publishable) key**, never the
  `service_role` key. `service_role` bypasses RLS, which exposes the whole database
  to anyone. RLS is already enabled in `supabase/schema.sql`.
- **Prisma**: every `/api/store` request is checked against an owner session cookie
  (minted by `/api/auth` from a password). With no `KIMI_OWNER_PASSWORD` set it is
  **locked shut**, not open by default.

## Three storage options

|                | idb (default) | supabase            | prisma                |
| -------------- | ------------- | ------------------- | --------------------- |
| Data lives     | this browser  | your Supabase       | your own Postgres     |
| Server         | none          | none (browser-direct)| yes (Next server)    |
| Auth           | —             | Supabase Auth + RLS | owner password cookie |
| Cross-device   | no            | yes                 | yes                   |
| Dependency     | —             | bundled             | install prisma yourself |

All three share the same data shape, so the `/backstage` export / import migrates
between them (export from one, import into another).

## A · Supabase (lowest friction)

1. Create a Supabase project.
2. Run `supabase/schema.sql` once in the SQL editor (creates the `store_rows`
   table + RLS policies).
3. In Authentication, create one user (yourself); disable public sign-ups if you like.
4. Set these env vars on deploy:
   ```
   NEXT_PUBLIC_KIMI_ADAPTER=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR-ANON-PUBLISHABLE-KEY
   ```
5. Sign in by calling `signInWithPassword(email, password)` (or
   `signInWithMagicLink(email)`). The helpers are in
   `src/lib/stores/supabase-auth.ts`; wire a minimal sign-in form — the UI is left
   to you. While signed out, RLS makes reads empty and writes fail (no leak, but
   nothing works), so sign in first.

`@supabase/supabase-js` is already a dependency (`npm install` pulls it); it loads
lazily, so a deployment that selects idb never loads it at runtime.

## B · Prisma (any Postgres / no vendor lock-in)

Data goes through the server-side `/api/store`; no key reaches the browser. Good for
a self-hosted Postgres or a database you already run.

1. Provision a Postgres (self-hosted / Neon / Supabase's Postgres all work).
2. Install Prisma (not bundled by default):
   ```
   npm install @prisma/client && npm install -D prisma
   ```
3. Set `DATABASE_URL` and create the table:
   ```
   npx prisma db push      # creates store_rows from prisma/schema.prisma
   npx prisma generate
   ```
4. Set these env vars on deploy:
   ```
   NEXT_PUBLIC_KIMI_ADAPTER=prisma
   DATABASE_URL=<your Postgres connection string>
   KIMI_OWNER_PASSWORD=choose-a-strong-owner-password
   KIMI_SESSION_SECRET=optional-random-salt
   ```
5. Sign in with `POST /api/auth { "password": "..." }` to mint an httpOnly session
   cookie; dashboard reads/writes then carry it automatically. Sign out with
   `DELETE /api/auth`. A minimal password box is enough.

Note: Prisma uses a server-side native dynamic import, so it is most reliable on a
long-running Node server (`next start` / a VPS). On Vercel / serverless, if the
bundle does not trace `@prisma/client`, move it into `package.json` dependencies.

## C · core (Tier 2 · same backend as memory)

If you already run a [kimi-core](https://github.com/marikagura/kimi-core) for memory, let the dashboard use it too — the SAME backend, no separate DB.

1. Enable the store extension on kimi-core: `KIMI_EXTENSIONS=store`, then `npx prisma migrate deploy` (creates `store_rows`).
2. On room, set:
   ```
   NEXT_PUBLIC_KIMI_ADAPTER=core
   NEXT_PUBLIC_KIMI_BACKEND=core
   KIMI_CORE_URL=https://your-kimi-core.example.com
   KIMI_API_KEY=...
   ```
3. Dashboard reads/writes go through the existing `/api/core` redirect to core's `store` tool (the browser never holds the key). Memory RAG and dashboard data now share one core.

This is the "one backend" path — see the repo README for one-command turnkey deployment.

## Hosting generation (LLM) too

This page covers **data persistence only.** Chat generation still uses the
bring-your-own key you set in Settings (browser-side). Moving generation onto the
server (key off the browser, meterable) is a separate `/api` proxy and out of scope
here — for the memory-retrieval analogue see `/api/core` and [BACKENDS.md](BACKENDS.md).

## Writing a third backend

All three adapters implement the same `AdapterBundle` (`src/lib/stores/types.ts`:
11 stores + blob). To target Notion or another database, copy `supabase-adapter.ts`
and add a branch in `selectAdapter()` in `src/lib/stores/index.ts`.
