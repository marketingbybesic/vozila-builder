# Plan: Vozila.hr — vizualni redizajn (auto-moto magazin) + audit + punjenje oglasa

## Tier
Critical — cross-cutting (svaka .tsx), 3 potrošača filter sheme, + data seed + feature audit.

## Context
Zamijeniti "AI-generic" vizualni sloj magazinskim izgledom BEZ promjene strukture/rasporeda/opcija; popraviti krive slike; napuniti 20+ oglasa po podkategoriji.

## Ograničenja (Dinova, eksplicitna — 2x ponovljena)
- STRUKTURA, RASPORED, OPCIJE = NEPROMJENJIVI. Samo vizualni sloj.
- Smijem mijenjati SADRŽAJ OGLASA da odgovara slici ("ako ti je lakše izmjeni oglas").
- Pazi na kontekst/memoriju, ubijaj agente po potrebi. Dev server ugasiti na kraju.

## Prior Art (iz memorije)
- `design_skill_stack.md` — frontend-design → impeccable → design-motion-principles, pa visual-proof.
- `vozila_karlo_moto_gospodarska_2026_07_27.md` — 3 komponente troše filter shemu; PW gotche; hasField+scope.
- ⚠️ `vozila_responsive_audit_progress.md` (R1-R16) = NAPUŠTENA Vite verzija, NE ovaj repo. Ne primjenjivati.
- Arhiva: `.ultraplan/plan-2026-06-22-filters-SHIPPED.md` (isporučeno, ne dirati).

## Utvrđeno prije plana (verificirano u kodu, ne iz memorije)
- `src/app/globals.css:27` `* { border-color: var(--color-line) }` → JEDNA poluga za 216 border callsiteova.
- Tokeni: bg #FAFAF7, surface #FFF, ink #0A1628, ink-soft #344256, muted #6B7280, line #E5E1D8,
  accent #F59E0B, accent-dark #B45309; radius 4/8/14/22; shadow-card + shadow-card-hover.
- Slike: JEDAN builder `src/data/listings.ts:37`. Unsplash CDN 200 bez ključa.
- BUG slike: 9/26 modela dijeli naslovnu (1606664515524 = vwGolf+audiA4+skoda+peugeot+hatch;
  1560958089 = tesla+ev; 1503376780353 = porsche+premium); 7 modela duplikat u galeriji.
- Envato: token radi, 219k fotki, ALI preview ima `mark=watermarks/photo-260724.png` → NEUPOTREBLJIVO.
- Seed: 91 oglas; većina podkategorija ima 1. Treba 20+/podkat.
- Borderi/datoteci: controls.tsx 26, post-listing-form 19, inbox 10, oglasi/[slug] 8, napredno-form 6.

## Nalazi eksploracije (Phase 2)

### ⚠️⚠️ NAJVAŽNIJE — seed NE IDE preko listings.ts
`.env.local` ima **`DB_DRIVER=supabase`** → `src/db/index.ts:10-22` bira supabase adapter.
`src/data/listings.ts` čita SAMO memory adapter (`memory-adapter.ts:13`), koji NIJE aktivan.
→ **Uređivanje listings.ts je NEVIDLJIVO u produkciji.** Novi oglasi moraju ići kroz
`scripts/seed-supabase.mts` (esbuild bundla listings.ts, upsert po slugu) uz pravi `DATABASE_URL`.
⚠️ Taj skript na konfliktu ažurira SAMO category/subcategory/attributes (`:74-80`) — ostala
polja tiho ne updateira. ⚠️ `subcategory` je goli `z.string()` (`types.ts`) → typo prolazi
validaciju i oglas se NIKAD ne pojavi u UI-u.

### Vizualni sloj — poluge
1. `globals.css:44-48` — `h1,h2,h3,h4,.display { font-display + UPPERCASE + letter-spacing }`
   **= glavni uzrok generičkog izgleda** (sve velikim slovima, bez obzira na kontekst).
