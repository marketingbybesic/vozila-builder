# Plan: Category-driven napredna pretraga (ne pregazi postojeće)

## Tier
Complex

## Context
Napredno-forma hardkodira auto-sekcije (Motor cm³/kW, Karoserija, Boje, TIP) za SVE kategorije; učiniti je schema-driven po kategoriji + dodati category-picker + submenu routing — bez rušenja postojećeg.

## Architecture Decision
`category-filters.ts` = JEDAN izvor istine za pretragu I objavu. Schema-driven gating po `category` + per-field `publishRequired`/`searchable`/`scope`. Većina novih polja = attr(jsonb) → BEZ DB migracije, BEZ rušenja kolona. Domenska analiza (6 agenata) → .ultraplan/domain-research.md.

## Changes

### 1. category-filters.ts — proširi pokrivenost (data)
- **File**: `src/data/category-filters.ts`
- Provjeri/dopuni da svaka kategorija ima logična polja: gospodarska (nosivost/osovine/euro već ima), mehanizacija (radni sati/tip stroja već ima, makni km — MEHANIZACIJA nema COMMON_KM, OK), prosti-cas (dimenzije/ležajevi/udobnost već ima). Dodati group naslove gdje fale.
- Auto zadržava sve. NE diraj postojeće key-eve (URL stabilnost).

### 2. napredno-form.tsx — schema-gated sekcije (glavni rad)
- **File**: `src/components/napredno-form.tsx`
- `hasField(key)` helper: `filterDef.fields.some(f=>f.key===key)`.
- "Motor i karoserija" panel: renderira pojedina polja samo ako kat ima taj key (engineCc/powerKw/fuel/transmission/bodyType). km/karoserija nestaju za mehanizaciju automatski.
- TIP polje: ostaje samo `isAuto` (već je).
- Boje panel: samo ako `hasField("color")`.
- "Vrata i sjedala" + ostale basicDynamic: nepromijenjeno (već radi).
- **Category picker** (tabs/kućice) na vrhu: vidljiv kad `!sp.get("subcategory")` (tj. ulaz preko ikone). Klik mijenja `category` state → polja se re-derive (filterDef je već `useMemo` na category, ALI category je trenutno `useState` bez settera → promijeniti u `useState` s setterom + reset relevantnog state-a na promjenu).
- Kad ulaz IMA subcategory: sakrij picker, prikaži "Svi oglasi →" link gore (kao Sve marke) na `/oglasi?category=X`.
- ČUVA: chips, RangeSelect, BodyTypePicker, MultiSelect, scroll-hint, mobile/panel — sve reuse.

### 3. category-nav.tsx + site-header.tsx — submenu routing
- **Files**: `src/components/category-nav.tsx:74-76`, `src/components/site-header.tsx:112-114`
- SVE podkategorije (ne samo auto-oglasi) → `/oglasi/napredno?category=X&subcategory=Y`.
- Zadrži auto-oglasi → napredno (već je).

### 4. controls.tsx — dodati Tabs/CategoryPicker komponentu (reuse)
- **File**: `src/components/napredno/controls.tsx`
- Nova `CategoryTabs` (kućice s ikonom kategorije, aktivna = accent). Ne dira postojeće.

### 5. post-listing-form.tsx — category-aware objava (KONZISTENTNOST search↔upis)
- **File**: `src/components/post-listing-form.tsx`
- Dodaj korak 0 / vrh: izbor KATEGORIJE (auto/moto/gospodarska/mehanizacija/prosti-cas/dijelovi) + podkategorija.
- Korak "Specifikacije" (step 2) renderira polja iz ISTE scheme (category-filters.ts) za odabranu kategoriju — ista polja kao napredna pretraga (mehanizacija upisuje Radni sati/Tip stroja, ne Karoserija; moto upisuje Stil/Cilindri).
- column polja → listing kolone; attr polja → listing.attributes jsonb (isti storage kao pretraga → filteri rade na objavljenim oglasima).
- stepValid prilagodljiv po kategoriji (ne traži bodyType/powerKw za mehanizaciju).
- ČUVA: 5-step wizard, photos, opis, kontakt, submit flow.

## Implementation Sequence
1. category-filters.ts — dopuni group naslove/coverage + `publishRequired?` flag na ključnim poljima (data prvo).
2. controls.tsx — dodaj CategoryTabs (čista adicija).
3. napredno-form.tsx — category setter + hasField gating + picker + Svi oglasi link.
4. post-listing-form.tsx — category izbor + schema-driven step Specifikacije (konzistentno s pretragom).
5. category-nav.tsx + site-header.tsx — routing svih subcat na napredno.
6. Build + Playwright per-kategorija verify (pretraga I objava).

## Edge Cases & Risks
- **URL/filter logika**: NE mijenjati key-eve ni serijalizaciju (fuel=, bodyType=, a.key=). Gating samo skriva render, state ostaje.
- **category postaje mijenjiv**: na promjenu resetiraj make/model/fuel/bodyType/attrs (jer se opcije razlikuju) da ne ostanu nevažeći filteri.
- **Postojeći testovi**: submit→/oglasi, chips remove, body picker, 100 marki — moraju proći.
- **Mehanizacija nema make-liste**: makeOptions fallback već postoji (categoryDef.makes).
- **Picker vs subcategory**: ako oboje (ne bi trebalo), subcategory pobjeđuje (sakrij picker).

## Verification
`cd ~/Projects/auti-hr && npm run build` (green) + Playwright: za auto/moto/gospodarska/mehanizacija/prosti-cas otvori napredno, potvrdi da se sekcije razlikuju (mehanizacija: NEMA Karoserija/Boje, IMA Radni sati/Tip stroja; moto: IMA Stil/Cilindri); submit→/oglasi s točnim params; submenu klik (Motocikli)→napredno?category=moto&subcategory=motocikl bez pickera + "Svi oglasi" link.

## Visual Proof
Screenshots @1000px: napredno?category=mehanizacija (no karoserija/boje), ?category=moto (stil/cilindri), ?category=auto (picker vidljiv), ?category=moto&subcategory=motocikl (no picker + Svi oglasi link). Per-kategorija section-title dump.

## Rollback
`git checkout src/components/napredno-form.tsx src/data/category-filters.ts src/components/category-nav.tsx src/components/site-header.tsx src/components/napredno/controls.tsx` (sve na zadnji commit af80a6c).
