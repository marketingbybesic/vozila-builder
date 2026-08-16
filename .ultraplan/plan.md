# Plan: Vozila.hr — Karlo 16.08. (7 stavki) — v2 nakon adversarijalne provjere

## Tier
Complex. Recenzent vratio FAIL na v1; ispravljeno 11 točaka (dolje).

## Context
6 stavki deploya danas; st.7 pripremljena, čeka Dinov `drizzle-kit push`.

## Architecture Decision
Suziti `scope` (Dinova odluka: miče i s detalja oglasa).
⚠️ Liste za `autobusi` i `utv` se NE POKLAPAJU — odvojene, doslovne.

## 🚨 Ispravci nakon recenzije (v1 je imao fatalnu grešku)
1. **st.4 BIO KONTRADIKTORAN**: v1 je rekao "makni `utv` iz istih lista kao autobuse",
   a `powerKw`:877, `engineCc`:882, `color`:1063 nose OBA sluga → UTV bi izgubio
   Snagu/Obujam/Boju, tj. baš ono što mu ATV daje. **`utv` OSTAJE na 877/882/1063.**
2. **Guardovi ne pokrivaju autobusi/utv/najam** (mjereno: 0 pogodaka u sva 3) →
   "5 guardova" bila bi lažna verifikacija. Proširiti CASES PRIJE zahvata.
3. st.2 popis bio 22/29 → dopunjen popisom izuzetaka.
4. st.5 pokriva 3 ulaza, ne 1. st.6 ima 3 mjesta, ne 1.

## Changes

### st.1 Regulativa (0 koda) — izvještaj Karlu
Nema zakonskog maksimuma. Zakon o zabrani neregistrirane djelatnosti (NN 61/11, 66/19):
čl.5 = redovitost+naplata NE broj; čl.7 = obvezni podaci naručitelja; čl.10 = kazna
10-15k (pravna)/5-10k kn (fizička). Njuškalo: naplaćuje, 30/60/90 dana → potvrđuje st.7.

### st.2 Autobusi (`src/data/category-filters.ts`) — makni `"autobusi"` iz scope-a
855 bodyType · 877 powerKw · 882 engineCc · 885 euroNorm · 890 seats · 893 rearDoors ·
899 sideDoors · 909 gvwKg · 911 payloadKg · 913 axles · 916 wheelbaseMm · 947 brakes ·
962 climate · 969 interior · 984 safety · 994 parking · 1000 otherEquipment ·
1020 ownership · 1028 numOwners · 1058 registrationUntil · 1060 importedFrom · 1063 color
**Obriši polja (scope samo `["autobusi"]`):** 917 axleConfiguration · 957 standingCapacity ·
1014 busWc · 1015 busTv
**⚠️ ZADRŽI `"autobusi"` na (Karlo NIJE tražio):** 256 km · 864 priceVat · 871 fuel ·
874 transmission · 1033 hideDamaged · 1036 hideBroken · 1052 engineRuns · **955 seatingCapacity**
**⚠️ Objava:** `post-listing-form.tsx:390` traži `powerKw` za gospodarsku → autobusi ga
gube; `:546` upisuje `powerKw:0`. Isto engineCc/color/bodyType/seats. PRIJAVITI Karlu.
**⚠️ Detalj:** `listing-fields.ts:26-46` isti scope → 21-24 autobus oglasa gubi 22 polja
s prikaza. Dino POTVRDIO 16.08.

### st.3 UTV u meniju (`src/data/categories.ts:392`)
`gospodarska: [...]` → dodaj `"utv"`. Jedini uzrok. `SUBCATEGORY_PRESETS` ne postoji.