2. `globals.css:3-25` @theme tokeni — boje/radiusi/sjene, referencirani preko var() svugdje.
3. `ui/button.tsx:6-33` — jedan cva variant map za sve CTA-e.
4. `ui/card.tsx:4-17` — jedini Card primitive, ali NEDOVOLJNO korišten.
5. `napredno/controls.tsx` — 13 form primitiva (SelectField/MultiSelect/RangeSelect/TogglePill…).

### Dijagnoza "ružnog"
- **~78 distinct lucide ikona** — bez sustava. Dekorativni "section head" badgevi
  (`page.tsx:186,195,204`, `savjeti/page.tsx:12-16`) = tipičan AI-look.
- **9 nekonzistentnih card stilova** — neki border+bez sjene, neki sjena+bez bordera, neki oba;
  dio koristi token `--shadow-card`, dio raw Tailwind `shadow-sm/md/xl`.
- **Nema `divide-y` nigdje** — separacija redova ide preko per-card bordera (odatle "ograđen" look).
- Tipografija: isti semantički nivo u 3+ različite veličine (`text-2xl` vs `text-xl md:text-3xl`
  vs `text-3xl md:text-4xl`). `font-sans` se NIGDJE ne poziva eksplicitno (samo body default).
- Card primitive nema CardHeader/CardTitle → svaki potrošač ručno piše naslov = drift.
- Borderi: NIJEDAN nije load-bearing za box model (padding/gap su zasebni) → sigurno ih je maknuti.
  Iznimka-pažnja: `site-header.tsx:24` border-b je jedina granica (bg je proziran),
  `page.tsx:111,181,252` border-b/y su trenutno JEDINI separator sekcija.

### Podaci — stanje (91 oglas, 53 parent bucketa, treba 20+ svaki)
- auto bez subcategory: 52. Sve ostalo 1-5. Max ikad = 5 (dijelovi/gume).
- **19 bucketa ima NULA oglasa**: auto(auto-oglasi,luksuzni,najam), moto(minimoto,oldtimer,gokart,
  motorne-sanke,e-skuter,e-moto), gospodarska(utv), mehanizacija(gradevinski-strojevi),
  prosti-cas(mobilne-kucice,moduli-za-kamper,satorske-prikolice,e-skuteri,kamping-oprema),
  dijelovi(za-gospodarska,za-poljoprivredne-strojeve,za-vilicare,moto-dijelovi).
- → Ovo je seed od nule, ne "dopuna". ~400+ zapisa za 20/bucket.
- Slug: `listings.ts:1191-1196` auto-inkrement `lst-NNNN` → novi zapisi ne mogu kolidirati.
- Spec tip (`listings.ts:44-77`) je praktični cilj za autoring, ne goli `Listing`.

### Slike — 9 kolizija potvrđeno (gore nego procijenjeno)
`1606664515524`→vwGolf+audiA4+skoda+peugeot+hatch (5-way, slika je Golf) ·
`1605559424843`→audiA4+forklift+hatch · `1494976388531`→bmw3+porsche+renault ·
`1621007947382`→suv+toyota · `1618843479313`→merc+premium · `1583121274602`→renault+toyota ·
`1560958089`→ev+tesla · `1542362567`→bmw3+peugeot · `1503376780353`→porsche+premium
Dealeri (`dealers.ts:18-115`) statični, slugovi `lst-d0NN` NE postoje → klik = 404 (potvrđeno).

### Audit — 5 POTVRĐENIH bugova (verificirano u kodu, ne iz memorije)
1. **"Tip ponude" filter je MRTAV** — `offerType` je `storage:"attr"` (`category-filters.ts:791,912`)
   ali se piše kao goli param (`filter-sidebar.tsx:143`, `napredno-form.tsx:259`). Nije u
   `RESERVED_PARAMS` (`filter.ts:57-64`) NI `a.`-prefiksiran → `parseFilters` ga TIHO ODBACI.
   Dodatno ga `post-listing-form` nikad ne upisuje u `attributes` → ni ne bi imao što matchati.
