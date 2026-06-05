# Auti.hr — RESUME CHECKPOINT

**Last session:** 2026-05-20
**Branch state:** uncommitted (see "Files modified") + scripts/setup-demo-creds.mts + scripts/check-demo-creds.mts new
**Build state:** GREEN — verified `npm run build` passes at checkpoint
**Live preview:** https://auti-lxha2aqd8-marketingbybesics-projects.vercel.app (SSO off, env vars set on prod/preview/dev)
**Demo logins:** demo@auti.hr / demo1234 · admin@auti.hr / admin1234
**DB state:** Supabase Frankfurt, 72 listings, attributes jsonb populated (auto/moto/gospodarska/mehanizacija/prosti-cas)

## Resume in one prompt

> Continue Auti.hr build. Read `RESUME.md`. Pick up at Task #50 (napredno page category-aware — code shipped, needs build verification + Playwright walk). Then #51 (commit + final Playwright per-category proof).

## What's done

- **Schema**: `listings.attributes jsonb NOT NULL DEFAULT '{}'` live on Supabase + GIN index `listings_attributes_idx`. Drizzle schema updated.
- **Types**: `Listing.attributes: z.record(z.string(), z.unknown()).optional()` in `src/lib/types.ts`. `ListingFilters.attrs?: Record<...>` for URL-encoded `a.<key>=value`.
- **Filter engine** (`src/lib/filter.ts`): `parseFilters` reads `a.*` keys, `applyFilters` calls `attrMatches` for jsonb filtering. Supports booleans (`"1"`), ranges (`"min..max"`), multi (CSV), strings, numbers. `buildQueryString` re-serializes. `activeFilterCount` includes attrs.
- **Supabase adapter** (`src/db/supabase-adapter.ts`): `rowToListing` returns attributes; createListing/updateListing pass through. Filtering still delegates to shared `applyFilters` after fetch — fine for current 72-row scale.
- **Category-filters data** (`src/data/category-filters.ts`): full FILTER_DEFS for 6 categories with FilterField/FilterOption/groupFields helper. Auto has full equipment groups (climate, safety, parking, multimedia, sport), EV stack, etc. Moto/Gospodarska/Mehanizacija/Prosti-cas/Dijelovi all have category-specific taxonomies.
- **Sidebar** (`src/components/filter-sidebar.tsx`): category selector + subcategory at top, make list scoped to category, dynamic AttrField renderer at bottom for category-specific attrs (toggle / range / select / multi / text).
- **Napredno page** (`src/app/oglasi/napredno/page.tsx` + `src/components/napredno-form.tsx`): converted to client form, category-aware, hides Karoserija for non-auto, renders dynamic Specifični filtri section by category.
- **Seeded attributes**: `scripts/populate-attributes.mts` ran successfully — 72 rows updated with deterministic per-category attrs (hash-seeded PRNG so re-runs are stable). Verified via SQL: 42/52 autos have appleCarPlay, all 6 motos have motoCategory.

## Pending — pick up here

### Task #50 — Verify napredno page (in_progress)
Build green at checkpoint. Next step: spawn `npm run dev` and Playwright-walk:
1. `/oglasi` — pick category Moto → confirm sidebar shows MOTO-specific groups (Sport/Naked/Tourer, stroke, licence class, etc.)
2. `/oglasi/napredno` — pick category Mehanizacija → confirm dynamic section shows operatingHours, bucketCapacity, drive4x4
3. Toggle 2 attrs, submit, confirm `/oglasi?category=moto&a.motoCategory=Sport&a.abs=1` URL works and filters listings

### Task #51 — Commit + finish
Single commit message:
```
feat(filters): state-of-the-art per-category filtering

- listings.attributes jsonb + GIN index
- 6-category filter taxonomy (auto/moto/gospodarska/mehanizacija/prosti-cas/dijelovi)
- Dynamic FilterSidebar + napredno page render category-specific attr groups
- URL-encoded a.<key>=value for jsonb filtering (range / multi / toggle / select)
- Shared applyFilters in memory + supabase adapters
- Seed populator script generates deterministic per-category demo attrs
```

## Files modified (uncommitted)
```
M src/app/oglasi/napredno/page.tsx       — turned into thin server wrapper
M src/components/filter-sidebar.tsx       — category-aware + dynamic attrs
M src/db/schema.ts                        — attributes jsonb column
M src/db/supabase-adapter.ts              — attributes pass-through
M src/lib/filter.ts                       — parse/apply/serialize a.* attrs
M src/lib/types.ts                        — attributes + attrs on filters
?? scripts/populate-attributes.mts        — deterministic per-cat seeder (ran OK)
?? src/components/napredno-form.tsx       — client form (replaces inline form on page)
?? src/data/category-filters.ts           — FILTER_DEFS for 6 categories
```

## Known risks for next session
- Build was broken at last save — re-run `npm run build` FIRST.
- The Croatian make lists for non-auto categories in `src/data/categories.ts` are starter lists — moto/gospodarska/mehanizacija/prosti-cas should not look empty when picked. (Was verified to populate.)
- Slovenian-derived field translations in `category-filters.ts` may need a quick pass for Croatian idiom (e.g. "Karoserija" terms).
- `dijelovi` category has 0 listings — picking it shows empty results. Add 3–5 seed parts before final demo.

## Live URLs / creds
- Supabase Frankfurt project: `auti-hr` (DB password in `.env.local` only, NOT keychain — must rotate before prod)
- DB pool: `aws-1-eu-central-1.pooler.supabase.com:6543`
- Local dev: `npm run dev` on :3000 (Turbopack)
- No GitHub repo wired yet
- No Vercel deploy yet
