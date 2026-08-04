@AGENTS.md

# VOZILA.HR — PRAVILA (učitava se automatski, prije konteksta)

## 0. TKO PIŠE
**Karlo piše Claudeu direktno** (od 31.07.2026). Nije informatičar.
- Opisuje **što VIDI na ekranu**, ne gdje je uzrok. Njegov opis ≠ dijagnoza.
- **Prvo utvrdi MJESTO, pa kod.** Pitaj: *"koja adresa u pregledniku + koja kategorija?"*
  Nikad ga ne pitaj za žargon (komponenta / scope / shema) — to je moj posao.
- **Odgovor bez žargona**: ne "dodao scope na engineCc" → "obujam se sad vidi samo
  kod dostavnih, kod kamiona ga nema".
- Tehničke odluke donosim sam; njega pitam samo vrijednost / naziv / redoslijed.
- Diktira s **avto.net**, često slovenski → prevedi na hrvatski, ne prepisuj.
- **Ne on verificira, nego ja.** Screenshot/brojanje na PRODU prije "gotovo".
- Kad bug prijavi, traži: **koji korak, koje polje, mobitel ili računalo**.
  Ne pokreći puni E2E prije toga — skupo je i lako promaši.

## 0.1 ⚠️⚠️ MINIMALNI ZAHVAT — diraj SAMO ono što je traženo
Dinova uputa (04.08.2026): *"ne diraj druge stvari iz oglasa ili bilo šta osim
onog što ti kažem, da ne pregaziš nepotrebno stvari jer nastaju bugovi tako"*.

- **Točno traženo, ništa više.** Uočim drugi problem → **prijavim ga, ne popravljam**.
  Odluka je Dinova.
- **Nema usputnog** refaktoriranja, preimenovanja, sortiranja, čišćenja mrtvog koda,
  formatiranja ni "dok sam već tu" izmjena.
- **Jedna datoteka ako je ikako moguće.** Vizualna promjena na jednom mjestu →
  filtriraj na **PRIKAZU** (`src/app/oglasi/[slug]/page.tsx`), nikad u dijeljenoj
  funkciji (`lib/listing-fields.ts`, `category-filters.ts`) koju troše kartica,
  usporedba, moji oglasi i admin.
- **Prije commita `git diff --stat`** — dirnuto više nego što zadatak traži → vrati višak.
- Vrijedi i za BAZU: ne migriram i ne "sređujem" redove koji nisu dio zadatka.

Zašto: runda 18 — build zelen + tsc čist, a polje **Tip boje NESTALO** zbog
nepotrebnog prelaska na shemu. `c0bd50a` — prva verzija dirala zajedničku
`specGroupsFor()`, vraćena `git checkout`-om.

## 1. PDCA + DEVIL'S ADVOCATE — obavezno, bez iznimke
PLAN (5–10 redaka) → **DEVIL'S ADVOCATE (3–5 načina da plan padne)** → DO →
**VIZUALNA PROVJERA** → **POŠTEN IZVJEŠTAJ O KVAROVIMA** → LEARN (memorija).
Nijedan korak se ne preskače, ni kad izgleda očito.

## 2. VIZUALNA PROVJERA — "trebalo bi raditi" je ZABRANJENO
- Riječi *gotovo / popravljeno / radi* traže: **build zelen ILI screenshot ILI
  uspješan pokretaj nad pravim podatkom**. Inače: "provjereno djelomično: <što> — <što nije>".
- **PROČITAJ screenshot**, ne samo napravi ga. Brojke znaju reći "razlika 0",
  a slika pokaže rupu.
- Build zelen + tsc čist **NIJE dokaz** — runda 18: polje "Tip boje" NESTALO uz
  zelen build. Uhvaćeno tek brojanjem na produkciji.
- **Ishod dokazuj iz PODATAKA**, ne iz teksta na ekranu (novi slug u bazi,
  `curl` detaljne = 200, `/oglasi/najnoviji` sadrži novi `lst-XXXX`).

## 3. RAM — Mac ne smije stati
- Prije teškog posla provjeri: `ps -A -o rss,pid,comm | grep -i node`.
  Zdravo ≈ 9 procesa / ~800 MB od 36 GB.