2. **`hidePriceless` toggle nema efekta** — `napredno-form.tsx:250` piše u URL, nitko ne čita.
3. **`next` param se odbacuje** — `proxy.ts:14` ga postavi, `actions/auth.ts:42,63` hardkodira
   `redirect("/moj-racun")` → duboki link nakon prijave se izgubi.
4. **Inbox je 100% lažan** — `inbox.tsx` ima hardkodirane `THREADS`, submit samo `preventDefault()`
   + očisti draft. Backend POSTOJI i radi (`db().listThreads`/`sendMessage`, `message_threads`,
   koristi se za unread badge u `moj-racun/layout.tsx:8-9`). Samo UI nije spojen.
   BONUS perf: `inbox.tsx` je `"use client"` i importa cijeli `listings.ts` u klijentski bundle.
5. **Početna laže broj** — `page.tsx:53` "12.847 oglasa" je literal string, ne izračun.

### ✅ Ispravke stare memorije (agent me demantirao, provjerio sam sam)
- Spremljena pretraga + email alarmi **RADE u cijelosti**: UI + `saved_searches` + `lib/email.ts`
  (Resend, ključ postavljen, 36 zn.) + Vercel cron `vercel.json:6-10` (0 8 * * *, ruta postoji).
  Backlog stavka "pipeline fali" je ZASTARJELA.
- "admin login-redirect / auto-signup ne uhvati sesiju" **NIJE stvaran** — sesije su DB-backed,
  cookie se postavlja ispravno na oba flowa. Stvaran je bug #3 (`next`), drugi mehanizam.
- Nema NI JEDNOG TODO/FIXME u `src/`. 35 ruta, 0 mrtvih nav linkova. `/zaboravljena-lozinka` je
  namjerno onemogućen stub (iskren, s objašnjenjem) — ne "neizgrađen do kraja" u lošem smislu.

## Dinove odluke (Phase 1)
- **Tipografija se NE DIRA** — uppercase Bebas ostaje. ⚠️ To znači da glavna poluga (`globals.css:44-48`)
  NIJE dostupna → sav vizualni dobitak mora doći iz površina/bordera/ikona/ritma prostora.
- **Sve 53 rubrike na 20 oglasa** (~400+ novih, MORA ići kroz seed u Supabase).
- **Svih 5 bugova, UKLJUČIVO inbox** na pravu bazu.

---