### st.4 UTV = kopija ATV (`src/data/category-filters.ts`)
**Makni `"utv"` SAMO s kamionskih:** 855 bodyType · 885 euroNorm · 890 seats ·
893 rearDoors · 899 sideDoors · 909 gvwKg · 911 payloadKg · 913 axles · 916 wheelbaseMm ·
947 brakes · 962 climate · 969 interior · 984 safety · 994 parking · 1000 otherEquipment
**⚠️ NE DIRAJ `utv` na:** 877 powerKw · 882 engineCc · 1063 color · 871 fuel ·
874 transmission · 864 priceVat · 256 km · 1020 ownership · 1028 numOwners
**Dodaj u `GOSPODARSKA_FIELDS` scope `["utv"]`** (uzor `MOTO_FIELDS`:663-780):
motoCategory/Stil:685 · cylinders:701 · stroke:703 · drivetrain:709 · motoOptions:742 ·
oldtimer:771 · **`...SELLER_STATE_FIELDS`:178-196** (soldWhole/roadworthy/undamaged/…)
**Ljestvice:** `napredno-form.tsx:125` — `isMoto` je KATEGORIJSKI. Dodaj
`isMotoScale = isMoto || (category==="gospodarska" && contextSubcategory==="utv")`,
koristi `contextSubcategory`:83 (ne `subcategory` state:81), primijeni na :517/:520.

### st.5 Reset napredne — TRI ulaza (ne jedan)
- `site-header.tsx` desktop blok `aria-label="Napredna pretraga"` (:55-71)
- `site-header.tsx` mobilni blok (:217-224) — **isti bug**, uz `closeMenu()`
- `hero-search.tsx:69` (`?category=auto`) — isti pathname, isti bug
Dodaj `import { usePathname } from "next/navigation"` (nema ga). Obrazac:
`istaRutaNav` iz `category-nav.tsx:99-104`. ⚠️ NE `useSearchParams` (Suspense/build).
⚠️ Imenuj BLOK, ne broj retka (CLAUDE.md zamka off-by-one).

### st.6 Tekst — TRI mjesta
- `moj-racun/page.tsx:64` else grana → `""` (naslov:62, gumb:70 ostaju)
- `post-listing-form.tsx:1115` — "od 4,90 €"
- ⚠️ `cjenik/page.tsx:22` = **4,99 €** — nesklad, PRIJAVITI, ne dirati bez odluke

### st.7 PRIPREMA (bez pusha)
`schema.ts` listings + `expiresAt`/`renewedAt` (⚠️ `:134 expiresAt` je `sessions`, ne listings).
Sistemska metoda u OBA adaptera: `supabase-adapter.ts:483` + `memory-adapter.ts:298`
(`setListingStatus` je user-scoped). Cron `api/cron/listing-expiry` — auth preslikati iz
`saved-search-alerts/route.ts`. JOIN `users.sellerType`: Privatni → d27 mail, d30 `paused`
+ mail; Trgovac preskoči. ⚠️ Vercel Hobby = 2 crona (1 zauzet).

## Implementation Sequence
1. **Guardovi PRVO** — dodaj `["gospodarska", "autobusi"|"utv"|"najam"]` u
   `check-filters.mts:20`, `check-publish.mts:26`, `check-detail.mts:33`; pokreni (baseline)
2. st.6 (3 mjesta) → build
3. st.3 (1 redak) → build
4. st.2 scope → 5 guardova
5. st.4 UTV → 5 guardova
6. st.5 tri ulaza → build
7. Deploy, mjeriti na produkciji

## Edge Cases & Risks
- `najam` regresija MORA ići kroz `?category=gospodarska&subcategory=najam` — slug postoji
  u svih 6 kategorija (`categories.ts:50,69,79,89`), kriva daje lažni zeleni.
- Dupli ključevi 909/938, 911/941, 1033/1039 — scope disjunktan (prikolice), sigurno.
  ⚠️ NIKAD ne dodavati `"autobusi"` u 938/941/1039.
- `DB_DRIVER=supabase npm run build` (CLAUDE.md:93), ne goli build.
- Perzistencija se ne testira lokalno (memory adapter) → produkcija.

## Verification
`DB_DRIVER=supabase npm run build` + 5 guardova (s proširenim CASES) + Playwright/prod:
autobusi bez Boje/Obujma/Snage/Emisijske ali s Brojem sjedećih; UTV ima Stil/cilindri/
takt/prijenos **I** Obujam/Snagu/Boju; najam netaknut; 3 ulaza u naprednu resetiraju;
moj-racun bez teksta.

## Visual Proof
`/oglasi/napredno?category=gospodarska&subcategory=autobusi` i `&subcategory=utv`
usporedno s `?category=moto&subcategory=atv-utv` (1440+390); `/moj-racun` prijavljen.

## Rollback
`git revert <sha>` — sve u kodu, bez migracija (st.7 nije pushan).