- `pkill -f "next dev"` prije novog dev servera; **ne** ostavljaj osirotjele node procese
  (oni pišu 30 MB/s i ruše Mac — vidi memoriju `feedback_mac_crash_orphan_node_daemons`).
- **Ne** pokretati build + Playwright + swarm istovremeno. Jedan po jedan.
- Playwright: **jedan slučaj po procesu**. Petlja s više `goto` pouzdano zaglavi.

### 3.1 ⚠️⚠️ PLAYWRIGHT = VIDLJIV PROZOR (Dino gleda uživo)
Dinova uputa 04.08.2026: *"playwright uvijek tako otvaraš za sve što god radiš da
ja mogu vidjeti prozor… eventualno ako je mobilni prikaz, ali bi htio da to imamo
kroz developer tools"*.

- **Uvijek headed, vidljiv prozor.** Dino testira sam u istom prozoru dok ja mjerim.
- **NIKAD `browser_resize`** za desktop. Fiksira viewport → sadržaj zauzme lijevih
  ~1500 px, desno i dolje **prazna bijela traka**, zaglavlje odrezano. Izgleda kao
  bug stranice, a moj je resize. Trebaš širinu? **Pročitaj** `window.innerWidth`.
- **Mobilni prikaz = DevTools device emulacija** (device toolbar), ne resize —
  ostaje isti prozor i Dino sam prebacuje uređaje.
- Screenshot **bez `filename`** — s imenom ga MCP tiho ne zapiše.

## 4. DIZAJN — fluidan UX, nikad "claude-generirano"
- Estetika: **auto-moto**, ne generički AI izgled. Tipografija ZAKLJUČANA (uppercase Bebas).
- Fibonacci ritam: 34 mobilni / 55–89 desktop.
- Prije UI koda: `frontend-design` → `impeccable` → `design-motion-principles`.
- Kontrast **mjeri iz PIKSELA** (PIL), ne `getComputedStyle` — Tailwind v4 vraća
  `oklab()` koji se ne parsira, a `<section>` ima prozirni bg.
- 5 viewporta: 320 / 390 / 768 / 1024 / 1920. Nula horizontalnog scrolla.
  Grid: `grid-cols-[repeat(N,minmax(0,1fr))]` na SVAKOM breakpointu.

## 5. CHECKPOINT + DEPLOY (Dinova uputa)
- **Nakon svakog prompta**: checkpoint u `~/.checkpoints/vozila-<datum>-<tema>.md`
  (NE u root projekta, NE na `/Volumes` — labela zna otpasti).
- **Nakon svakog prompta**: deploy na Vercel.
- **Nakon SVAKOG gotovog posla**: `git push origin main` →
  `marketingbybesic/vozila-builder` (javan repo). **Ne čekati 5 commita** —
  Dino ubacuje repo u Gemini ("add code") na pregled, pa `main` na GitHubu mora
  odgovarati onome što je deployano, inače Gemini gleda stari kod.
  Uz link mu reci koji je zadnji commit.

```bash
DB_DRIVER=supabase npm run build      # mora biti zelen PRIJE deploya
vercel deploy --prod --yes --token $(security find-generic-password -a $USER -s vercel_api -w)
git push origin main
```

## 6. ARHITEKTURA — što se lako pokvari

**Shemu filtera troše TRI komponente. Promjena u jednoj NE ide u druge dvije:**
| Komponenta | Ruta |
|---|---|
| `napredno-form.tsx` | `/oglasi/napredno` |
| `filter-sidebar.tsx` | `/oglasi` ← **Karlo najčešće gleda OVU** |
| `post-listing-form.tsx` | `/objavi` |

Svaka ima vlastiti `hasField()` koji **MORA poštovati `scope`**. Verificiraj sve tri.

- Polje se ne briše — dobiva `scope: [...]` s podkategorijama koje ga ZADRŽAVAJU.
- Nove grupe MORAJU u `order` (`category-filters.ts`) **I** `BASIC_GROUPS`
  (`napredno-form.tsx`), inače nestanu iza "Više filtera".
- `src/lib/listing-fields.ts` = jedini izvor istine za PRIKAZ. Ne dodavati
  per-komponentnu logiku.