## Architecture Decision
Vizualni dobitak iz **površina + ritma + ikonografije**, ne iz tipografije (Dino je zaključao):
zamijeni "sve u okviru" pristup s *elevation + bjelina + hairline razdjelnici* — kartica se čita
kao fotografija s podacima, ne kao ograđena kutija. Odbačeno: retuniranje `@theme` boja (accent
#F59E0B je Karlov brand, ne dirati) i uklanjanje SVIH bordera (header/sekcije bi izgubili granicu).

## Changes

### A. Vizualni sloj (struktura/raspored/opcije NEPROMIJENJENI)
- **`globals.css:27`** — `* { border-color }` ostaje, ALI dodaj `--color-line-soft: #EFEBE2`
  (hairline za unutarnje razdjelnike) + `--shadow-flat` (0 1px 0 rgb(10 22 40/4%)).
  ⚠️ NE dirati `:44-48` (tipografija zaključana).
- **`ui/card.tsx:11`** — borderless default: `bg-surface rounded-lg shadow-[var(--shadow-card)]`.
  Dodaj `variant?: "flat"|"outlined"` da `outlined` zadrži border za rijetke slučajeve (admin tablice).
- **`listing-card.tsx:15`** — makni `border` + `hover:border-ink-soft`; ostavi shadow-hover +
  `-translate-y-0.5`. `:69` `border-t` → `border-t border-[var(--color-line-soft)]`.
  `:103,105` (ListingRow) isto.
- **9 nekonzistentnih card stilova** ⚠️ (review: **NIJEDNA datoteka trenutno ne importa `<Card>`** —
  sve su ručno pisani divovi; `moj-racun/postavke/page.tsx` ima čak lokalnu funkciju istog imena).
  → NE uvodim `<Card>` kao refaktor (to je prerada, rizik za "strukturu"). Umjesto toga:
  **ujednači klase na mjestu** (bg/radius/shadow token, bez bordera) u svakoj datoteci, 1:1 vizualno.
  `<Card>` primitive ažuriram za buduće korištenje, ali ne prepisujem potrošače. Datoteke:
  `admin/page.tsx:24`, `moj-racun/page.tsx:42`,
  `trgovci/page.tsx:37`, `oglasi/[slug]/page.tsx:212`, `savjeti/page.tsx:44` (ovaj koristi raw
  `shadow-md` → token), `new-listings-feed.tsx:14`, `napredno/filter-panel.tsx:31`.
  `dealer-showcase.tsx:17` i `napredno/controls.tsx:135` na tokene (`shadow-sm`/`shadow-xl` → token).
- **Sekcijski separatori** `page.tsx:111,181,252` — ⚠️ te sekcije SU VEĆ `bg-surface` (bijele) na
  `bg` (#FAFAF7) stranici, pa je kontrast već tu; border-y je redundantan → makni border, pojačaj
  vertikalni ritam (py). `site-header.tsx:24` border-b OSTAJE (jedina granica, bg proziran).
- **Ikone: 78 → ~30.** ⚠️ Razjašnjeno (review je tražio): mijenja se SAMO `<Icon>` element unutar
  badge diva — **wrapper div, njegove dimenzije i grid ostaju** (inače je to layout promjena koju
  je Dino zabranio). Dekorativni badgevi (`page.tsx:186,195,204`, `savjeti/page.tsx:12-16`) dobivaju
  suptilniju ikonu/tretman, ne brisanje kutije. Zadrži funkcionalne (X/Chevron/Search/Slider/Trash).
  Ujednači veličine na `size-4` (akcije) / `size-3.5` (meta) — sad ih je 5 različitih.
  `body-icons.tsx` (custom SVG siluete) OSTAJE — to je magazinski adut.
- **Motion**: `globals.css` već ima slide-up/fade-in. Dodaj `prefers-reduced-motion` guard.

### B. Bugovi (5)
- **B1 offerType** ⚠️ (ISPRAVLJENO nakon adversarial reviewa — moja prva verzija bila je NO-OP):
  `RESERVED_PARAMS` samo gata što `parseAttrs` IZUZIMA; `parseFilters` ima ZASEBNU whitelistu i
  `ListingFilters` (`types.ts:123-153`) NEMA `offerType`, `applyFilters` nema granu za njega.
  → Pravi fix: UI mora pisati `a.offerType` (attr semantika koju polje već deklarira), tj.
  `napredno-form.tsx:259` i `filter-sidebar.tsx:143`. NE dirati `filter.ts` whitelistu.
  + `post-listing-form` mora upisati `attributes.offerType`. Verificirati u SVE 3 komponente.
  ✅ Kodiranje provjereno: `parseAttrs` (`filter.ts:84`) dijeli na array SAMO ako ima zarez, pa
  jedan odabir ostaje string — `attrMatches` podnosi oba oblika (array preko `expected.includes`
  `:108`, string preko `String(actual)!==String(expected)` `:126`). Dakle `a.offerType` radi
  i za 1 i za više odabira, bez izmjena u `filter.ts`.
- **B2 hidePriceless**: čitati param u `parseFilters` → filtrirati `priceEur > 0`.
- **B3 next**: `actions/auth.ts:42,63` — primi `next` iz forme, `redirect(next ?? "/moj-racun")`,
  validiraj da je relativan (`startsWith("/")`, ne `//`) protiv open-redirecta.
- **B4 inbox** ⚠️ (manje posla nego mišljeno): `src/actions/messages.ts` VEĆ ima
  `sendMessageAction` (:17) i `markThreadReadAction` (:30) — ne treba ih pisati.
  Posao = spojiti: `moj-racun/poruke/page.tsx` server-fetch `db().listThreads` → props u `Inbox`,
  submit → `sendMessageAction`. Ukloni `@/data/listings` import iz klijentskog bundlea.
  ⚠️ Zadrži POSTOJEĆI oblik markupa (Dinovo ograničenje) — mijenja se izvor podataka, ne izgled.
- **B5 broj oglasa**: `page.tsx:53` → `db().countListings()` (ili `listListings` total), formatiran hr-HR.
- **B6 dealer 404** (review: bio dijagnosticiran bez odluke): `dealers.ts` slugovi `lst-d0NN` ne
  postoje → klik na oglas trgovca = 404. Fix uz seed C: dealerima dodijeli PRAVE slugove iz
  seedanih oglasa (najlakše: nakon seeda mapiraj po marki/modelu), ili linkaj na `/trgovci/<slug>`.
  Odluka: rješavam ZAJEDNO s C jer tek tada postoje pravi oglasi za mapiranje.

### C. Podaci (~400+ oglasa, **52** rubrike × 20 — ne 53, vidi niže)
- ⚠️ **`auto-oglasi` NE seedati** — UI ga izuzima iz svake liste podkategorija
  (`napredno-form.tsx:544`, `filter-sidebar.tsx:79`, `post-listing-form.tsx:127`), a nav link
  (`site-header.tsx:156-159`) ide na `?category=auto` BEZ `subcategory`. To je ulazna točka za
  naprednu pretragu, ne filter-vrijednost → 20 oglasa tamo bilo bi trajno nedostupno.
  Ti oglasi idu u `auto` bez `subcategory` (gdje već živi postojećih 52).
- Novi Spec zapisi u `listings.ts` (`SPECS`/`EXTRA_SPECS`, dijele `counter` → slug unikatan).
- **Slike: 9 kolizija razriješiti** — nove imenovane skupine po tipu vozila; naslovna slika smije
  pripadati SAMO jednoj skupini. Gdje je lakše → uskladi marku/model oglasa sa slikom (Dinovo dopuštenje).
- **Svaki novi Unsplash ID: HTTP 200 + vizualna provjera da je pravo vozilo.**
  ⚠️ regex `photo-[a-z0-9]*-[a-z0-9]*` (kratki reže ID → lažnih 100% 404).
- **`subcategory` typo guard**: skript koji provjeri da je svaki `subcategory` u `categories.ts`
  (goli `z.string()` propušta typo → oglas nevidljiv zauvijek).
- **Deploy podataka**: `npx tsx --env-file=.env.local scripts/seed-supabase.mts` (bez toga NIŠTA
  se ne vidi jer je `DB_DRIVER=supabase`).

## Implementation Sequence
1. **C-priprema**: generiraj + validiraj slikovne skupine (HTTP 200 + oči). Bez slika nema seeda.
2. **C-seed**: Spec zapisi → `listings.ts` → subcategory guard skript → `seed-supabase.mts` → provjeri broj u DB.
3. **B1-B3, B5** (čisti, mali, mjerljivi) — build + filter smoke test nakon svakog.
4. **B4 inbox** (najveći rizik, zadnji od bugova) — server action + brisanje client importa.
5. **A tokeni** (`globals.css` + `ui/card.tsx`) — temelj prije potrošača.
6. **A potrošači** (listing-card → 9 card stilova → sekcije → ikone). Screenshot nakon svake grupe.
7. Puni vizualni audit 5 viewporta + kontrast iz piksela + deploy.

## Edge Cases & Risks
- **Tipografija zaključana** → ako nakon A koraka izgled još "AI-generic", NE dirati fontove;
  javiti Dinu i predložiti tipografiju kao zasebnu odluku.
- **Seed idempotencija**: postojećih 91 slugova dobiva samo category/subcategory/attributes update
  (`seed-supabase.mts:74-80`) — ostala polja NE. Novi slugovi se INSERTaju u cijelosti. Ne re-runati naslijepo.
- **`--color-line` ostaje token** — 216 callsiteova ga koristi; mijenjam gdje se koristi, ne vrijednost.
- **Border uklanjanje**: nijedan nije load-bearing (padding/gap zasebni), ali header i sekcije su iznimke.
- **B1 rizik**: `offerType` u `RESERVED_PARAMS` mijenja `parseFilters` ponašanje → regresija na
  postojećim URL-ovima. Test: stari URL s `offerType=Najam` mora i dalje vratiti 200.
- **Kontekst/memorija**: agenti samo za eksploraciju (max 1-2 paralelno), NE za pisanje koda.
  Dev server gasiti nakon svake verifikacijske runde (orphan node = Mac crash).
- ⚠️ **`napredno/controls.tsx:135` je JEDINA iznimka za bordere** (2x potvrđeno adversarial reviewom):
  to je lebdeći popover, bijel na #FAFAF7 — border mu daje definiciju. Njemu border OSTAJE
  (ili zamijeniti jačom sjenom), inače dropdown "pluta" bez granice.
- ✅ Nema white-on-white rizika: svih 5 provjerenih card lokacija sjedi na #FAFAF7, ne na bijelom.

## Adversarial verifikacija
Runda 1: **FAIL** — 3 stvarna defekta u mom planu: (a) B1 fix preko `RESERVED_PARAMS` bio bi NO-OP,
(b) rollback `LIKE '%-lst-0[1-9]...'` matcha NULA redova (Postgres LIKE nema klase znakova),
(c) seed u `auto-oglasi` trajno nedostupan. Plus: `<Card>` nitko ne importa (refaktor, ne swap),
`sendMessageAction` već postoji, dealer 404 bez odluke.
Runda 2 (nakon ispravaka): **PASS** — svih 5 točaka verificirano neovisno.

## Verification
`DB_DRIVER=supabase npm run build` (zelen) + adapter count = 91+~400 oglasa +
filter smoke: `a.offerType=Najam` i `hidePriceless=1` MIJENJAJU broj rezultata (prije: ne mijenjaju) +
inbox: poslana poruka preživi refresh (čita se iz DB, ne iz state-a) +
0 kolizija naslovnih slika (skript) + 0 subcategory typo + 5 viewporta bez horiz. scrolla.
Dodano nakon reviewa:
- **Dohvatljivost**: za SVAKU od 52 rubrike otvori pravi URL kroz koji korisnik dolazi i potvrdi
  ≥20 rezultata (typo-guard NE hvata "valjan ali nefiltrabilan" slug kao `auto-oglasi`).
- **Perf na ~500 redova**: `supabase-adapter.ts:239-243` sam dokumentira da filtrira u JS-u i da
  "52 oglasa je ispod svake brige" → izmjeri latenciju `/oglasi` prije/poslije seeda;
  ako >300 ms, filtriranje ide u SQL (zabilježiti, ne nagađati).
- **Build scale**: `generateStaticParams` sad prerenderira 135+ putanja → provjeriti vrijeme builda
  i broj SSG stranica pri ~500 oglasa (172 stranice trenutno).
- **Regresija starih URL-ova**: `?offerType=Najam` (stari oblik) mora vratiti 200, ne 500.

## Visual Proof
Screenshot @1920/1440/1024/768/390: `/`, `/oglasi?category=auto`, `/oglasi/napredno?category=moto`,
`/oglasi/<slug>`, `/moj-racun/poruke`. Prije/poslije naslovnice i kartice oglasa.
Kontrast IZ PIKSELA (PIL percentili), ne `getComputedStyle` (Tailwind v4 → oklab).
Provjeri 20 slučajnih oglasa: slika odgovara marki/modelu u naslovu.

## Rollback
`git revert <commit>` po fazi (A/B/C su odvojeni commiti).
Podaci ⚠️ (ISPRAVLJENO — moja prva verzija je matchala NULA redova):
Postgres `LIKE` NEMA klase znakova `[0-9]` (to je `SIMILAR TO`/regex) → stari uvjet je bio mrtav kod.
Sigurno i eksplicitno, bez oslanjanja na uzorak:
`delete from listings where slug ~ '-lst-[0-9]{4}$' and (substring(slug from '-lst-([0-9]{4})$'))::int > 91;`
Prije DELETE-a OBAVEZNO `select count(*)` s istim `where` (mora biti ≈400, ne 491).
