# Backend Architecture Notes

## Current state (2026-05-12)

The backend is built but runs on an **in-memory store** that does NOT persist across serverless function invocations on Vercel. This means:

- Locally (`npm run dev` or `npm run start` single process): full backend works end-to-end. Signup, login, post listing, save, message — all persist for the life of the Node process.
- On Vercel (serverless): each request can hit a different Lambda instance. Users created on instance A vanish when the next request lands on instance B. Sessions appear to "expire" immediately on reload.

This is a deliberate stopgap — the architecture is correct, but the storage layer needs to be swapped for something shared.

## Swap path (15 minutes once you have credentials)

### Option A: Supabase Postgres (recommended)
1. Create project at https://supabase.com — free tier, EU-Central (Frankfurt) region
2. Copy `Project URL`, `anon key`, and database connection string
3. Run the SQL in `src/db/schema.ts` against Supabase SQL editor (Drizzle migration: `npx drizzle-kit push`)
4. Create `src/db/supabase-adapter.ts` that implements the `DbAdapter` interface (same shape as `memory-adapter.ts`, just using `postgres-js` queries)
5. Edit `src/db/index.ts` to switch on `process.env.DB_DRIVER === "supabase"`
6. Add env vars in Vercel dashboard:
   - `DB_DRIVER=supabase`
   - `DATABASE_URL=postgresql://...`
   - `SUPABASE_URL=https://xxx.supabase.co`
   - `SUPABASE_ANON_KEY=...`
7. Redeploy

### Option B: Vercel KV (quick fix, no migration)
1. Add Vercel KV (Redis) to project — free tier covers small apps
2. Replace `Map` instances in `memory-adapter.ts` with KV calls
3. Less type-safe than Postgres, no relational queries, but works

## What's solid that won't need to change

- All UI components (no DB-aware logic)
- Server actions (use `db()` interface, swap implementation freely)
- Auth flow (cookie + session token, same code works against any backend)
- Filter engine (`applyFilters` works on any `Listing[]`)
- Middleware (cookie check only, no DB)
- Type-safe schema (Drizzle definitions in `src/db/schema.ts`)

## What lives in memory right now

- 52 seed listings owned by demo user `00000000-0000-0000-0000-000000000001`
- Any users created via signup
- Sessions, saved listings, threads, messages
- Lost on every cold Lambda start