- Svaki filter koji ovisi o podatku mora imati i polje kojim prodavač taj podatak unosi.

**Poslije SVAKE izmjene sheme:**
```bash
npx tsx scripts/check-filters.mts        # duple ključeve, grupe po podkategoriji
npx tsx scripts/check-publish.mts        # pretraga ↔ objava
npx tsx scripts/check-detail.mts         # auto-polja ne cure na nevozila
npx esbuild scripts/check-enum-drift.mts --bundle --platform=node --format=esm \
  --outfile=/tmp/d.mjs && node /tmp/d.mjs # forma nudi ↔ baza prihvaća
npx esbuild scripts/check-publish-roundtrip.mts --bundle --platform=node --format=esm \
  --outfile=/tmp/r.mjs && node /tmp/r.mjs # podaci koraka 1–5 prežive zod
```

## 7. ZAMKE (svaka je već jednom koštala sata rada)
- **Zod TIHO briše ključeve kojih nema u shemi** → objava je gubila 15 atributa.
  Svako polje koje forma šalje mora biti u shemi.
- **Enum drift forma↔baza** ruši spremanje. Uske liste (`BODY_TYPES`) = PRIKAZ,
  široke (`ALL_BODY_TYPES`) = VALIDACIJA.
- **Regex nad `category-filters.ts` / `listings.ts` je opasan** (zapisi su višeredni;
  `subcategory` pattern progutao `truckType`). Koristi eksplicitnu listu ključeva,
  pa diff ključeva prije/poslije.
- **Ne brisati JSX po broju linije** — off-by-one je 2× razbio formu. Edit nad punim blokom.
- `/oglasi/napredno`: oprema je iza collapsanog **"Više filtera"** → text-scan bez
  klika daje 0x za SVE i izgleda kao da deploy nije prošao.
- **2. nivo podkategorija nije u HTML-u** (renderira se na klik) → `curl | grep` uvijek 0.
  Provjeri esbuild-bundleom, ne curlom.
- Playwright na `/objavi`: Marka/Model/Godina su **custom popover buttoni**, ne `<select>`.
  Grad je dropdown **ovisan o županiji**. `Escape` prije svakog sljedećeg dropdowna
  (dva popovera se preklapaju). Popunjavaj **po redoslijedu inputa**, ne po labeli.
- Prijava traži **pravi submit** (`press Enter`), `.click()` ne okida server action.
  Demo: `demo@auti.hr` / `demo1234`.
- **Supabase pooler visi** na uzastopnim tsx skriptama → radi preko dev servera HTTP-om
  (privremena `/api/...` ruta, pa obriši).
- `npx tsx` + Node 25 ne razrješava neke TS eksporte → `npx esbuild --bundle` pa `node`.
- `ERR_ABORTED` na `?_rsc=` **nije bug** (Next prefetch). Panika tek na 4xx/5xx.
- **0 POST zahtjeva ≠ akcija nije pozvana** — server actions nisu nužno vidljivi kao POST.
- Brisanje oglasa iz baze **ne miče ga s produkcije** (detaljna je SSG) → treba redeploy.
- `node_modules` zna nestati → `npm install` prije builda.

## 8. OTVORENO (ne dirati bez Dinove odluke)
- **UX**: 0 `loading.tsx`/`error.tsx`/`not-found.tsx` na 37 ruta · `moj-racun/postavke`
  ne sprema (nema ni action ni onClick) · "Uredi" mrtav gumb · nema toast sustava
  (`compare-button.tsx:54` blocking `alert()`) · `/objavi` bez drafta (reload gubi 5 koraka).
- **PERF**: `listListings()` (`supabase-adapter.ts:239-264`) povlači ~1224 reda BEZ LIMIT-a
  na svaki zahtjev; `/marke` 12×, `/oglasi/najnoviji` 9×. Nula cachea. `listThreads()` N+1.
- **SLIKE**: 108 podkategorija bez vjerne fotke → treba **Pexels API ključ** (samo Dino).
  5 izvora već propalo (loremflickr, Wikimedia, Unsplash, Pexels bez ključa, Envato).
- Dealer slugovi `lst-d0NN` ne postoje → klik na oglas trgovca = 404.
- `/zaboravljena-lozinka` je namjerni stub.
