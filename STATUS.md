# Auti.hr — Build Status

**Updated:** 2026-05-12
**Last verified build:** `npm run build` passes, homepage screenshots in `.proof/`

## Vision
Croatian car classifieds marketplace. Original brand (not a copy of avto.net). Production-ready, free/low-cost stack, deploy to Vercel.

## Stack (locked)
- Next.js 16.2.6 (App Router, Turbopack, RSC)
- React 19.2 + TypeScript 5
- Tailwind v4 (`@tailwindcss/postcss`, `@theme` block in globals.css)
- Fonts: Fraunces (display, opsz+SOFT axes) + Inter (UI), `latin-ext` for HR diacritics
- shadcn-style custom UI (Radix primitives wrapped with cva)
- Lucide React icons
- Zod for validation
- Clerk (auth — installed, not wired)
- Supabase JS (DB — installed, not wired)
- Drizzle ORM (installed, not wired)

## Design system (locked)
- **Palette**: `--color-ink #0A1628` (navy), `--color-accent #F59E0B` (amber), `--color-bg #FAFAF7` (warm off-white), `--color-line #E5E1D8`
- **Type**: Fraunces serif italic for hero accent, Inter for everything else, `tracking-[-0.025em]` on displays
- **Radii**: 4/8/14/22
- **Shadows**: subtle card + lifted card-hover

## Done (Phase 0 — Foundation)
- [x] Scaffold + deps
- [x] Design tokens (globals.css)
- [x] Root layout with Inter + Fraunces, HR locale, full OG metadata
- [x] `next.config.ts` — Unsplash + Supabase image hosts
- [x] `src/lib/utils.ts` — `cn`, `formatPrice` (EUR hr-HR), `formatKm`, `formatPower` (kW+KS), `formatDate`, `timeAgo`, `slugify` (HR diacritic-aware)
- [x] `src/lib/types.ts` — Zod `Listing` + 8 enums (Fuel, Transmission, BodyType, Drive, Color, Condition, SellerType, SortOption) + `ListingFilters` type
- [x] `src/data/makes.ts` — 20 makes × ~140 models, HR market mix, country tags, `POPULAR_MAKE_SLUGS`
- [x] `src/data/locations.ts` — all 21 HR counties + 90+ cities, `ALL_CITIES`, `COUNTIES`
- [x] `src/data/features.ts` — 5 categorized feature groups (Sigurnost, Udobnost, Multimedija, Eksterijer, Pogon) ~60 features
- [x] UI primitives: `Button` (6 variants × 4 sizes, asChild), `Badge` (5 variants), `Input`, `Textarea`, `Select` (custom chevron), `Card`, `Container`
- [x] `SiteHeader` — sticky, backdrop-blur, logo + 4-link nav + icon row + Prijava + accent CTA
- [x] `SiteFooter` — dark navy, 4-column nav, brand block, year
- [x] Homepage — hero (badge + display H1 + 2 CTAs + stats), popular makes grid (8 cards), 3-up value props, prodaja CTA strip
- [x] Build passes (1.17s compile, TS clean)
- [x] Visual proof: `.proof/home-desktop.png` (1440×900) + `.proof/home-mobile.png` (390×844)

## Next (Phase 1 — Listings, browse, detail)
- [ ] `src/data/listings.ts` — 50 realistic HR seed listings with Unsplash photos
  - Real HR market mix: VW Golf, Audi A4, BMW 3, Škoda Octavia, Renault Clio, etc.
  - Real HR cities + counties from `data/locations.ts`
  - Realistic prices in EUR (HR 2026 market: VW Golf 2018 1.6 TDI ≈ €12.5k, Audi A4 2020 ≈ €25k, Tesla Model 3 2022 ≈ €34k)
  - Mix of `Privatni` + `Trgovac`, 60/40 split
- [ ] `ListingCard` component (4:3 photo, title, price prominent, year/km/fuel chips, save-heart, seller-type badge)
- [ ] `FilterSidebar` component — make/model cascading select, price/year/km range sliders, multi-check fuel/transmission/body/drive/color/condition/seller, county dropdown
- [ ] `/oglasi` page — server component reads `searchParams` (note: must `await` per Next 16), applies filters via local function, paginates 24/page
- [ ] `/oglasi/[slug]` page — image gallery (carousel), specs table grouped, features grid by category, sticky contact card, related listings
- [ ] Sort dropdown (newest, price asc/desc, km asc, year desc)
- [ ] Mobile filter drawer (sheet from bottom)
- [ ] Save listing → localStorage (cookie-free demo mode)

## Phase 2 — Post-a-car
- [ ] `/objavi` multi-step form (5 steps: basic → specs → photos → price+description → preview)
- [ ] Image upload UI (drag-and-drop, 10 photos max, client-side resize to 1920px)
- [ ] Auth gate via Clerk middleware (demo mode shows mock signed-in state)
- [ ] Server action to persist (in-memory map for now, swap to Supabase later)

## Phase 3 — Auth + dashboard + messaging
- [ ] Clerk setup with HR locale (`@clerk/localizations/hr`)
- [ ] `/prijava` + `/registracija` (Clerk components, branded)
- [ ] `/moj-racun` — profile, listings, saved, messages tabs
- [ ] Inbox UI — thread list left, conversation right, send form
- [ ] Mock realtime (poll every 3s in demo mode, Supabase Realtime in prod)

## Phase 4 — Deploy
- [ ] Robots, sitemap.xml (dynamic from listings)
- [ ] OG image per listing (static at first)
- [ ] Vercel deploy via `/vercel` skill (token in keychain `vercel_api`)
- [ ] Smoke test on live URL
- [ ] Lighthouse pass (target: 95+ all categories)

## Backend wire-up (after Vercel deploy)
1. Create Supabase project at supabase.com (free tier, EU-Central region)
2. Paste URL + anon key into `.env.local`
3. Run Drizzle migrations (schema in `src/db/schema.ts` — TBD)
4. Run seed script — pushes 50 listings + makes + models to Supabase
5. Create Clerk app at clerk.com (free tier)
6. Paste keys, redeploy
7. Wire RLS policies (Clerk `userId` claim → `auth.uid()`)

## Critical Next.js 16 gotchas (caught reading docs)
- `params` is `Promise<{...}>` — must `await` in pages and layouts
- `searchParams` is `Promise<{...}>` — must `await`
- `PageProps<'/path/[slug]'>` is a global helper type — no import
- Tailwind v4 uses `@theme` block in CSS, NOT `tailwind.config.ts`
- `next/image` `remotePatterns` is in `next.config.ts`
- `lang="hr"` on `<html>` for proper diacritic rendering

## Files modified/created
```
src/app/globals.css           — design tokens + animations
src/app/layout.tsx            — root layout, HR locale, fonts, metadata
src/app/page.tsx              — homepage
src/components/site-header.tsx
src/components/site-footer.tsx
src/components/ui/{button,badge,input,card,select,container}.tsx
src/lib/utils.ts              — HR formatters
src/lib/types.ts              — Zod schemas + enums
src/data/{makes,locations,features}.ts
next.config.ts                — image hosts
.proof/home-desktop.png       — visual proof 1440x900
.proof/home-mobile.png        — visual proof 390x844
```

## How to resume
```bash
cd ~/Projects/auti-hr
npm run dev     # http://localhost:3000
npm run build   # verify
```
Read this STATUS.md first, then continue with Phase 1 (listings seed + browse + detail).
