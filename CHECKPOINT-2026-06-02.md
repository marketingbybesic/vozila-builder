# Vozila.hr — Taxonomy + Advanced-Search Overhaul (changelog 02.06)

**Date:** 2026-06-02 · **Project:** /Users/zmaj/Projects/auti-hr

## GOAL
Best/simplest/most-advanced vehicle search. avto.net logic: (sub)category click opens a DEEP advanced search form, never auto-dumps listings. Full mobile parity. Every subcategory has its own deep filters.

## RESEARCH
- avto.net: `search_category.asp?SID=X` → category advanced FORM (not results). Submit → results.
- Single sources of truth: `categories.ts` (drives desktop nav + mobile menu), `category-filters.ts` (deep fields per category), `types.ts` (enums).
- **Listings have NO subcategory set, all category=auto → renaming subcats orphans NOTHING. Safe.**
- All needed lucide icons exist: Construction, Caravan, Disc, Forklift, Container, Bus.

## 12 REQUIREMENTS
1. Auto: drop Novi+Rabljeni → "Auto oglasi"; click opens advanced search.
2. Moto: add "Ponude za najam"; subcat click → advanced search; keep subcats on homepage.
3. Gospodarska: drop Kontejneri → add "Ponude za najam".
4. Icons: mehanizacija=excavator, prosti-cas=camper, dijelovi=brake disc.
5. Mehanizacija rename: Traktori→Poljoprivredni strojevi; Kombajni→Viličari; Bageri→Šumarski strojevi; Utovarivači→Komunalni strojevi; remove Viljuškari; Priključni strojevi→Ponude za najam; keep Građevinski strojevi.
6. Dijelovi (11): Auto dodatna oprema; Multimedija; Moto dijelovi i oprema; Za gospodarska vozila; Za građevinske strojeve; Za poljoprivredne strojeve; Za viličare; Servisna oprema; Gume; Felge; Ulja i tekućine.
7. Routing: subcat → /oglasi/napredno?category=X&subcategory=Y (advanced search, preselected).
8. Mobile parity (auto via shared CATEGORIES + matching hrefs).
9. Every subcat → deep advanced search.
10. More mock listings across all cats/subcats.
11. Homepage keeps subcats visible.
12. PDCA + visual audit + honest report.

## PHASES
A. Taxonomy (categories.ts) — subcats + icon union.  [DONE marker below]
B. Routing (category-nav.tsx + site-header.tsx) — subcat href → napredno.
C. napredno reads URL params, preselects, renders deep fields immediately.
D. Deep filters (category-filters.ts) — rich per category + subcat-specific.
E. Mock data (listings.ts) — more across cats/subcats.
F. Verify: build + Playwright desktop+mobile + native screenshots + honest report.

## STATUS LOG
- [x] A taxonomy  - [x] B routing  - [x] C napredno params  - [x] D deep filters  - [x] E mock data  - [x] F verify

## VERIFIED (Playwright, local dev 3100)
- 6 categories render w/ SVG icons (12 svg, 0 raster) — no image gen used
- Mehanizacija subcats renamed correctly, hrefs → /oglasi/napredno
- napredno preselects category+subcategory from URL, renders deep fields
- Dijelovi deep filters present (tire w/p/d, PCD, fluid type, viscosity, OEM)
- Mobile hamburger = full parity (11 dijelovi subcats + napredno hrefs)
- Build green, 95 static pages (was 72)
- UX fixes: sticky submit bar no longer overlaps; "Snaga (KS) (KS)" → "Snaga"

## KNOWN / DEFERRED
- Supabase CONNECT_TIMEOUT during build = network-only, graceful fallback to mock LISTINGS. Not a code defect.
- listings filtering for new categories delegates to applyFilters (in-memory) — works for mock scale.
- NOT deployed to Vercel yet (local only).
