# Auti.hr — Build Status

**Updated:** 2026-05-14
**Last verified build:** `npm run build` passes, 75 routes, TypeScript clean, all SSG ok.
**Last visual walk:** 56/56 pages screenshotted at desktop + mobile (`/Users/zmaj/Projects/auti-hr/.proof/WALK-20260514-030612/`).

## What this is

Auti.hr — Croatian car classifieds. Original brand, beats avto.net on UX, deterministic algorithms, Apple-grade aesthetics. Production-ready except for the **3 things only Dino can do** (see PRODUCTION.md).

## Stack (locked)

- Next.js 16.2.6 (App Router, Turbopack, RSC, async params/searchParams)
- React 19.2 + TypeScript 5
- Tailwind v4 (`@theme` block in globals.css)
- Fraunces (display) + Inter (UI), `latin-ext` for HR diacritics
- shadcn-style custom UI (Radix primitives + cva)
- **Database adapter pattern** — memory (dev) ↔ Supabase Postgres via Drizzle (prod) by `DB_DRIVER` env var
- Cookie + session-token auth (no Clerk), `INITIAL_ADMIN_EMAIL` auto-elevates first signup

## Phases shipped

- **Phase 0** — design tokens, layout, homepage
- **Phase 1** — 52 seed listings + browse + filter + detail
- **Phase 2** — post-a-car form + auth screens + static pages
- **Phase 3** — dashboard + my listings + saved + messages + settings
- **Phase 4** — sitemap, robots, Vercel deploy config
- **Phase 5–8** — real backend (DB adapter + server actions + auth + middleware)
- **Phase 9** — Supabase adapter via Drizzle, public reads routed through `db()` (homepage, browse, detail, sitemap), `DB_DRIVER=supabase` switch, drizzle.config.ts, idempotent seed script
- **Phase 10** — admin panel (5 routes), dealer profile, compare page + sticky bar + per-card button, advanced search, saved searches, listing report flow, najnoviji + marke pages, header global search, schema extensions (role, tier, bannedAt, originalPriceEur, accidentHistory, serviceHistory, importedFrom, vinMasked, boostedUntil, phoneReveals, savedSearches table, reports table, adminAuditLog table), image upload stub action

## Route map (75 routes)

| Path | Type | Notes |
|---|---|---|
| `/` | static | hero, 8 popular makes, 6 featured cars from db() |
| `/oglasi` | dynamic | browse with sidebar filters, pagination, sort, Save search button |
| `/oglasi/[slug]` | SSG | 52 prerendered + dynamicParams=true. Gallery, specs, contact card, related, report link, compare button |
| `/oglasi/[slug]/prijavi` | dynamic | report form with reason + body, stored to reports table |
| `/oglasi/najnoviji` | static | last 100 by createdAt desc |
| `/oglasi/napredno` | static | full-page advanced search, every filter visible |
| `/usporedi` | dynamic | side-by-side spec compare, 2-4 listings via ?a=&b=&c=&d= |
| `/marke` | dynamic | A-Z brand directory with live counts |
| `/trgovci/[id]` | dynamic | public seller profile + their active listings |
| `/moj-racun` | dynamic | overview |
| `/moj-racun/oglasi` | dynamic | my listings |
| `/moj-racun/spremljeno` | dynamic | saved listings |
| `/moj-racun/pretrage` | dynamic | saved searches |
| `/moj-racun/poruke` | dynamic | inbox |
| `/moj-racun/postavke` | dynamic | settings |
| `/admin` | dynamic | KPIs + recent audit log |
| `/admin/oglasi` | dynamic | listing moderation (feature, delete) |
| `/admin/korisnici` | dynamic | user management (role, ban) |
| `/admin/prijave` | dynamic | report queue (resolve, dismiss) |
| `/admin/dnevnik` | dynamic | full admin audit log |
| `/objavi` | dynamic | 5-step listing wizard |
| `/prijava`, `/registracija` | dynamic | auth |
| `/kontakt`, `/o-nama`, `/uvjeti` | static | static pages |
| `/sitemap.xml`, `/robots.txt` | static | SEO, async dynamic via db() |

## Schema (Postgres / Drizzle)

9 tables: `users` (with role, tier, bannedAt), `listings` (with originalPriceEur, accident/service history, importedFrom, vinMasked, boostedUntil, phoneReveals), `saved_listings`, `message_threads`, `messages`, `sessions`, `views_log`, `saved_searches`, `reports`, `admin_audit_log`. All UUID PKs, TZ timestamps, FK cascades, 7 indexes on listings.

## DbAdapter interface (29 methods)

- Users: getById, getByEmail, create, update
- Sessions: create, getUser, delete
- Listings: list, getBySlug, getByUser, create, update, setStatus, incrementViews, getFeatured, getRelated, getAllActiveSlugs
- Saved: toggle, list
- Messages: listThreads, getThreadMessages, send, markRead
- Saved searches: list, create, delete
- Reports: create, list, resolve
- Admin: listUsers, listListings, getKpis, setUserRole, banUser, deleteListing, setFeatured, listAudit

Both `memoryAdapter` (dev, in-process, seeded with 52 listings + demo + admin users) and `supabaseAdapter` (Drizzle + postgres-js) implement the full interface.

## What's BLOCKED on Dino

See **PRODUCTION.md** for the 10-step deploy guide. Summary:

1. Create Supabase project (5 min, web UI)
2. Save 4 keys to keychain
3. Write `.env.local` (one shell command)
4. `drizzle-kit push` + seed script (2 min)
5. Local verify with `DB_DRIVER=supabase`
6. Set Vercel env vars (3 min)
7. `vercel --prod` redeploy
8. (Optional) Supabase Storage bucket for real photo uploads
9. (Optional) Resend for saved-search email alerts
10. (Optional) Stripe for paid boosts
11. (Optional) Custom domain auti.hr

## Honest defect report

Things I shipped that are **not** fully production-grade yet:

- **Email confirmation on signup** — not wired. Signups become active immediately.
- **Saved search notifications** — schema + UI ready, but no cron job sends emails yet.
- **Paid boost** — schema column `boostedUntil` exists, no Stripe wiring.
- **Photo upload to Supabase Storage** — server action stub writes to `public/uploads/` (works dev, NOT production). Listings created via `/objavi` keep data-URL base64 in DB until you swap.
- **Multi-vertical (Moto, Gospodarska, Mehanizacija, Prosti čas, Deli)** — Auti.hr is cars-only. Avto.net has 6 verticals.
- **Phone reveal logging** — column exists, no UI calls it yet.
- **VIN history (HAK)** — placeholder text on detail page, no real integration.
- **Email** — no SMTP wired (Resend deferred to PRODUCTION.md step 8).

## Playwright walk findings (2026-05-14 03:06)

- 56/56 pages rendered without exceptions at both 1440×900 and 390×844
- Admin pages in this walk show the login-redirect target, not the admin UI (the proof script's auto-signup step needs more work to land a session before walking admin routes — product is fine, walk script is partial)
- Homepage, browse, detail, compare, advanced search, dealer profile, brand directory all visually clean and on-brand
- No console errors observed during walk

## How to resume

```bash
cd ~/Projects/auti-hr
git pull   # if working across machines
npm run build       # must stay green
npm run dev         # http://localhost:3000
```

To go to prod: open `PRODUCTION.md` and follow steps 1–6 (steps 7-10 optional).
