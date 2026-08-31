/**
 * Per-category filter taxonomy. Mirrors avto.net's advanced-search schema
 * (Slovenian → Croatian translation) plus our additions.
 *
 * Drives:
 *  - <CategoryFilterSidebar /> dynamic rendering on /oglasi
 *  - /oglasi/napredno wizard
 *  - URL-state serialization (a.<key>=value for jsonb attrs)
 *  - applyFilters memory + listListings supabase
 *
 * Storage routing:
 *  - storage:"column" → typed listing column (priceEur, year, km, fuel,
 *    transmission, bodyType, drive, powerKw, engineCc, doors, seats, color,
 *    condition, accidentHistory, serviceHistory, importedFrom, county,
 *    sellerType, subcategory)
 *  - storage:"attr" → listings.attributes jsonb under field key
 *
 * Sources:
 *  - /tmp/avto-filters/fields.json (parsed advanced-search forms)
 *  - /tmp/avto-filters/<cat>.md/* (raw scraped markdown)
 *  - 39 auto fields, 26 moto, 34 gospodarska. Mehanizacija/prosti-cas/
 *    dijelovi taxonomies are our own (avto.net stubs those forms).
 */

import { CATEGORIES } from "./categories";

export type FilterFieldType =
  | "range"
  | "select"
  | "multi"
  | "text"
  | "toggle"
  /**
   * Mjesec (padajući 1-12) + godina (ručni unos), spremljeno kao JEDNA
   * vrijednost "YYYY-MM". Karlo 31.07 za "Prva registracija" i
   * "Tehnički vrijedi do" — dva prozorčića, jedan podatak.
   */
  | "monthyear";

export type FilterOption = { value: string; label: string; icon?: string };

/**
 * Karlo 31.07: podrubrika "Vrsta" je u SLOBODNOM VREMENU i DIJELOVIMA ponavljala
 * popis podkategorija (9 odnosno 12 istih stavki koje već stoje u gornjoj
 * "Podkategorija"), umjesto da nudi ono što je unutar odabrane podkategorije.
 *
 * Ovaj generator izvodi polje IZ SAME TAKSONOMIJE (`categories.ts`):
 *  - podkategorija IMA djecu  → "Vrsta" nudi tu djecu (npr. Auto dijelovi →
 *    Motor/Kočnice/Filteri…), i filtrira po `attributes.vrsta` — isti ključ koji
 *    objava sada popunjava i po kojem radi drill-down iz izbornika.
 *  - podkategorija NEMA djecu → polja nema (Mobilne kućice, Moduli za kamper,
 *    Šatorske prikolice, E-bicikli, E-skuteri…).
 *
 * Time ručni popis ne može više odlutati od taksonomije.
 */
function vrstaFromChildren(categorySlug: string): FilterField[] {
  const cat = CATEGORIES.find((c) => c.slug === categorySlug);
  if (!cat) return [];
  return cat.subcategories
    .filter((sub) => (sub.children?.length ?? 0) > 0)
    .map((sub) => ({
      key: "vrsta",
      label: "Vrsta",
      type: "multi" as const,
      storage: "attr" as const,
      group: "Vrsta",
      scope: [sub.slug],
      options: (sub.children ?? []).map((ch) => ({ value: ch.slug, label: ch.name, icon: ch.icon })),
    }));
}

export type FilterField = {
  key: string;
  label: string;
  type: FilterFieldType;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  // Fiksna ljestvica za "range" polja: umjesto dva slobodna brojčana polja
  // renderira se Od/Do izbornik s ovim vrijednostima (kao Cijena/Kilometraža).
  steps?: number[];
  options?: FilterOption[];
  // Tekst "prazne" opcije u izborniku. SelectField uvijek sam renderira taj red
  // (default "Sve"), pa ga NE treba dodavati i u `options` — bio bi duplikat.
  placeholder?: string;
  // `range` + `steps` + `maxOnly`: renderira SAMO gornju granicu ("do max"),
  // bez Od polja. Karlo 30.07 za NDM kamp prikolica — kupca zanima samo koliko
  // smije vući, donja granica nema smisla.
  maxOnly?: boolean;
  storage: "column" | "attr";
  group?: string; // section header in sidebar (e.g. "Oprema → Sigurnost")
  shared?: boolean;
  // Konzistentnost pretraga↔objava (sve opcionalno, additivno):
  publishRequired?: boolean;   // objava: polje je obavezno
  searchable?: boolean;        // pretraga: prikaži kao filter (default true ako neoznačeno)
  /**
   * Polje postoji SAMO u pretrazi, nikad u objavi oglasa.
   *
   * Karlo 30.07: "Prikaz oštećenih / u kvaru" je kupčev filter ("sakrij mi
   * oštećene"), a ne podatak koji prodavač upisuje — nitko ne bira hoće li se
   * njegov oglas prikazivati. Bez ove zastavice objava je tražila da prodavač
   * popuni Prikaži/Ne prikaži, što nema smisla.
   */
  searchOnly?: boolean;
  scope?: string[];            // podkategorije na koje se polje odnosi (prazno = sve)
};

export type CategoryFilters = {
  category: string;
  label: string;
  fields: FilterField[];
};

const v = (s: string) => ({ value: s, label: s });

/**
 * Karlo 29.07: "u svim kategorijama u svim izbornicima uvijek imamo izlistane
 * ovaj izbor" — jedna zajednička lista stanja, "Odlično" na prvom mjestu.
 * Prije su bile 4 različite liste po kategoriji.
 */
const DAMAGE_STATE_OPTIONS: FilterOption[] = [
  { value: "odlicno", label: "Odlično" },
  { value: "primjereno-godinama", label: "Za svoje godine primjereno" },
  { value: "bez-stete", label: "Bez štete" },
  { value: "osteceno", label: "Oštećeno" },
  { value: "lakse-popravljeno", label: "Lakša šteta popravljena" },
  { value: "veca-popravljena", label: "Veća šteta popravljena" },
];

/**
 * Karlo 30.07.2026: "Stanje karoserije" (6 stupnjeva štete) zamijenjeno je
 * UKLJUČI/ISKLJUČI logikom — kupca prvo zanima hoće li uopće vidjeti oštećena
 * vozila, a tek onda koliko su oštećena.
 *
 * ZADANO = prikaži sve (Dinova odluka): prazna vrijednost znači "ne filtriraj",
 * pa oštećeni oglasi NE nestaju dok korisnik to izričito ne odabere. Suprotno
 * (skriveni po defaultu) bi tiho gasilo vidljivost prodavačima oštećenih vozila.
 *
 * "prikazi" je namjerno prazan string: identično je "ne filtriraj", a korisniku
 * daje eksplicitan izbor u izborniku. Vidi filtriranje u lib/filter.ts.
 */
const SHOW_HIDE_OPTIONS: FilterOption[] = [
  { value: "", label: "Prikaži" },
  { value: "ne", label: "Ne prikaži" },
];

/**
 * PRODAVAČEVA strana istog podatka.
 *
 * Kupac filtrira "Prikaz oštećenih / u kvaru" (VEHICLE_STATE_FIELDS, searchOnly),
 * ali taj filter mora imati što čitati — `isDamaged()`/`isBroken()` u lib/filter.ts
 * gledaju `damageState` i `engineRuns`. Bez ovih polja u objavi prodavač nema
 * načina označiti oštećeno vozilo, pa bi filter uvijek vraćao sve.
 *
 * `searchable: false` → ne pojavljuju se kao filter (Karlo je izbacio stari
 * izbornik "Stanje karoserije"), ali se popunjavaju pri objavi.
 */
/**
 * Karlo 31.07: umjesto padajućih izbornika, "Stanje vozila" su KVAČICE.
 *
 * Dva para se međusobno isključuju (obrađuje `toggleSellerState` u objavi):
 *   vozno stanje  ⇄  nije u voznom stanju
 *   neoštećeno    ⇄  oštećeno
 * Uključivanje jednog GASI drugoga; oba nikad ne mogu biti upaljena.
 *
 * ⚠️ Vrijednosti se i dalje spremaju u `damageState` i `engineRuns` jer
 * `isDamaged()`/`isBroken()` u lib/filter.ts čitaju upravo te ključeve —
 * promjena ključa tiho bi razbila kupčev filter "sakrij oštećene".
 * Zato su kvačice `searchOnly: false` prikaz iste stvari, ne novi podatak.
 */
export const SELLER_STATE_DEFAULTS = {
  whole: true,      // prodaje se u cijelosti
  roadworthy: true, // u voznom stanju
  undamaged: true,  // neoštećeno
} as const;

const SELLER_STATE_FIELDS: FilterField[] = [
  { key: "soldWhole", label: "Vozilo se prodaje u cijelosti", type: "toggle", storage: "attr",
    group: "Stanje vozila", searchable: false },
  { key: "roadworthy", label: "U voznom stanju", type: "toggle", storage: "attr",
    group: "Stanje vozila", searchable: false },
  { key: "notRoadworthy", label: "Nije u voznom stanju", type: "toggle", storage: "attr",
    group: "Stanje vozila", searchable: false },
  { key: "undamaged", label: "Neoštećeno", type: "toggle", storage: "attr",
    group: "Stanje vozila", searchable: false },
  { key: "damaged", label: "Oštećeno", type: "toggle", storage: "attr",
    group: "Stanje vozila", searchable: false },
  { key: "broken", label: "U kvaru", type: "toggle", storage: "attr",
    group: "Stanje vozila", searchable: false },
  { key: "raceCar", label: "Trkaći auto", type: "toggle", storage: "attr",
    group: "Stanje vozila", searchable: false },
];

/**
 * DOKUMENTI — Karlo 31.07, korak 2 "Osnovno" u objavi oglasa.
 *
 * Broj šasije (VIN), prva registracija i tehnički vrijedi do. Sve troje je
 * `searchable: false`: Karlo je 30.07 izbacio "Prvu registraciju" i
 * "Registriran do" IZ PRETRAGE (datumska polja slobodnog unosa se nisu
 * koristila za filtriranje), ali prodavač ih i dalje treba upisati — kupcu
 * su to prve tri stvari koje pogleda na oglasu.
 *
 * Zato ne idu ni kroz `searchOnly` (to bi ih sakrilo iz objave) nego kroz
 * `searchable: false` = objava + prikaz oglasa, bez filtera.
 *
 * `scope` je namjerno UŽI od kategorije — traktoru/viličaru/šatorskoj prikolici
 * tehnički pregled nema smisla, e-biciklu ni VIN.
 */
function documentFields(scope?: string[]): FilterField[] {
  const base = scope && scope.length > 0 ? { scope } : {};
  return [
    { key: "vin", label: "Broj šasije (VIN)", type: "text", storage: "attr",
      group: "Dokumenti", searchable: false,
      placeholder: "17 znakova, npr. WVWZZZ1KZAW123456", ...base },
    { key: "firstRegistration", label: "Prva registracija", type: "monthyear", storage: "attr",
      group: "Dokumenti", searchable: false, ...base },
    { key: "roadworthyUntil", label: "Tehnički vrijedi do", type: "monthyear", storage: "attr",
      group: "Dokumenti", searchable: false, ...base },
  ];
}

/** Vozila bez tehničkog pregleda (mehanizacija): samo broj šasije/serijski broj. */
function vinOnlyField(scope?: string[], label = "Broj šasije (VIN)"): FilterField[] {
  return documentFields(scope).slice(0, 1).map((f) => ({ ...f, label }));
}

/** Vozila: dvije nove podrubrike umjesto starog "Stanje karoserije". */
const VEHICLE_STATE_FIELDS: FilterField[] = [
  { key: "hideDamaged", label: "Prikaz oštećenih", type: "select", storage: "attr", searchOnly: true,
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS },
  { key: "hideBroken", label: "Prikaz u kvaru", type: "select", storage: "attr", searchOnly: true,
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS },
];

// ── Common fields routed to typed columns ──────────────────────────────
const COMMON_PRICE: FilterField = {
  key: "priceEur", label: "Cijena (€)", type: "range", unit: "€",
  min: 0, max: 200000, step: 500, storage: "column", shared: true,
};
const COMMON_YEAR: FilterField = {
  key: "year", label: "Godina", type: "range",
  min: 1900, max: new Date().getFullYear(), step: 1, storage: "column", shared: true,
};
const COMMON_KM: FilterField = {
  key: "km", label: "Kilometri", type: "range", unit: "km",
  min: 0, max: 500000, step: 5000, storage: "column", shared: true,
};
/**
 * Karlo 29.07: TERETNE PRIKOLICE nemaju kilometražu (nisu samohodne).
 * COMMON_KM je dijeljen objekt pa gospodarska dobiva vlastitu kopiju sa scope-om.
 */
const GOSPODARSKA_KM: FilterField = {
  ...{ key: "km", label: "Kilometri", type: "range" as const, unit: "km",
       min: 0, max: 500000, step: 5000, storage: "column" as const, shared: true },
  scope: ["dostavna", "kamioni", "autobusi", "utv", "najam"],
};
const COMMON_COUNTY: FilterField = {
  key: "county", label: "Županija", type: "select", storage: "column", shared: true,
};
const COMMON_SELLER: FilterField = {
  key: "sellerType", label: "Tip prodavača", type: "multi", storage: "column", shared: true,
  options: [v("Privatni"), v("Trgovac")],
};
const COMMON_AGE: FilterField = {
  key: "condition", label: "Stanje", type: "multi", storage: "column", shared: true,
  options: [v("Novo"), v("Rabljeno"), v("Oldtimer")],
};
/**
 * "Broj vlasnika" (Dino 04.08.2026) — jedno polje za SVE kategorije s vlasnikom
 * (auto / moto / gospodarska / mehanizacija / slobodno vrijeme). Dijelovi ga
 * nemaju: guma nema "3. vlasnika".
 *
 * ⚠️ Zamjenjuje kvačicu "Prvi vlasnik" iz polja `ownership` — prodavač je mogao
 * označiti "Prvi vlasnik" i istovremeno upisati 2 vlasnika (proturječje vidljivo
 * na oglasu). Sad tu informaciju nosi SAMO ovo polje: 1 = prvi vlasnik.
 *
 * ⚠️ Vrijednost `5plus` je STRING, a ne broj — polje je `storage: "attr"` (jsonb),
 * pa ne postoji brojčani stupac koji bi puknuo. Prikaz prevodi u
 * "Više od 4 vlasnika" (`src/lib/listing-fields.ts`).
 */
const NUM_OWNERS_FIELD: FilterField = {
  key: "numOwners", label: "Broj vlasnika", type: "select", storage: "attr",
  group: "Povijest", shared: true,
  options: [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" },
    { value: "5plus", label: "Više od 4" },
  ],
};

// ── AUTO — full 39-field taxonomy from avto.net ────────────────────────
const AUTO_FIELDS: FilterField[] = [
  COMMON_PRICE, COMMON_YEAR, COMMON_KM, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  { key: "fuel", label: "Gorivo", type: "multi", storage: "column", group: "Motor",
    options: [
      v("Benzin"), v("Dizel"), v("Hibrid"),
      v("Električni"), v("Plin"),
    ] },
  { key: "transmission", label: "Mjenjač", type: "multi", storage: "column", group: "Motor",
    options: [v("Ručni"), v("Automatski")] },
  { key: "powerKw", label: "Snaga", type: "range", unit: "kW", min: 0, max: 600, step: 5, storage: "column", group: "Motor" },
  { key: "engineCc", label: "Obujam motora", type: "range", unit: "cm³", min: 0, max: 8000, step: 100, storage: "column", group: "Motor" },

  // Karlo 31.07: "Karoserija" → "Oblik karoserije" (rubrika se i dalje zove
  // Karoserija i sada stoji PRVA, iznad Osnovnog — vidi `order` u groupFields).
  { key: "bodyType", label: "Oblik karoserije", type: "multi", storage: "column", group: "Karoserija",
    options: [
      v("Microcar"), v("Limuzina"), v("Hatchback"), v("Karavan"),
      // Karlo 09.08. (st. 8): labeli prošireni — VRIJEDNOSTI ostaju "Coupe" /
      // "Cabrio" (tipizirani stupac u bazi, postojeći oglasi ih nose).
      v("Monovolumen"), v("SUV"), { value: "Coupe", label: "Coupe/Sportski" },
      { value: "Cabrio", label: "Cabrio/Roadster" }, v("Pickup"),
    ] },
  // Karlo 31.07: "Pogon" izbačen iz Karoserije — pogon je svojstvo motora,
  // ne oblika. ⚠️ `drive` je TIPIZIRANI STUPAC i ostaje u bazi (akcija ga i
  // dalje zahtijeva); miče se samo iz ovog izbornika.
  // Karlo 31.07: klizna vrata NISU broj vrata nego zasebna oznaka (auto može
  // imati 5 vrata OD KOJIH su neka klizna). Prije su bila u istoj listi, pa se
  // moralo birati ili broj ili "klizna".
  // Karlo st. 23 (05.08.2026): dodana 2 vrata (coupe/roadster) — lista je
  // kretala od 3. Zod (min(2)) i baza (integer) već primaju 2.
  { key: "doors", label: "Vrata", type: "multi", storage: "column", group: "Vrata i sjedala",
    options: [{ value: "2", label: "2 vrata" }, { value: "3", label: "3 vrata" }, { value: "4", label: "4 vrata" }, { value: "5", label: "5 vrata" }] },
  { key: "slidingDoors", label: "Klizna vrata", type: "toggle", storage: "attr", group: "Vrata i sjedala" },
  // Karlo t.17: dodan broj 3
  { key: "seats", label: "Sjedala", type: "multi", storage: "column", group: "Vrata i sjedala",
    options: [2,3,4,5,7,9].map((n) => ({ value: String(n), label: `${n}` })) },
  // Karlo 31.07: tapacirung + njegova boja (obje uz Vrata i sjedala).
  { key: "upholstery", label: "Tapacirung", type: "select", storage: "attr", group: "Vrata i sjedala",
    options: [
      { value: "tkanina", label: "Tkanina" },
      { value: "velur", label: "Velur" },
      { value: "alkantara", label: "Alkantara" },
      { value: "umjetna-koza", label: "Umjetna koža" },
      { value: "koza", label: "Koža" },
      { value: "nappa-koza", label: "Nappa koža" },
      { value: "designo-koza", label: "Designo koža" },
      { value: "djelomicna-koza", label: "Djelomična koža" },
    ] },
  { key: "upholsteryColor", label: "Boja tapacirunga", type: "select", storage: "attr", group: "Vrata i sjedala",
    options: [
      { value: "svijetlosiva", label: "Svijetlosiva" },
      { value: "tamnosiva", label: "Tamnosiva" },
      { value: "krem-bez", label: "Krem bež" },
      { value: "crna", label: "Crna" },
      { value: "plava", label: "Plava" },
      { value: "zelena", label: "Zelena" },
      { value: "crvena", label: "Crvena" },
      { value: "bordo-crvena", label: "Bordo crvena" },
      { value: "smeda", label: "Smeđa" },
      { value: "bijela", label: "Bijela" },
    ] },
  { key: "color", label: "Boja vozila", type: "multi", storage: "column", group: "Boja",
    options: ["Crna","Bijela","Siva","Srebrna","Plava","Crvena","Zelena","Smeđa","Žuta","Narančasta"].map(v) },
  // Karlo 31.07: tip boje (metalik/mat) postojao je SAMO hardkodiran u naprednoj
  // pretrazi, pa ga prodavač nije mogao upisati. Sad je pravo polje sheme →
  // vide ga sve tri komponente (pretraga, sidebar, objava).
  { key: "colorType", label: "Tip boje", type: "select", storage: "attr", group: "Boja",
    options: [{ value: "metalik", label: "Metalik" }, { value: "mat", label: "Mat" }] },

  // Emisijska norma + registracija (domenska analiza 2026-06-22)
  { key: "euroNorm", label: "Emisijska norma", type: "select", storage: "attr", group: "Motor",
    options: ["EURO 3","EURO 4","EURO 5","EURO 6","EURO 6d","EURO 7"].map(v) },
  // Karlo 31.07: CO2 i potrošnja idu POKRAJ emisijske norme (ista rubrika).
  // Mjerna jedinica stoji fiksno uz prozorčić — NumberField je renderira kao
  // sufiks, korisnik upisuje samo broj.
  { key: "co2", label: "Emisija CO2", type: "range", unit: "g/km", min: 0, max: 500, step: 5,
    storage: "attr", group: "Motor" },
  // ⚠️ `step: 0.01` (Dino 04.08.2026) — potrošnja je decimalna, DO DVIJE
  // decimale ("5,5" i "12,75" moraju proći). Objava iz stepa izvodi broj
  // decimala; `storage: "attr"` = jsonb, nema cjelobrojnog stupca u bazi koji
  // bi trebalo migrirati.
  { key: "fuelConsumption", label: "Kombinirana potrošnja", type: "range", unit: "l/100km",
    min: 0, max: 30, step: 0.01, storage: "attr", group: "Motor" },

  // Karlo 31.07: Garancija POKRAJ kilometraže — kvačica "ima garanciju".
  // Bez `group` → pada u "Osnovno", isto gdje je i COMMON_KM.
  { key: "warranty", label: "Garancija", type: "toggle", storage: "attr" },

  // EV — samo eko subkategorija (domenska analiza: evRange, batteryCapacity, chargerType, hybridType, heatPump)
  { key: "evRange", label: "Doseg (WLTP)", type: "range", unit: "km", min: 0, max: 1000, step: 10,
    storage: "attr", group: "Električna", scope: ["eko"] },
  { key: "batteryCapacity", label: "Kapacitet baterije", type: "range", unit: "kWh", min: 0, max: 150, step: 1,
    storage: "attr", group: "Električna", scope: ["eko"] },
  { key: "chargerType", label: "Tip punjača", type: "multi", storage: "attr", group: "Električna", scope: ["eko"],
    options: [
      { value: "type2", label: "Type 2 (AC)" },
      { value: "ccs", label: "CCS (DC)" },
      { value: "chademo", label: "CHAdeMO" },
    ] },
  { key: "hybridType", label: "Tip hibrida", type: "select", storage: "attr", group: "Električna", scope: ["eko"],
    options: [
      { value: "mhev", label: "Blagi hibrid (MHEV)" },
      { value: "hev", label: "Hibrid (HEV)" },
      { value: "phev", label: "Plug-in hibrid (PHEV)" },
    ] },
  { key: "heatPump", label: "Toplinska crpka", type: "toggle", storage: "attr", group: "Električna", scope: ["eko"] },

  /* ── DODATNE OPCIJE — Karlo 31.07, kompletna zamjena ────────────────────
   * Izbrisane podrubrike: Klima, Interijer, Parkiranje, Ostalo.
   * Sigurnost dobila novu listu; dodane: Podvozje i ovjes, Unutrašnjost,
   * Multimedija, Udobnost, Praktičnost.
   *
   * ⚠️ Slobodni unosi (broj jastuka, dimenzije felgi, autoradio…) NE MOGU biti
   * stavke multiselecta — stoje kao zasebna polja uz svoju listu, jer korisnik
   * mora upisati vrijednost, a ne samo označiti da nešto postoji.
   */
  { key: "airbagCount", label: "Broj zračnih jastuka", type: "range", unit: "kom",
    min: 0, max: 14, step: 1, storage: "attr", group: "Dodatne opcije" },
  { key: "safety", label: "Sigurnost", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "rdk", label: "Kontrola tlaka u gumama (RDK)" },
      { value: "ksenon", label: "Ksenonska svjetla" },
      { value: "bi-ksenon", label: "Bi-ksenonska svjetla" },
      { value: "auto-duga-svjetla", label: "Automatsko upravljanje dugim svjetlima" },
      { value: "led-prednja", label: "LED prednja svjetla" },
      { value: "led-dnevna", label: "Prednja (dnevna) LED svjetla" },
      { value: "led-straznja", label: "Stražnja LED svjetla" },
      { value: "maglenke", label: "Svjetla za maglu" },
      { value: "head-up", label: "Head-Up zaslon" },
      { value: "lane-assist", label: "Sustav za održavanje trake" },
      { value: "mrtvi-kut", label: "Sustav za upozorenje na mrtvi kut" },
      { value: "prometni-znakovi", label: "Sustav za prepoznavanje prometnih znakova" },
      { value: "senzor-kise", label: "Senzor za kišu" },
      { value: "adaptive-light", label: "Adaptive light / dinamički prilagodljiva svjetla" },
      { value: "treci-stop", label: "3. stop svjetlo" },
      { value: "pranje-svjetala", label: "Uređaj za pranje prednjih svjetala" },
      { value: "alarm", label: "Alarmni uređaj" },
      { value: "blokada-motora", label: "Blokada motora" },
      { value: "kodirano-paljenje", label: "Kodirano paljenje motora" },
      { value: "auto-kocenje", label: "Sustav za automatsko kočenje u nuždi" },
      { value: "upozorenje-traka", label: "Upozorenje na promjenu vozne trake" },
      { value: "rezervni-kotac", label: "Rezervni kotač punih dimenzija" },
      { value: "run-flat", label: "Run-Flat gume" },
      { value: "sigurnosni-razmak", label: "Upozorenje na sigurnosni razmak" },
    ] },

  { key: "chassis", label: "Podvozje i ovjes", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "alu-felge", label: "ALU felge" },
      { value: "abs", label: "Kočioni sustav (ABS)" },
      { value: "bas", label: "Pomoć pri kočenju (BAS / DBC / EBV)" },
      { value: "asd", label: "Automatska blokada diferencijala (ASD / EDS …)" },
      { value: "esp", label: "Elektronički program stabilnosti (ESP / DSC)" },
      { value: "edc", label: "Elektronička kontrola amortizera (EDC)" },
      { value: "ads", label: "Regulacija visine podvozja (ADS)" },
      { value: "4ws", label: "Upravljanje na sva četiri kotača (4WS / 4CONTROL)" },
      { value: "4x4", label: "Pogon na sva četiri kotača (4x4 / 4WD / Quattro…)" },
      { value: "asr", label: "Regulacija proklizavanja pogonskih kotača (ASR / DTC)" },
      { value: "ets", label: "Elektronički sustav za bolje prianjanje kotača ETS" },
      { value: "sportsko-podvozje", label: "Sportsko podvozje" },
      { value: "abc", label: "Aktivni ovjes (ABC – Active Body Control)" },
      { value: "zracni-ovjes", label: "Zračni ovjes" },
    ] },
  // Slobodan unos dimenzija kotača — i guma i felga (Dino 04.08.2026).
  // Prije "Dimenzije ALU felgi": naziv je isključivao gumu, a prodavači tu
  // ionako upisuju oboje ("225/45 R17, 5x112 ET45").
  // ⚠️ `key` ostaje `wheelSize` — postojeći oglasi u bazi zadržavaju vrijednost.
  { key: "wheelSize", label: "Dimenzije gume i felge", type: "text", storage: "attr",
    group: "Dodatne opcije", placeholder: 'npr. 225/45 R17, 5x112 ET45' },

  { key: "cabin", label: "Unutrašnjost", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "virtual-cockpit", label: "Virtualni Cockpit" },
      { value: "ambijentalno-svjetlo", label: "Ambijentalno osvjetljenje unutrašnjosti" },
      { value: "drveni-detalji", label: "Drveni detalji u unutrašnjosti" },
      { value: "aluminijski-detalji", label: "Aluminijski detalji u unutrašnjosti" },
      { value: "karbonski-detalji", label: "Karbonski detalji u unutrašnjosti" },
      { value: "kromirani-detalji", label: "Kromirani detalji u unutrašnjosti" },
      { value: "pusacki-paket", label: "Pušački paket" },
      { value: "sjedala-sportska", label: "Sjedala: sportska" },
      { value: "sjedala-komforna", label: "Sjedala: komforna" },
      { value: "sjedala-ortopedska", label: "Sjedala: ortopedska" },
      { value: "uticnica-12v", label: "12V utičnica" },
      { value: "sjedala-visina", label: "Sjedala: podešavanje po visini" },
      { value: "sjedala-el", label: "Sjedala: el. podešavanje" },
      { value: "sjedala-memory", label: "Sjedala: paket Memory" },
      { value: "sjedala-grijanje-sprijeda", label: "Sjedala: grijanje sprijeda" },
      { value: "sjedala-grijanje-straga", label: "Sjedala: grijanje straga" },
      { value: "sjedala-hladenje", label: "Sjedala: hlađenje / ventilacija" },
      { value: "sjedala-masaza", label: "Sjedala: funkcija masaže" },
      { value: "naslon-za-ruku", label: "Središnji naslon za ruku između sjedala" },
      { value: "rashladni-pretinac", label: "Rashladni pretinac" },
    ] },

  { key: "multimedia", label: "Multimedija", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "cd-izmjenjivac", label: "CD izmjenjivač / spremnik" },
      { value: "mp3", label: "MP3 player" },
      { value: "dvd", label: "DVD player" },
      { value: "tvrdi-disk", label: "Tvrdi disk za pohranu podataka" },
      { value: "usb", label: "USB priključak (iPod, HD, …)" },
      { value: "tv", label: "TV prijemnik / tuner" },
      { value: "bluetooth", label: "Bluetooth sučelje" },
      { value: "carplay", label: "Apple CarPlay" },
      { value: "dab", label: "Digitalni radio DAB" },
      { value: "priprema-mobitel", label: "Priprema za mobilni telefon" },
      { value: "autotelefon", label: "Autotelefon" },
      { value: "putno-racunalo", label: "Putno računalo" },
      { value: "komunikacijski-paket", label: "Komunikacijski paket" },
      { value: "navigacija", label: "Navigacija" },
      { value: "navigacija-tv", label: "Navigacija + TV" },
      { value: "zaslon-dodir", label: "Zaslon na dodir" },
      { value: "android-auto", label: "Android Auto" },
    ] },
  // Tri slobodna unosa uz Multimediju — prodavač upisuje ŠTO točno ima.
  { key: "radio", label: "Autoradio", type: "text", storage: "attr",
    group: "Dodatne opcije", placeholder: "npr. Pioneer MVH-S120UI" },
  { key: "radioCd", label: "Autoradio / CD", type: "text", storage: "attr",
    group: "Dodatne opcije", placeholder: "npr. tvornički s CD-om" },
  { key: "hifi", label: "Hi-Fi ozvučenje", type: "text", storage: "attr",
    group: "Dodatne opcije", placeholder: "npr. Bose 13 zvučnika" },

  { key: "comfort", label: "Udobnost", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "klima-rucna", label: "Klima uređaj – ručni" },
      { value: "klima-auto", label: "Automatski klima uređaj / digitalni" },
      { value: "klima-2-zone", label: "Klima uređaj – 2 zone" },
      { value: "klima-3-zone", label: "Klima uređaj – 3 zone" },
      { value: "klima-4-zone", label: "Klima uređaj – 4 zone" },
      { value: "webasto", label: "Grijanje vozila u mirovanju (Webasto)" },
      { value: "zatamnjena-stakla", label: "Zatamnjena stakla" },
      { value: "el-stakla-prednja", label: "Električno podizanje prednjih stakala" },
      { value: "el-stakla-sva", label: "Električno podizanje prednjih i stražnjih stakala" },
      { value: "el-ogledala", label: "El. podesiva vanjska ogledala" },
      { value: "grijana-ogledala", label: "Grijanje vanjskih ogledala" },
      { value: "preklopiva-ogledala", label: "El. preklopiva vanjska ogledala" },
      { value: "centralno", label: "Centralno zaključavanje" },
      { value: "centralno-daljinski", label: "Centralno zaključavanje s daljinskim upravljanjem" },
      { value: "soft-close", label: "Soft-Close sustav zatvaranja" },
      { value: "sjenilo-straznje", label: "Sjenilo za stražnje staklo" },
      { value: "keyless-go", label: "Keyless Go" },
      { value: "start-stop", label: "Start-Stop sustav" },
      { value: "elektricni-paket", label: "Električni paket" },
      { value: "upravljac-visina", label: "Upravljač podesiv po visini" },
      { value: "upravljac-dubina", label: "Upravljač podesiv po dubini" },
      { value: "servo-upravljac", label: "Servo upravljač" },
      { value: "upravljac-koza", label: "Upravljač presvučen kožom" },
      { value: "upravljac-multi", label: "Multifunkcionalni upravljač" },
      { value: "upravljac-sportski", label: "Sportski upravljač" },
      { value: "upravljac-grijani", label: "Grijani upravljač" },
      { value: "rucice-brzine", label: "Ručice za mijenjanje brzina na upravljaču (+ −)" },
      { value: "tempomat", label: "Tempomat" },
      { value: "acc", label: "Prilagodljivi tempomat (ACC)" },
      { value: "el-parkirna", label: "El. parkirna kočnica" },
      { value: "el-prtljaznik", label: "El. zatvaranje prtljažnika" },
      { value: "grijano-vjetrobran", label: "Grijano vjetrobransko staklo" },
    ] },

  { key: "practicality", label: "Praktičnost", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "klupa-1-2", label: "Djeljiva stražnja klupa 1/2 – 1/2" },
      { value: "klupa-1-3", label: "Djeljiva stražnja klupa 1/3 – 2/3" },
      { value: "klupa-3x", label: "Djeljiva stražnja klupa 1/3 – 1/3 – 1/3" },
      { value: "isofix", label: "Isofix sustav za pričvršćivanje sjedala" },
      { value: "djecja-sjedalica", label: "Integrirana dječja sjedalica" },
      { value: "torba-skije", label: "Torba za skije" },
      { value: "mrezasta-pregrada", label: "Mrežasta pregrada prtljažnog prostora" },
      { value: "rolo-pokrivalo", label: "Rolo pokrivalo prtljažnika" },
      // Karlo je diktirao "na slovenskom jeziku" (zaostatak s avto.net izvora);
      // na hrvatskoj stranici to nema smisla → hrvatski.
      { value: "upute-hr", label: "Upute za uporabu na hrvatskom jeziku" },
      { value: "dvostruko-dno", label: "Dvostruko dno prtljažnika" },
      { value: "krovni-nosaci", label: "Krovni nosači" },
      { value: "pomoc-uzbrdica", label: "Pomoć pri kretanju na uzbrdici" },
      { value: "aktivno-parkiranje", label: "Sustav za aktivnu pomoć pri parkiranju" },
      { value: "pdc", label: "Parkirni senzori PDC" },
      { value: "parkiranje-kamera", label: "Pomoć pri parkiranju: kamera" },
      { value: "parkiranje-prednji", label: "Pomoć pri parkiranju: prednji senzori" },
      { value: "parkiranje-straznji", label: "Pomoć pri parkiranju: stražnji senzori" },
      { value: "parkiranje-360", label: "Pomoć pri parkiranju: pogled 360 stupnjeva" },
      { value: "straznja-kamera", label: "Stražnja kamera" },
      { value: "bocni-pragovi", label: "Bočni pragovi" },
      { value: "kuka-vuca", label: "Kuka za vuču" },
      { value: "invalid", label: "Vozilo prilagođeno osobi s invaliditetom" },
    ] },

  // Ownership / history (attr.multi)
  { key: "ownership", label: "Vlasništvo", type: "multi", storage: "attr", group: "Povijest",
    options: [
      { value: "servisna", label: "Servisna knjižica" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
      { value: "garazirano", label: "Garažirano" },
      { value: "zamjena", label: "Moguća zamjena" },
      // Karlo 31.07
      { value: "nikad-karamboliran", label: "Nikad karambolirano" },
    ] },
  // Karlo 30.07: "Stanje karoserije" izbačeno iz Povijesti → nova rubrika
  // "Stanje vozila" (VEHICLE_STATE_FIELDS, dodana na dnu ovog niza).
  { key: "floodState", label: "Poplavljen", type: "select", storage: "attr", group: "Povijest",
    scope: ["ostecen-u-kvaru"],
    options: [
      { value: "ne", label: "Ne" },
      { value: "potencijalno", label: "Potencijalno" },
      { value: "da", label: "Da, sanirano" },
    ] },

  // Karlo 30.07: iz Povijesti izbačeni "Prva registracija", "Registriran do"
  // i "Uvezeno iz" — datumska polja slobodnog unosa nisu se koristila za pretragu.
  // Dino 04.08.: "Broj vlasnika" stoji IZNAD "Servisne evidencije" — redoslijed
  // polja u shemi diktira redoslijed prikaza unutar rubrike.
  NUM_OWNERS_FIELD,
  { key: "serviceHistory", label: "Servisna evidencija", type: "select", storage: "attr", group: "Povijest",
    options: [
      { value: "potpuna", label: "Potpuna servisna" },
      { value: "djelomicna", label: "Djelomična servisna" },
      { value: "nema", label: "Bez servisne" },
    ] },

  // Karlo 31.07: "Motor pali" (padajući, samo ostecen-u-kvaru) IZBAČEN — sada
  // isti podatak nosi kvačica "U voznom stanju" / "U kvaru" u rubrici
  // "Stanje vozila", i to za SVE podkategorije. Da je ostao, prodavač
  // oštećenog auta imao bi dva izbornika koja pišu u isti `engineRuns`.
  { key: "damageLocation", label: "Lokacija oštećenja", type: "multi", storage: "attr", group: "Povijest",
    scope: ["ostecen-u-kvaru"],
    options: [
      { value: "prednji", label: "Prednji dio" },
      { value: "straznji", label: "Stražnji dio" },
      { value: "bocni", label: "Bočni dio" },
      { value: "krov", label: "Krov" },
      { value: "mehanika", label: "Mehanika / motor" },
      { value: "elektronika", label: "Elektronika" },
    ] },

  // Oldtimer — samo oldtimer subkategorija (domenska analiza)
  { key: "restorationType", label: "Stupanj obnove", type: "select", storage: "attr", group: "Povijest",
    scope: ["oldtimer"],
    options: [
      { value: "originalno", label: "Originalno stanje" },
      { value: "restaurirano", label: "Restaurirano" },
      { value: "za-obnovu", label: "Za obnovu" },
    ] },
  { key: "originalPaint", label: "Originalni lak", type: "toggle", storage: "attr", group: "Povijest",
    scope: ["oldtimer"] },

  // Tip boje + Boja unutrašnjosti renderiraju se u hardkodiranoj formi (sekcija "Boje"),
  // pa ovdje ne dupliciramo. URL ključevi (a.colorType / a.upholsteryColor) ostaju isti.

  // Karlo t.32: grupa "Ostalo" — ostaje SAMO Starost oglasa.
  // Izbačeno: Garancija (sad gornji gumb), Program garancije, Na zalihi,
  // dupli Tip ponude, Oldtimer, Klizna vrata (sad u Broj vrata).
  { key: "adAge", label: "Starost oglasa", type: "select", storage: "attr", group: "Ostalo",
    options: [
      { value: "1d", label: "Posljednji dan" },
      { value: "3d", label: "Posljednja 3 dana" },
      { value: "7d", label: "Posljednji tjedan" },
      { value: "30d", label: "Posljednji mjesec" },
    ] },

  // Karlo 30.07: nova rubrika "Stanje vozila" umjesto "Stanje karoserije".
  ...VEHICLE_STATE_FIELDS,
  ...SELLER_STATE_FIELDS,

  // Karlo 31.07: VIN + prva registracija + tehnički (svi osobni auti).
  ...documentFields(),
];

// ── MOTO — full 26-field taxonomy from avto.net ────────────────────────
const MOTO_FIELDS: FilterField[] = [
  COMMON_PRICE, COMMON_YEAR, COMMON_KM, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  // Karlo 29.07: "Vrsta vozila" izbačena — duplicirala je gornji izbornik
  // Podkategorije (isti popis, isti URL param).
  // Karlo 27.07: Stil stoji ODMAH ispod podkategorije i mijenja se po njoj.
  // Motocikl: + Trokolica i Trike. Skuter i ATV imaju vlastite liste.
  { key: "motoCategory", label: "Stil", type: "multi", storage: "attr", group: "Vrsta",
    scope: ["motocikl", "moped", "minimoto", "oldtimer", "e-moto"],
    options: [
      v("Sport"), v("Chopper"), v("Tourer"),
      { value: "naked", label: "Naked bike" },
      v("Enduro"), v("Supermoto"), v("Trial"), v("Cross"),
      v("Trokolica"), v("Trike"),
    ] },
  { key: "motoCategory", label: "Stil", type: "multi", storage: "attr", group: "Vrsta",
    // ⚠️ Karlo 26.08.2026: E-romobil (e-skuter) više nema polje Stil.
    scope: ["skuter"],
    options: [
      v("Skuter"),
      { value: "maxi-skuter", label: "Maxi skuter" },
      { value: "3-4-kotacni-skuter", label: "3-4 kotačni skuter" },
    ] },
  { key: "motoCategory", label: "Stil", type: "multi", storage: "attr", group: "Vrsta",
    scope: ["atv-utv"],
    options: [
      v("ATV"), v("UTV"),
      { value: "golf-car", label: "Golf car" },
      v("Trikolica"), v("Trike"),
    ] },
  // ⚠️ Karlo 29.08.2026: "Tip e-bicikla" dodan u E-bicikl (Moto) — renderira se
  // ODMAH ispod Podkategorije, isti mehanizam kao Stil (grupa "Vrsta").
  // Identičan zapis kao prosti-cas/e-bicikli, da obje lokacije ostanu iste.
  { key: "eBikeType", label: "Tip e-bicikla", type: "select", storage: "attr", group: "Vrsta", scope: ["e-bicikl"],
    options: [
      { value: "city", label: "Gradski" },
      { value: "mtb", label: "MTB" },
      { value: "trekking", label: "Trekking" },
      { value: "cargo", label: "Cargo" },
      { value: "sklopivi", label: "Sklopivi" },
    ] },

  // Karlo 27.07: obujam do 1500 cm³, snaga do 112 kW (ljestvice u MOTO_ENGINE_STEPS /
  // MOTO_POWER_STEPS ispod — Od/Do izbornik koristi njih, ne linearni step).
  // ⚠️ Karlo 26.08.2026: E-romobil (`e-skuter`) i E-bicikl (`e-bicikl`) NEMAJU
  // rubrike Motor ni Dodatne opcije (E-romobil ni Stil). Polja su bila bez
  // `scope` (= svugdje u Motu), pa se obje izuzimaju nabrajanjem OSTALIH.
  { key: "engineCc", label: "Obujam motora", type: "range", unit: "cm³", min: 0, max: 1500, step: 50, storage: "column", group: "Motor",
    scope: ["motocikl", "skuter", "moped", "atv-utv", "minimoto", "oldtimer", "gokart", "motorne-sanke", "e-moto", "najam", "moto-ostalo"] },
  { key: "powerKw", label: "Snaga", type: "range", unit: "kW", min: 0, max: 112, step: 1, storage: "column", group: "Motor",
    scope: ["motocikl", "skuter", "moped", "atv-utv", "minimoto", "oldtimer", "gokart", "motorne-sanke", "e-moto", "najam", "moto-ostalo"] },
  { key: "fuel", label: "Pogon", type: "multi", storage: "column", group: "Motor",
    scope: ["motocikl", "skuter", "moped", "atv-utv", "minimoto", "oldtimer", "gokart", "motorne-sanke", "e-moto", "najam", "moto-ostalo"],
    options: [v("Benzin"), v("Električni")] },
  { key: "transmission", label: "Mjenjač", type: "multi", storage: "column", group: "Motor",
    scope: ["motocikl", "skuter", "moped", "atv-utv", "minimoto", "oldtimer", "gokart", "motorne-sanke", "e-moto", "najam", "moto-ostalo"],
    options: [v("Ručni"), v("Automatski")] },
  { key: "cylinders", label: "Cilindri", type: "select", storage: "attr", group: "Motor",
    scope: ["motocikl", "skuter", "moped", "atv-utv", "minimoto", "oldtimer", "gokart", "motorne-sanke", "e-moto", "najam", "moto-ostalo"],
    options: [1,2,3,4,5,6].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "stroke", label: "Takt", type: "select", storage: "attr", group: "Motor",
    scope: ["motocikl", "skuter", "moped", "atv-utv", "minimoto", "oldtimer", "gokart", "motorne-sanke", "e-moto", "najam", "moto-ostalo"],
    options: [
      { value: "2T", label: "2-taktni" },
      { value: "4T", label: "4-taktni" },
      { value: "ev", label: "Električni" },
    ] },
  { key: "drivetrain", label: "Prijenos", type: "select", storage: "attr", group: "Motor",
    scope: ["motocikl", "skuter", "moped", "atv-utv", "minimoto", "oldtimer", "gokart", "motorne-sanke", "e-moto", "najam", "moto-ostalo"],
    options: [
      { value: "lanac", label: "Lanac" },
      { value: "kardan", label: "Kardan" },
      { value: "remen", label: "Remen" },
      { value: "direktan", label: "Direktan" },
    ] },
  // Karlo 27.07: "Hlađenje" izbačeno iz grupe Motor.

  // EV moto — samo e-skuter/e-bicikl/e-moto (domenska analiza)
  { key: "motorPowerW", label: "Snaga motora", type: "range", unit: "W", min: 0, max: 20000, step: 100,
    storage: "attr", group: "Električna", scope: ["e-skuter", "e-bicikl", "e-moto"] },
  { key: "batteryCapacityWh", label: "Kapacitet baterije", type: "range", unit: "Wh", min: 0, max: 5000, step: 50,
    storage: "attr", group: "Električna", scope: ["e-skuter", "e-bicikl", "e-moto"] },
  { key: "rangeKm", label: "Doseg", type: "range", unit: "km", min: 0, max: 300, step: 5,
    storage: "attr", group: "Električna", scope: ["e-skuter", "e-bicikl", "e-moto"] },
  { key: "maxSpeedEv", label: "Maks. brzina", type: "range", unit: "km/h", min: 0, max: 150, step: 5,
    storage: "attr", group: "Električna", scope: ["e-skuter", "e-bicikl", "e-moto"] },
  { key: "foldable", label: "Sklopivo", type: "toggle", storage: "attr", group: "Električna",
    scope: ["e-skuter", "e-bicikl"] },

  // Karlo 27.07: cijela grupa "Specifikacije" izbačena iz MOTO
  // (težina, visina sjedala, kapacitet spremnika, ATV pogon/sjedala/vučna kuka,
  //  dužina i širina gusjenice). ATV koristi isti izbornik kao motocikl.
  // Karlo 27.07: grupa "Pravno" (vozačka kategorija) izbačena.

  { key: "color", label: "Boja", type: "multi", storage: "column", group: "Boja",
    options: ["Crna","Bijela","Crvena","Plava","Zelena","Žuta","Narančasta","Siva","Srebrna"].map(v) },
  // Karlo 29.07: "Tip boje" (metalik/mat) izbačen iz MOTO — stvarao je drugu
  // rubriku "BOJA" ispod već postojeće sekcije "BOJE".

  // Karlo 29.07 (2. runda): polje se zvalo "Dodatna oprema" unutar rubrike
  // "DODATNE OPCIJE" — ujednačeno s nazivom rubrike.
  { key: "motoOptions", label: "Dodatne opcije", type: "multi", storage: "attr", group: "Dodatne opcije",
    // ⚠️ Karlo 26.08.2026: rubrika Dodatne opcije maknuta iz E-romobila.
    scope: ["motocikl", "skuter", "moped", "atv-utv", "minimoto", "oldtimer", "gokart", "motorne-sanke", "e-moto", "najam", "moto-ostalo"],
    options: [
      { value: "abs", label: "ABS" },
      { value: "el-ovjes", label: "Električno podesiv ovjes" },
      { value: "tempomat", label: "Tempomat" },
      { value: "navigacija", label: "Navigacija" },
      { value: "led-svjetla", label: "LED svjetla" },
      { value: "grijane-rucke", label: "Grijane ručke" },
      { value: "vjetrobran", label: "Vjetrobran" },
      { value: "kofer", label: "Bočni kuferi" },
      { value: "quickshifter", label: "Quickshifter" },
      { value: "zamjena", label: "Moguća zamjena" },
    ] },

  // Karlo 30.07: "Stanje karoserije" → nova rubrika "Stanje vozila" (dno niza).
  // Karlo 29.07: polje se zvalo "Povijest" isto kao rubrika u kojoj stoji —
  // ujednačeno s ostalim kategorijama na "Vlasništvo".
  { key: "ownership", label: "Vlasništvo", type: "multi", storage: "attr", group: "Povijest",
    options: [
      { value: "servisna", label: "Servisna knjižica" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
      { value: "garazirano", label: "Garažirano" },
    ] },
  NUM_OWNERS_FIELD,
  // Karlo 30.07: "Registriran do" izbačen iz Povijesti.
  // Karlo 29.07 (2. runda): grupa "Ostalo" ukinuta u MOTO —
  // "Garancija" je bila duplikat gornjeg osnovnog panela (TogglePill), a
  // "Oldtimer" je premješten u rubriku "Dodatne opcije".
  // Karlo 27.07: iz grupe "Ostalo" izbačeni "Tip ponude" i "Na zalihi".
  // ⚠️ Karlo 26.08.2026 ("Fali tip ponude iznad stanje vozila" — 23:47 za
  // E-romobil, 00:04 za E-bicikl): VRAĆEN, ali SAMO za te dvije rubrike — u
  // ostatku Mota ostaje izbačen po uputi od 27.07. Renderira ga ručni
  // MultiSelect na vrhu napredne forme (iznad "Stanje vozila"); iz sheme se ne
  // crta (`dynamicFields` izuzima offerType), pa ovaj zapis služi kao uvjet
  // vidljivosti, kao i u prosti-cas rubrikama.
  { key: "offerType", label: "Tip ponude", type: "multi", storage: "attr", group: "Ostalo",
    scope: ["e-skuter", "e-bicikl"],
    options: [v("prodaja"), v("najam")] },
  { key: "oldtimer", label: "Oldtimer", type: "toggle", storage: "attr", group: "Dodatne opcije",
    scope: ["motocikl", "skuter", "moped", "atv-utv", "minimoto", "oldtimer", "gokart", "motorne-sanke", "e-moto", "najam", "moto-ostalo"] },

  // Karlo 30.07: nova rubrika "Stanje vozila" (motocikl/skuter/ATV — sve podkat.).
  ...VEHICLE_STATE_FIELDS,
  ...SELLER_STATE_FIELDS,

  // Karlo 31.07: dokumenti samo za vozila koja se REGISTRIRAJU. Minimoto,
  // go-kart, motorne sanke, e-bicikl i e-skuter nemaju ni VIN ni tehnički.
  ...documentFields(["motocikl", "skuter", "moped", "atv-utv", "oldtimer", "e-moto", "najam", "moto-ostalo"]),
];

// ── GOSPODARSKA — full 34-field taxonomy from avto.net ─────────────────
const GOSPODARSKA_FIELDS: FilterField[] = [
  COMMON_PRICE, COMMON_YEAR, GOSPODARSKA_KM, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  // Karlo 29.07: "Vrsta vozila" izbačena — duplicirala je gornji izbornik
  // Podkategorije (isti popis, isti URL param).

  // KAMIONI — tip nadgradnje (avto.net), stoji odmah ispod podkategorije.
  { key: "truckType", label: "Tip vozila", type: "multi", storage: "attr", group: "Vrsta",
    scope: ["kamioni"],
    options: [
      { value: "kiper", label: "Kiper" },
      { value: "sanduk", label: "Sanduk / otvoreni tovarni prostor" },
      { value: "sanduk-cerada", label: "Sanduk s ceradom" },
      { value: "furgon", label: "Furgon / zatvoreni sanduk" },
      { value: "hladnjaca", label: "Hladnjača" },
      { value: "izotermni", label: "Izotermni" },
      { value: "cisterna", label: "Cisterna" },
      { value: "silos", label: "Silos" },
      { value: "autodizalica", label: "Autodizalica" },
      { value: "s-dizalicom", label: "Kamion s dizalicom" },
      { value: "sasija-kabina", label: "Šasija s kabinom" },
      { value: "tegljac", label: "Tegljač / vučno vozilo" },
      { value: "autotransporter", label: "Autotransporter" },
      { value: "auto-mjesalica", label: "Auto-mješalica (mikser)" },
      { value: "betonska-pumpa", label: "Betonska pumpa" },
      { value: "smecar", label: "Smećar / komunalno" },
      { value: "cistilica", label: "Čistilica" },
      { value: "vatrogasni", label: "Vatrogasni" },
      { value: "sanitetski", label: "Sanitetski" },
      { value: "vojni", label: "Vojni" },
      { value: "podvozje-siroko", label: "Vozilo za prijevoz strojeva" },
      { value: "drvo", label: "Za prijevoz drva" },
      { value: "stoka", label: "Za prijevoz stoke" },
      { value: "kontejner", label: "Nosač kontejnera / rolo kiper" },
      { value: "sleper", label: "Šleper / vučna služba" },
      { value: "radna-platforma", label: "Radna platforma / košara" },
      { value: "ostalo", label: "Ostalo" },
    ] },

  // Karlo 29.07: TERETNE PRIKOLICE trebaju isto to na prvom mjestu —
  // tip prikolice po avto.net podjeli.
  { key: "trailerType", label: "Tip prikolice", type: "multi", storage: "attr", group: "Vrsta",
    scope: ["prikolice"],
    options: [
      { value: "poluprikolica-cerada", label: "Poluprikolica — cerada" },
      { value: "poluprikolica-sanduk", label: "Poluprikolica — sanduk" },
      { value: "poluprikolica-hladnjaca", label: "Poluprikolica — hladnjača" },
      { value: "poluprikolica-kiper", label: "Poluprikolica — kiper" },
      { value: "poluprikolica-cisterna", label: "Poluprikolica — cisterna" },
      { value: "poluprikolica-silos", label: "Poluprikolica — silos" },
      { value: "poluprikolica-platforma", label: "Poluprikolica — platforma" },
      { value: "poluprikolica-kontejner", label: "Poluprikolica — nosač kontejnera" },
      { value: "poluprikolica-autotransporter", label: "Poluprikolica — autotransporter" },
      { value: "poluprikolica-niskopodna", label: "Poluprikolica — niskopodna (labudica)" },
      { value: "prikolica-cerada", label: "Prikolica — cerada" },
      { value: "prikolica-sanduk", label: "Prikolica — sanduk" },
      { value: "prikolica-kiper", label: "Prikolica — kiper" },
      { value: "prikolica-hladnjaca", label: "Prikolica — hladnjača" },
      { value: "prikolica-platforma", label: "Prikolica — platforma" },
      { value: "prikolica-za-strojeve", label: "Prikolica za strojeve" },
      { value: "prikolica-za-stoku", label: "Prikolica za stoku" },
      { value: "prikolica-za-drvo", label: "Prikolica za drvo" },
      { value: "prikolica-auto", label: "Prikolica za vozila" },
      { value: "prikolica-brod", label: "Prikolica za plovila" },
      { value: "prikolica-lakoteretna", label: "Lakoteretna prikolica" },
      { value: "prikolica-poljoprivredna", label: "Poljoprivredna prikolica" },
      { value: "prikolica-cisterna", label: "Prikolica — cisterna" },
      { value: "ostalo", label: "Ostalo" },
    ] },

  // Karlo 27.07: "Oblik karoserije" izbačen iz Kamiona (tip vozila ga zamjenjuje).
  { key: "bodyType", label: "Karoserija", type: "multi", storage: "column", group: "Vrsta",
    scope: ["dostavna", "najam"],
    options: [
      v("Furgon"), v("Kombi"), { value: "kamionet", label: "Kamionet" },
      { value: "sasija-kabina", label: "Šasija s kabinom" },
      { value: "sasija-nadgradnja", label: "Šasija s nadgradnjom" },
      { value: "pickup", label: "Pick up" },
    ] },

  { key: "priceVat",
    scope: ["dostavna", "kamioni", "autobusi", "najam"], label: "PDV", type: "select", storage: "attr", group: "Cijena",
    options: [
      { value: "brutto", label: "S PDV-om" },
      { value: "netto", label: "Bez PDV-a" },
    ] },

  { key: "fuel",
    scope: ["dostavna", "kamioni", "autobusi", "najam"], label: "Gorivo", type: "multi", storage: "column", group: "Motor",
    options: ["Dizel","Benzin","Hibrid","Električni","Plin"].map(v) },
  { key: "transmission",
    scope: ["dostavna", "kamioni", "autobusi", "utv", "najam"], label: "Mjenjač", type: "multi", storage: "column", group: "Motor",
    options: [v("Ručni"), v("Automatski")] },
  { key: "powerKw",
    scope: ["dostavna", "kamioni", "najam"], label: "Snaga", type: "range", unit: "kW", min: 0, max: 600, step: 5, storage: "column", group: "Motor" },
  // Karlo 27.07: "Obujam" izbačen iz Kamiona.
  // Karlo 29.07 (2. runda): DOSTAVNA ga opet ima — Od/Do izbornik kao u
  // "Auto oglasi napredno" (ljestvica ENGINE_STEPS u napredno-form).
  { key: "engineCc", label: "Obujam motora", type: "range", unit: "cm³", min: 0, max: 16000, step: 100, storage: "column", group: "Motor",
    scope: ["dostavna", "najam"] },
  // Karlo 27.07: "Emisijska norma" izbačena iz Dostavne i Kamiona.
  { key: "euroNorm", label: "Emisijska norma", type: "select", storage: "attr", group: "Motor",
    scope: ["najam"],
    options: ["EURO 3","EURO 4","EURO 5","EURO 6","EURO 6d","EURO 7"].map(v) },

  // Karlo 29.07: KAROSERIJA izbačena iz kamiona i teretnih prikolica.
  { key: "seats", label: "Broj sjedala", type: "range", min: 1, max: 80, step: 1, storage: "column", group: "Karoserija",
    scope: ["dostavna", "najam"] },
  // Karlo 27.07: stražnja i bočna vrata — skraćene liste ("Sve" je prazna vrijednost dropdowna).
  { key: "rearDoors", label: "Stražnja vrata", type: "select", storage: "attr", group: "Karoserija",
    scope: ["dostavna", "najam"],
    options: [
      { value: "podizna", label: "Podizna vrata" },
      { value: "dvokrilna", label: "Dvokrilna vrata" },
    ] },
  { key: "sideDoors", label: "Bočna vrata", type: "select", storage: "attr", group: "Karoserija",
    scope: ["dostavna", "najam"],
    options: [
      { value: "klizna-jednostrana", label: "Klizna jednostrana" },
      { value: "obje", label: "Obje klizne" },
    ] },

  // Karlo 27.07: cijela grupa "Specifikacije" izbačena iz DOSTAVNE.
  // Ostale podkategorije (kamioni/autobusi/prikolice/UTV/najam) je zadržavaju —
  // zato scope, a ne brisanje polja.
  { key: "gvwKg", label: "Ukupna masa", type: "range", unit: "kg", min: 0, max: 60000, step: 100, storage: "attr", group: "Specifikacije",
    scope: ["najam"] },
  { key: "payloadKg", label: "Korisna nosivost", type: "range", unit: "kg", min: 0, max: 30000, step: 100, storage: "attr", group: "Specifikacije",
    scope: ["najam"] },
  { key: "axles", label: "Broj osovina", type: "select", storage: "attr", group: "Specifikacije",
    scope: ["najam"],
    options: [2,3,4,5,6].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "wheelbaseMm", label: "Međuosovinski razmak", type: "range", unit: "mm", min: 2000, max: 7500, step: 50, storage: "attr", group: "Specifikacije",
    scope: ["najam"] },
  // Karlo 29.07: cijela "MOTOR I KAROSERIJA" + Specifikacije van iz prikolica.
  { key: "cargoVolumeCbm", label: "Volumen tovarnog prostora", type: "range", unit: "m³", min: 0, max: 120, step: 1,
    storage: "attr", group: "Specifikacije", scope: ["kamioni"] },
  { key: "cargoLengthM", label: "Dužina tovarnog prostora", type: "range", unit: "m", min: 0, max: 18, step: 0.1,
    storage: "attr", group: "Specifikacije", scope: ["kamioni"] },
  // ── Karlo 29.07 (2. runda): TERETNE PRIKOLICE — vlastita rubrika ──────
  // Prikolice nemaju motor ni karoseriju; ključni su im osovine i mase.
  { key: "trailerAxles", label: "Broj osovina", type: "select", storage: "attr",
    group: "Osovine i nosivost", scope: ["prikolice"],
    // "Nebitno" je prazna opcija koju SelectField sam renderira — kad bi stajala
    // i u `options`, izbornik bi imao dva reda ("Sve" + "Nebitno") s istim učinkom.
    placeholder: "Nebitno",
    options: [
      { value: "1", label: "1 osovina" },
      { value: "2", label: "2 osovine" },
      { value: "3", label: "3 osovine" },
      { value: "3plus", label: "Više od 3 osovine" },
    ] },
  { key: "payloadKg", label: "Nosivost", type: "range", unit: "kg", storage: "attr",
    group: "Osovine i nosivost", scope: ["prikolice"],
    steps: [1000, 2800, 10000, 20000] },
  { key: "gvwKg", label: "Max. ukupna masa", type: "range", unit: "kg", storage: "attr",
    group: "Osovine i nosivost", scope: ["prikolice"],
    steps: [1000, 2800, 10000, 20000, 40000] },

  // Karlo 29.07: "Kočni sustav" izbačen iz teretnih prikolica.
  { key: "brakes", label: "Kočni sustav", type: "select", storage: "attr", group: "Specifikacije",
    scope: ["najam"],
    options: [
      { value: "abs", label: "ABS" },
      { value: "ebs", label: "EBS" },
      { value: "abs-ebs", label: "ABS + EBS" },
    ] },

  // Autobusi — kapacitet (domenska analiza)
  { key: "seatingCapacity", label: "Broj sjedećih mjesta", type: "range", min: 1, max: 80, step: 1,
    storage: "attr", group: "Specifikacije", scope: ["autobusi"] },
  // Equipment groups (same as AUTO trimmed)
  { key: "climate", label: "Klima", type: "multi", storage: "attr", group: "Dodatne opcije",
    scope: ["dostavna", "najam"],
    options: [
      { value: "klima", label: "Klima uređaj" },
      { value: "autoklima", label: "Automatska klima" },
      { value: "grijanje-mirovanje", label: "Grijanje u mirovanju" },
    ] },
  { key: "interior", label: "Interijer", type: "multi", storage: "attr", group: "Dodatne opcije",
    scope: ["dostavna", "najam"],
    options: [
      { value: "grijanje-sjedala", label: "Grijanje sjedala" },
      { value: "kozna-sjedala", label: "Kožna sjedala" },
      { value: "el-stakla", label: "El. podizači stakala" },
      { value: "centralno-zakljucavanje", label: "Centralno zaključavanje" },
      { value: "servo-volan", label: "Servo volan" },
      { value: "multifunkcijski-volan", label: "Multifunkcijski volan" },
      { value: "keyless", label: "Keyless go" },
      { value: "navigacija", label: "Navigacija" },
      { value: "bluetooth", label: "Bluetooth" },
      { value: "carplay", label: "Apple CarPlay" },
      { value: "androidauto", label: "Android Auto" },
    ] },
  { key: "safety", label: "Sigurnost", type: "multi", storage: "attr", group: "Dodatne opcije",
    scope: ["dostavna", "najam"],
    options: [
      { value: "abs", label: "ABS" },
      { value: "esp", label: "ESP" },
      { value: "airbag", label: "Zračni jastuci" },
      { value: "tempomat", label: "Tempomat" },
      { value: "led", label: "LED svjetla" },
      { value: "auto-cocenje", label: "Automatsko kočenje" },
    ] },
  { key: "parking", label: "Parkiranje", type: "multi", storage: "attr", group: "Dodatne opcije",
    scope: ["dostavna", "najam"],
    options: [
      { value: "kamera", label: "Kamera unatrag" },
      { value: "senzori", label: "Senzori parkiranja" },
    ] },
  { key: "otherEquipment", label: "Ostalo", type: "multi", storage: "attr", group: "Dodatne opcije",
    scope: ["dostavna", "najam"],
    options: [
      { value: "alu-felge", label: "Alu felge" },
      { value: "4x4", label: "Pogon 4x4" },
      { value: "vucna", label: "Vučna kuka" },
      { value: "produljeni-meduosovinski", label: "Produljen međuosovinski razmak" },
      { value: "povisen-krov", label: "Povišen krov kabine" },
      { value: "retarder", label: "Retarder" },
      { value: "tahograf", label: "Tahograf" },
      { value: "dizalica", label: "Dizalica / kran" },
      { value: "utovarna-rampa", label: "Utovarna rampa" },
      { value: "adr", label: "ADR (opasne tvari)" },
    ] },
  // Autobusi — udobnost (domenska analiza)
  // Karlo 27.07: u DOSTAVNOJ od "Povijesti" ostaje samo Stanje, i to s istom
  // listom kao AUTO ("Stanje karoserije"). Ostale podkat. zadržavaju punu grupu.
  { key: "ownership", label: "Vlasništvo", type: "multi", storage: "attr", group: "Povijest",
    scope: ["utv", "najam"],
    options: [
      { value: "servisna", label: "Servisna knjižica" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
      { value: "garazirano", label: "Garažirano" },
    ] },
  // ⚠️ Isti scope kao `ownership` gore — bez njega bi "Broj vlasnika" iskočio
  // i na podkategorijama koje rubriku Vlasništvo uopće nemaju.
  { ...NUM_OWNERS_FIELD, shared: false, scope: ["autobusi", "utv", "najam"] },
  // Karlo 30.07: "Stanje" (6 stupnjeva štete) zamijenjeno rubrikom "Stanje vozila"
  // s Prikaži/Ne prikaži logikom — vrijedi za dostavnu, kamione, autobuse, utv, najam.
  { key: "hideDamaged", label: "Prikaz oštećenih", type: "select", storage: "attr", searchOnly: true,
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS,
    scope: ["dostavna", "kamioni", "autobusi", "utv", "najam"] },
  { key: "hideBroken", label: "Prikaz u kvaru", type: "select", storage: "attr", searchOnly: true,
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS,
    scope: ["dostavna", "kamioni", "autobusi", "utv", "najam"] },
  // TERETNE PRIKOLICE dobivaju SAMO "Prikaz oštećenih" — prikolica nema motor,
  // pa "u kvaru" nema smisla (Dinova potvrda 30.07, nije previd u Karlovom popisu).
  { key: "hideDamaged", label: "Prikaz oštećenih", type: "select", storage: "attr", searchOnly: true,
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS,
    scope: ["prikolice"] },
  // Prodavačeva strana (gospodarska): bez ovoga filter "Prikaz oštećenih" nema što čitati.
  { key: "damageState", label: "Oštećenja na vozilu", type: "select", storage: "attr",
    // ⚠️ Karlo 16.08.2026: scope dodan da UTV bude 1:1 s Moto/ATV — ATV ovo polje nema.
    scope: ["dostavna", "kamioni", "autobusi", "prikolice", "najam", "gospodarska-ostalo"],
    group: "Stanje vozila", searchable: false, placeholder: "Bez oštećenja",
    options: [
      { value: "osteceno", label: "Vozilo je oštećeno" },
      { value: "lakse-popravljeno", label: "Lakša šteta, popravljeno" },
      { value: "veca-popravljena", label: "Veća šteta, popravljena" },
    ] },
  { key: "engineRuns", label: "Vozilo je u voznom stanju", type: "select", storage: "attr",
    group: "Stanje vozila", searchable: false, placeholder: "Da, pali i vozi",
    scope: ["dostavna", "kamioni", "autobusi", "najam"],
    options: [
      { value: "pali-ne-vozi", label: "Pali, ali ne vozi" },
      { value: "ne-pali", label: "Ne pali (u kvaru)" },
    ] },
  { key: "registrationUntil", label: "Registriran do", type: "text", storage: "attr", group: "Povijest",
    scope: ["najam"] },
  { key: "importedFrom", label: "Uvezeno iz", type: "text", storage: "attr", group: "Povijest",
    scope: ["najam"] },

  { key: "color",
    scope: ["dostavna", "kamioni", "najam"], label: "Boja", type: "multi", storage: "column", group: "Boja",
    options: ["Bijela","Plava","Crvena","Crna","Siva","Žuta","Zelena","Narančasta"].map(v) },

  // Karlo 27.07: grupa "Ostalo" izbačena iz GOSPODARSKE — "Tip ponude" i
  // "Garancija" već stoje u gornjem osnovnom panelu, ovdje su bili duplikat.

  // Karlo 31.07: dokumenti. Teretna prikolica NEMA VIN u istom smislu, ali IMA
  // broj šasije i tehnički — pa dobiva sve troje kao i ostala vozila.
  // ⚠️ Karlo 16.08.2026 (st.4): UTV = isto vozilo kao Moto/ATV, samo na dva
  // mjesta. Zapisi su KOPIJE iz MOTO_FIELDS (isti ključevi i opcije), scope ["utv"].
  // ⚠️ powerKw/engineCc/color NAMJERNO zadržavaju "utv" — ATV ih ima.
  { key: "motoCategory", label: "Stil", type: "multi", storage: "attr", group: "Vrsta",
    scope: ["utv"],
    options: [
      v("ATV"), v("UTV"),
      { value: "golf-car", label: "Golf car" },
      v("Trikolica"), v("Trike"),
    ] },
  { scope: ["utv"], key: "cylinders", label: "Cilindri", type: "select", storage: "attr", group: "Motor",
    options: [1,2,3,4,5,6].map((n) => ({ value: String(n), label: `${n}` })) },
  { scope: ["utv"], key: "stroke", label: "Takt", type: "select", storage: "attr", group: "Motor",
    options: [
      { value: "2T", label: "2-taktni" },
      { value: "4T", label: "4-taktni" },
      { value: "ev", label: "Električni" },
    ] },
  { scope: ["utv"], key: "drivetrain", label: "Prijenos", type: "select", storage: "attr", group: "Motor",
    options: [
      { value: "lanac", label: "Lanac" },
      { value: "kardan", label: "Kardan" },
      { value: "remen", label: "Remen" },
      { value: "direktan", label: "Direktan" },
    ] },
  { scope: ["utv"], key: "motoOptions", label: "Dodatne opcije", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "abs", label: "ABS" },
      { value: "el-ovjes", label: "Električno podesiv ovjes" },
      { value: "tempomat", label: "Tempomat" },
      { value: "navigacija", label: "Navigacija" },
      { value: "led-svjetla", label: "LED svjetla" },
      { value: "grijane-rucke", label: "Grijane ručke" },
      { value: "vjetrobran", label: "Vjetrobran" },
      { value: "kofer", label: "Bočni kuferi" },
      { value: "quickshifter", label: "Quickshifter" },
      { value: "zamjena", label: "Moguća zamjena" },
    ] },
  { scope: ["utv"], key: "oldtimer", label: "Oldtimer", type: "toggle", storage: "attr", group: "Dodatne opcije" },
  ...SELLER_STATE_FIELDS.map((f) => ({ ...f, scope: ["utv"] })),

  // ⚠️ Karlo 17.08.2026: UTV mora biti IDENTICAN ATV-u — ne samo ista polja,
  // nego iste OZNAKE, OPCIJE i RASPONI. Gospodarske verzije su kamionske
  // (Gorivo s Dizel/Plin, obujam do 16.000 cm³, snaga do 600 kW, 8 boja),
  // a ATV ima "Pogon" (Benzin/Elektricni), 1.500 cm³, 112 kW, 9 boja.
  // Zato UTV dobiva KOPIJE iz MOTO_FIELDS.
  { scope: ["utv"], key: "fuel", label: "Pogon", type: "multi", storage: "column", group: "Motor",
    options: [v("Benzin"), v("Električni")] },
  { scope: ["utv"], key: "engineCc", label: "Obujam motora", type: "range", unit: "cm³", min: 0, max: 1500, step: 50, storage: "column", group: "Motor" },
  { scope: ["utv"], key: "powerKw", label: "Snaga", type: "range", unit: "kW", min: 0, max: 112, step: 1, storage: "column", group: "Motor" },
  { scope: ["utv"], key: "color", label: "Boja", type: "multi", storage: "column", group: "Boja",
    options: ["Crna","Bijela","Crvena","Plava","Zelena","Žuta","Narančasta","Siva","Srebrna"].map(v) },

  ...documentFields(),
];

// ── MEHANIZACIJA (machinery) — auto.net stub, our taxonomy ─────────────
const MEHANIZACIJA_FIELDS: FilterField[] = [
  COMMON_PRICE, COMMON_YEAR, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  // Karlo 30.07: podrubrika "Vrsta" (duplirala je gornju Podkategoriju) IZBAČENA.
  // Ostaje samo "Tip", s listom tipova po podkategoriji.
  // Polja dijele isti `key` jer imaju DISJUNKTNE scope-ove (ista tehnika kao
  // moto "Stil"): korisnik u svakoj podkategoriji vidi samo svoje tipove.
  //
  // ⚠️ Karlo je tražio "kao na avto.net". avto.net blokira dohvat (HTTP 403; i
  // Camoufox zapne na search_category.asp), pa liste NISU doslovno prepisane s
  // njihove stranice nego složene po istoj logici i prilagođene HR tržištu
  // (npr. "vinogradarski/voćarski stroj" je ovdje relevantniji nego u SLO).
  // Ako Karlo želi 1:1 avto.net popis, treba mi njihov screenshot dropdowna.
  { key: "machineType", label: "Tip", type: "multi", storage: "attr", group: "Vrsta",
    scope: ["poljoprivredni-strojevi"],
    options: [
      v("Traktor"),
      { value: "traktor-gusjenicar", label: "Traktor gusjeničar" },
      v("Kombajn"),
      { value: "silokombajn", label: "Silokombajn" },
      { value: "kosilica", label: "Kosilica" },
      { value: "balirka", label: "Balirka" },
      { value: "plug", label: "Plug" },
      { value: "sijacica", label: "Sijačica" },
      { value: "prskalica", label: "Prskalica" },
      { value: "rasipac", label: "Rasipač gnojiva" },
      { value: "freza", label: "Freza / tanjurača" },
      { value: "prikolica", label: "Prikolica" },
      { value: "cisterna", label: "Cisterna" },
      { value: "utovarivac-celni", label: "Čelni utovarivač" },
      { value: "vinogradarski", label: "Vinogradarski / voćarski stroj" },
      { value: "ostalo", label: "Ostalo" },
    ] },
  { key: "machineType", label: "Tip", type: "multi", storage: "attr", group: "Vrsta",
    scope: ["vilicari"],
    options: [
      { value: "celni-dizel", label: "Čelni viličar — dizel" },
      { value: "celni-plin", label: "Čelni viličar — plin / TNG" },
      { value: "celni-elektro", label: "Čelni viličar — električni" },
      { value: "ceoni-terenski", label: "Terenski viličar" },
      { value: "regalni", label: "Regalni viličar" },
      { value: "retrak", label: "Retrak" },
      { value: "paletar", label: "Paletar" },
      { value: "teleskopski", label: "Teleskopski manipulator" },
      { value: "bocni", label: "Bočni viličar" },
      { value: "vucni", label: "Vučni viličar" },
      { value: "radna-platforma", label: "Radna platforma" },
      { value: "ostalo", label: "Ostalo" },
    ] },
  { key: "machineType", label: "Tip", type: "multi", storage: "attr", group: "Vrsta",
    scope: ["gradevinski-strojevi"],
    options: [
      { value: "bager-gusjenicar", label: "Bager gusjeničar" },
      { value: "bager-kotaci", label: "Bager na kotačima" },
      { value: "mini-bager", label: "Mini bager" },
      { value: "rovokopac", label: "Rovokopač" },
      { value: "utovarivac", label: "Utovarivač" },
      { value: "mini-utovarivac", label: "Mini utovarivač" },
      { value: "buldozer", label: "Buldožer" },
      { value: "greder", label: "Greder" },
      { value: "valjak", label: "Valjak" },
      { value: "dizalica", label: "Dizalica" },
      { value: "dumper", label: "Dumper" },
      { value: "kompresor", label: "Kompresor" },
      { value: "agregat", label: "Agregat" },
      { value: "drobilica", label: "Drobilica / sito" },
      { value: "asfalter", label: "Stroj za asfalt" },
      { value: "ostalo", label: "Ostalo" },
    ] },
  // Ostale podkategorije (šumarski, komunalni, najam) zadržavaju opću listu.
  { key: "machineType", label: "Tip", type: "multi", storage: "attr", group: "Vrsta",
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"],
    options: [
      v("Traktor"), v("Kombajn"), v("Bager"), v("Utovarivač"),
      { value: "rovokopac", label: "Rovokopač" },
      { value: "valjak", label: "Valjak" },
      { value: "dizalica", label: "Dizalica" },
      { value: "cistilica", label: "Čistilica" },
      { value: "prikljucni", label: "Priključni stroj" },
    ] },

  // Karlo 30.07: rubrike MOTOR i SPECIFIKACIJE IZBAČENE iz poljoprivrednih,
  // viličara i građevinskih strojeva. Polja niže zadržavaju scope na preostale
  // podkategorije (šumarski / komunalni / najam) gdje su i dalje korisna.
  { key: "fuel", label: "Pogon", type: "multi", storage: "column", group: "Motor",
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"],
    options: ["Dizel","Električni","Hibrid","Plin"].map(v) },
  { key: "transmission", label: "Mjenjač", type: "multi", storage: "column", group: "Motor",
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"],
    options: [v("Ručni"), v("Automatski"), { value: "hidrostatski", label: "Hidrostatski" }] },
  { key: "powerKw", label: "Snaga", type: "range", unit: "kW", min: 0, max: 600, step: 5, storage: "column", group: "Motor",
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "powerHp", label: "Snaga", type: "range", unit: "KS", min: 0, max: 800, step: 5, storage: "attr", group: "Motor",
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },

  { key: "operatingHours", label: "Radni sati", type: "range", unit: "h", min: 0, max: 30000, step: 100, storage: "attr", group: "Specifikacije", publishRequired: true,
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "weightKg", label: "Težina", type: "range", unit: "kg", min: 0, max: 50000, step: 100, storage: "attr", group: "Specifikacije",
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },

  // ── VILIČARI: nova rubrika "Nosivost, visina dizanja" (Karlo 30.07) ──────
  // Od/Do izbornik s fiksnom ljestvicom (`steps`), isti pattern kao Cijena.
  { key: "liftCapacityKg", label: "Nosivost u kg", type: "range", unit: "kg", storage: "attr",
    group: "Nosivost, visina dizanja", scope: ["vilicari"],
    steps: [500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 10000, 20000] },
  { key: "liftHeightMm", label: "Visina dizanja u mm", type: "range", unit: "mm", storage: "attr",
    group: "Nosivost, visina dizanja", scope: ["vilicari"],
    steps: [1000, 2000, 3000, 5000] },

  // Nosivost za građevinske strojeve ostaje u Specifikacijama samo tamo gdje
  // rubrika još postoji (Karlo je Specifikacije izbacio iz gradevinski-strojevi).
  { key: "bucketCapacity", label: "Kapacitet žlice", type: "range", unit: "m³", min: 0, max: 5, step: 0.1, storage: "attr", group: "Specifikacije", scope: ["sumarski-strojevi"] },

  // Dodatne opcije — Karlo nije tražio promjenu, ali polja koja su bila vezana
  // uz izbačene rubrike dobivaju scope da ne vise prazna.
  { key: "drive4x4", label: "Pogon 4x4 / 4WD", type: "toggle", storage: "attr", group: "Dodatne opcije" , scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "pto", label: "Priključno vratilo (PTO)", type: "toggle", storage: "attr", group: "Dodatne opcije", scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "threePointHitch", label: "Trozglobna poveznica", type: "toggle", storage: "attr", group: "Dodatne opcije", scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "frontLoader", label: "Prednji utovarivač", type: "toggle", storage: "attr", group: "Dodatne opcije", scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "cabin", label: "Klimatizirana kabina", type: "toggle", storage: "attr", group: "Dodatne opcije" , scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "rops", label: "ROPS (zaštita od prevrtanja)", type: "toggle", storage: "attr", group: "Dodatne opcije" , scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "fops", label: "FOPS (zaštita od pada predmeta)", type: "toggle", storage: "attr", group: "Dodatne opcije" , scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "gps", label: "GPS / Telematika", type: "toggle", storage: "attr", group: "Dodatne opcije" , scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "ac", label: "Klima uređaj", type: "toggle", storage: "attr", group: "Dodatne opcije" , scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "quickCoupler", label: "Brza spojka", type: "toggle", storage: "attr", group: "Dodatne opcije" , scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  // ── Karlo 30.07: nova rubrika "Stanje mehanizacije" ─────────────────────
  // Traži se za poljoprivredne i građevinske strojeve; dajemo je i preostalim
  // podkategorijama radi dosljednosti (ista logika Prikaži / Ne prikaži).
  { key: "hideDamaged", label: "Mehanizacija oštećena", type: "select", storage: "attr", searchOnly: true,
    group: "Stanje mehanizacije", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS },
  { key: "hideBroken", label: "Mehanizacija u kvaru", type: "select", storage: "attr", searchOnly: true,
    group: "Stanje mehanizacije", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS },

  // Povijest — Karlo 30.07: "Stanje" (6 stupnjeva) izbačeno, gore je zamjena.
  { key: "ownership", label: "Vlasništvo", type: "multi", storage: "attr", group: "Povijest",
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"],
    options: [
      { value: "servisna", label: "Servisna knjižica" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
    ] },
  { ...NUM_OWNERS_FIELD, shared: false, scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "registeredForRoad", label: "Registriran za cestu", type: "toggle", storage: "attr", group: "Povijest",
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },

  // Najam — samo najam subkategorija (domenska analiza)
  { key: "dailyRate", label: "Dnevna cijena najma", type: "range", unit: "€", min: 0, max: 5000, step: 10, storage: "attr", group: "Ostalo", scope: ["najam"] },
  { key: "minRentalDays", label: "Min. dana najma", type: "select", storage: "attr", group: "Ostalo", scope: ["najam"],
    options: [1,3,7,14,30].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "operator", label: "S operaterom", type: "toggle", storage: "attr", group: "Ostalo", scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "delivery", label: "Dostava na lokaciju", type: "toggle", storage: "attr", group: "Ostalo", scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },

  { key: "offerType", label: "Tip ponude", type: "multi", storage: "attr", group: "Ostalo",
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"],
    options: [v("prodaja"), v("najam")] },
  { key: "warranty", label: "Garancija", type: "toggle", storage: "attr", group: "Ostalo" , scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },
  { key: "serviceHistory", label: "Servisna evidencija", type: "toggle", storage: "attr", group: "Ostalo" , scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },

  // Karlo 31.07: mehanizacija ima serijski broj, ali NEMA tehnički pregled
  // (bager i viličar se ne registriraju za cestu), pa samo taj jedan podatak.
  ...vinOnlyField(undefined, "Broj šasije / serijski broj"),
];

// ── PROSTI-CAS (leisure: campers, caravans, boats) — our taxonomy ──────
// ⚠️ Karlo 29.08.2026 (st.20): Cijena maknuta iz Ponuda za najam — override
// COMMON_PRICE (koja nema scope = svugdje) s vlastitim zapisom koji izuzima
// "najam", isti obrazac kao GOSPODARSKA_KM za COMMON_KM.
const PROSTI_CAS_PRICE: FilterField = {
  ...COMMON_PRICE, shared: false,
  scope: ["kamperi", "kamp-prikolice", "mobilne-kucice", "moduli-za-kamper", "satorske-prikolice",
    "krovni-satori", "plovila", "e-bicikli", "e-skuteri", "kamping-oprema", "prosti-cas-ostalo"],
};
// ⚠️ Karlo 31.08.2026 (st.30): Oprema za kampere i kamping — identična
// pretraga kao Auto dijelovi, pa nema Godinu (COMMON_YEAR bi je nudio
// svugdje u prosti-cas bez ovog override-a).
const PROSTI_CAS_YEAR: FilterField = {
  ...COMMON_YEAR, shared: false,
  scope: ["kamperi", "kamp-prikolice", "mobilne-kucice", "moduli-za-kamper", "satorske-prikolice",
    "krovni-satori", "plovila", "e-bicikli", "e-skuteri", "najam", "prosti-cas-ostalo"],
};
const PROSTI_CAS_FIELDS: FilterField[] = [
  PROSTI_CAS_PRICE, PROSTI_CAS_YEAR, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  // ⚠️ Karlo 31.08.2026 (st.30): Oprema za kampere i kamping — identična
  // pretraga kao Dijelovi i oprema/Auto dijelovi (Za marku s punim auto
  // popisom, Stanje predmeta, OEM, Proizvođač dijela; bez Godine, Udobnosti,
  // Tipa ponude, Vlasništva, Broja vlasnika, Dimenzija). SAMO Vrsta ostaje
  // njena postojeća lista (vrstaFromChildren("prosti-cas")).
  { key: "oem", label: "OEM / kataloški broj", type: "text", storage: "attr", group: "Detalji", scope: ["kamping-oprema"] },
  { key: "brandPart", label: "Proizvođač dijela", type: "text", storage: "attr", group: "Detalji", scope: ["kamping-oprema"] },

  // Karlo 30.07: podrubrika "Vrsta" duplirala je gornju Podkategoriju →
  // ostaje samo za podkategorije koje nemaju vlastiti "Tip".
  ...vrstaFromChildren("prosti-cas"),

  // ⚠️ Karlo 29.08.2026 (st.18): "Predmet najma" — novi izbornik ISPOD
  // Podkategorije za "Ponude za najam" (isti mehanizam kao "Stil"/"Tip
  // e-bicikla" — grupa "Vrsta" renderira se tu automatski u sve 3 forme).
  { key: "rentalItemType", label: "Predmet najma", type: "select", storage: "attr", group: "Vrsta",
    scope: ["najam"],
    options: [
      { value: "kamperi", label: "Kamperi" },
      { value: "kamp-prikolice", label: "Kamp prikolice" },
      { value: "mobilne-kucice", label: "Mobilne kućice" },
      { value: "moduli-za-kamper", label: "Moduli za kamper" },
      { value: "satorske-prikolice", label: "Šatorske prikolice" },
      { value: "krovni-satori", label: "Krovni šatori" },
      { value: "e-bicikli", label: "E-bicikli" },
      { value: "e-romobil", label: "E-romobil" },
      { value: "ostalo", label: "Ostalo" },
    ] },

  // Tip — po subkategoriji (domenska analiza)
  // ⚠️ Karlo 29.08.2026 (st.22): lista svedena na točno ovih 5 — Gliser,
  // Kabinski, Jahta i Radni brod maknuti.
  { key: "boatType", label: "Tip plovila", type: "multi", storage: "attr", group: "Vrsta", scope: ["plovila"],
    options: [
      { value: "motorni", label: "Motorni" },
      { value: "jedrilice", label: "Jedrilice" },
      { value: "gumenjaci", label: "Gumenjaci" },
      { value: "jetski", label: "Jetski" },
      { value: "vanbrodski-motori", label: "Vanbrodski motori" },
    ] },
  // Karlo 30.07: "Raspored kampera" → "Tip kampera", proširena lista.
  { key: "camperLayout", label: "Tip kampera", type: "multi", storage: "attr", group: "Vrsta", scope: ["kamperi"],
    options: [
      { value: "alkoven", label: "Alkoven" },
      { value: "poluintegralni", label: "Poluintegralni" },
      { value: "integralni", label: "Integralni" },
      { value: "buscamper", label: "Bus camper / kombi" },
      { value: "kastenwagen", label: "Kastenwagen" },
      { value: "teretni-kamper", label: "Kamper na teretnom vozilu" },
      { value: "ostalo", label: "Ostalo" },
    ] },
  { key: "eBikeType", label: "Tip e-bicikla", type: "select", storage: "attr", group: "Vrsta", scope: ["e-bicikli"],
    options: [
      { value: "city", label: "Gradski" },
      { value: "mtb", label: "MTB" },
      { value: "trekking", label: "Trekking" },
      { value: "cargo", label: "Cargo" },
      { value: "sklopivi", label: "Sklopivi" },
    ] },

  // ── Karlo 30.07: "Dimenzije" → "Dimenzije i upotrebljivost" ──────────────
  // "Broj spavanja" → "Broj ležišta" s Od/Do izbornikom (prije jedan select).
  { key: "sleeps", label: "Broj ležišta", type: "range", storage: "attr",
    group: "Dimenzije i upotrebljivost",
    scope: ["kamperi", "kamp-prikolice", "mobilne-kucice", "satorske-prikolice", "krovni-satori", "plovila", "najam"],
    steps: [1, 2, 3, 4, 5, 6, 7, 8] },
  // Dužina: kamperi kreću od 5 m, kamp prikolice od 3 m (manje su).
  { key: "lengthM", label: "Dužina", type: "range", unit: "m", storage: "attr",
    group: "Dimenzije i upotrebljivost", scope: ["kamperi"],
    steps: [5, 6, 7, 8, 9, 10] },
  { key: "lengthM", label: "Dužina", type: "range", unit: "m", storage: "attr",
    group: "Dimenzije i upotrebljivost", scope: ["kamp-prikolice"],
    steps: [3, 4, 5, 6, 7, 8, 9, 10] },
  { key: "lengthM", label: "Dužina", type: "range", unit: "m", min: 2, max: 18, step: 0.1,
    storage: "attr", group: "Dimenzije i upotrebljivost",
    scope: ["mobilne-kucice", "moduli-za-kamper", "satorske-prikolice", "krovni-satori", "plovila", "najam"] },
  // KAMPERI: "Širina" zamijenjena "Brojem sjedala" (Karlov zahtjev).
  { key: "seats", label: "Broj sjedala", type: "range", storage: "attr",
    group: "Dimenzije i upotrebljivost", scope: ["kamperi"],
    steps: [2, 3, 4, 5, 6] },
  { key: "widthM", label: "Širina", type: "range", unit: "m", min: 1.5, max: 5, step: 0.1,
    storage: "attr", group: "Dimenzije i upotrebljivost",
    scope: ["mobilne-kucice", "moduli-za-kamper", "satorske-prikolice", "krovni-satori", "plovila", "najam"] },
  // "Visina" izbačena iz kampera i kamp prikolica (ostaje ostalima).
  { key: "heightM", label: "Visina", type: "range", unit: "m", min: 1.5, max: 4, step: 0.1,
    storage: "attr", group: "Dimenzije i upotrebljivost",
    scope: ["mobilne-kucice", "moduli-za-kamper", "satorske-prikolice", "krovni-satori", "najam"] },
  // KAMP PRIKOLICE: "Težina" → "Najveća dozvoljena masa (NDM)" — JEDAN izbornik
  // "do max", pa je `steps` s praznim Od dijelom (renderira se kao raspon, ali
  // korisnik popunjava samo Do).
  { key: "gvwKg", label: "Najveća dozvoljena masa (NDM) u kg", type: "range", unit: "kg",
    storage: "attr", group: "Dimenzije i upotrebljivost", scope: ["kamp-prikolice"],
    maxOnly: true,
    steps: [750, 1000, 1500, 2000, 2500, 3000, 3500] },
  // "Težina" izbačena iz kampera i kamp prikolica.
  { key: "weightKg", label: "Težina", type: "range", unit: "kg", min: 0, max: 7500, step: 50,
    storage: "attr", group: "Dimenzije i upotrebljivost",
    scope: ["mobilne-kucice", "moduli-za-kamper", "satorske-prikolice", "krovni-satori", "plovila", "najam"] },
  // "Broj osovina" izbačen iz kamp prikolica (ostaje šatorskim).
  { key: "axles", label: "Broj osovina", type: "select", storage: "attr",
    group: "Dimenzije i upotrebljivost", scope: ["satorske-prikolice"],
    options: [1,2,3].map((n) => ({ value: String(n), label: `${n}` })) },

  // Motor kamper — samo kamperi/mobilne (domenska analiza)
  // ⚠️ Karlo 29.08.2026 (st.20): "najam" maknut — cijela rubrika Motor izbačena
  // iz Ponuda za najam (Kilometraža, Gorivo, Mjenjač, Snaga).
  { key: "km", label: "Kilometri", type: "range", unit: "km", min: 0, max: 500000, step: 5000, storage: "column", group: "Motor",
    scope: ["kamperi"] },
  // ⚠️ Karlo 26.08.2026: E-romobil i E-bicikl nemaju rubriku Motor, ali Kilometri
  // ostaju — u Motu su na vrhu (COMMON_KM, bez grupe), pa je ovdje ista,
  // negrupirana kopija.
  { key: "km", label: "Kilometri", type: "range", unit: "km", min: 0, max: 500000, step: 5000, storage: "column",
    scope: ["e-skuteri", "e-bicikli"] },
  { key: "fuel", label: "Gorivo", type: "multi", storage: "column", group: "Motor", scope: ["kamperi"],
    options: ["Dizel","Benzin"].map(v) },
  // ⚠️ Karlo 26.08.2026: "e-skuteri" maknut — E-romobil nema rubriku Motor.
  { key: "transmission", label: "Mjenjač", type: "multi", storage: "column", group: "Motor", scope: ["kamperi"],
    options: [v("Ručni"), v("Automatski")] },
  // ⚠️ Karlo 26.08.2026: "e-skuteri" maknut — E-romobil nema rubriku Motor.
  { key: "powerKw", label: "Snaga", type: "range", unit: "kW", min: 0, max: 300, step: 5, storage: "column", group: "Motor",
    scope: ["kamperi"] },

  // Motor plovila — samo plovila (domenska analiza)
  // ⚠️ Karlo 31.08.2026: "Tip motora", "Snaga motora (kW)", "Materijal trupa"
  // i "Registriran / upisan" maknuti u cijelosti — Karlo eksplicitno tražio.
  { key: "numEngines", label: "Broj motora", type: "select", storage: "attr", group: "Motor", scope: ["plovila"],
    options: [1,2,3,4].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "engineHp", label: "Snaga motora (HP)", type: "range", unit: "HP", min: 0, max: 600, step: 5, storage: "attr", group: "Motor", scope: ["plovila"] },
  { key: "engineHours", label: "Radni sati motora", type: "range", unit: "h", min: 0, max: 5000, step: 50, storage: "attr", group: "Motor", scope: ["plovila"] },

  // E-bicikli / e-skuteri (domenska analiza)
  { key: "motorPowerW", label: "Snaga motora", type: "range", unit: "W", min: 0, max: 20000, step: 100, storage: "attr", group: "Električna", scope: ["e-bicikli"] },
  // ⚠️ Karlo 29.08.2026 (st.17): E-bicikl izjednačen s Motom — do 20000 W, korak 100 (bilo 5000/50).
  // ⚠️ Karlo 29.08.2026 (st.16): E-romobil izjednačen s Motom — do 20000 W, korak 100.
  { key: "motorPowerW", label: "Snaga motora", type: "range", unit: "W", min: 0, max: 20000, step: 100, storage: "attr", group: "Električna", scope: ["e-skuteri"] },
  { key: "batteryCapacityWh", label: "Kapacitet baterije", type: "range", unit: "Wh", min: 0, max: 5000, step: 50, storage: "attr", group: "Električna", scope: ["e-bicikli"] },
  // ⚠️ Karlo 29.08.2026 (st.17): E-bicikl izjednačen s Motom — do 5000 Wh, korak 50 (bilo 2000/25).
  // ⚠️ Karlo 29.08.2026 (st.16): E-romobil izjednačen s Motom — do 5000 Wh, korak 50.
  { key: "batteryCapacityWh", label: "Kapacitet baterije", type: "range", unit: "Wh", min: 0, max: 5000, step: 50, storage: "attr", group: "Električna", scope: ["e-skuteri"] },
  { key: "rangeKm", label: "Doseg", type: "range", unit: "km", min: 0, max: 300, step: 5, storage: "attr", group: "Električna", scope: ["e-bicikli"] },
  // ⚠️ Karlo 29.08.2026 (st.17): E-bicikl izjednačen s Motom — do 300 km (bilo 200).
  // ⚠️ Karlo 29.08.2026 (st.16): E-romobil izjednačen s Motom — do 300 km.
  { key: "rangeKm", label: "Doseg", type: "range", unit: "km", min: 0, max: 300, step: 5, storage: "attr", group: "Električna", scope: ["e-skuteri"] },
  // ⚠️ Karlo 29.08.2026 (st.17): "maxSpeedKmh" (Maks. brzina do 80 km/h) UKLONJEN —
  // duplirao je "maxSpeedEv" niže u nizu (isti naziv, Moto ima samo jedno polje).
  { key: "foldable", label: "Sklopivo", type: "toggle", storage: "attr", group: "Električna", scope: ["e-bicikli", "e-skuteri"] },
  // ⚠️ Karlo 29.08.2026 (st.17): "wheelSizeInch" (Promjer kotača) IZBRISAN u
  // cijelosti — Moto ga nikad nije imao, Karlo ga eksplicitno maknuo s oba mjesta.

  // Udobnost (domenska analiza)
  { key: "wc", label: "WC", type: "toggle", storage: "attr", group: "Udobnost", scope: ["mobilne-kucice", "satorske-prikolice"] },
  { key: "kitchen", label: "Kuhinja", type: "toggle", storage: "attr", group: "Udobnost", scope: ["mobilne-kucice", "satorske-prikolice"] },
  { key: "shower", label: "Tuš", type: "toggle", storage: "attr", group: "Udobnost", scope: ["mobilne-kucice", "satorske-prikolice"] },
  { key: "refrigerator", label: "Hladnjak", type: "toggle", storage: "attr", group: "Udobnost", scope: ["mobilne-kucice", "satorske-prikolice"] },
  { key: "ac", label: "Klima", type: "toggle", storage: "attr", group: "Udobnost", scope: ["mobilne-kucice", "satorske-prikolice"] },
  { key: "heating", label: "Grijanje", type: "select", storage: "attr", group: "Udobnost",
    scope: ["mobilne-kucice", "satorske-prikolice"],
    options: [
      { value: "plin", label: "Plinsko" },
      { value: "dizel", label: "Dizelsko" },
      { value: "truma", label: "Truma" },
      { value: "webasto", label: "Webasto" },
    ] },
  { key: "solar", label: "Solarni panel", type: "toggle", storage: "attr", group: "Udobnost", scope: ["mobilne-kucice", "satorske-prikolice"] },
  { key: "awning", label: "Markiza", type: "toggle", storage: "attr", group: "Udobnost", scope: ["mobilne-kucice", "satorske-prikolice"] },
  { key: "tv", label: "TV", type: "toggle", storage: "attr", group: "Udobnost", scope: ["mobilne-kucice", "satorske-prikolice"] },
  { key: "boiler", label: "Bojler", type: "toggle", storage: "attr", group: "Udobnost", scope: ["mobilne-kucice", "satorske-prikolice"] },
  { key: "waterTankL", label: "Spremnik vode", type: "range", unit: "L", min: 0, max: 300, step: 10, storage: "attr", group: "Udobnost", scope: ["mobilne-kucice", "satorske-prikolice"] },
  // Karlo 30.07: "Mover" uklonjen — cijela rubrika Udobnost izbačena iz kamp prikolica.
  // ⚠️ Karlo 31.08.2026: "plovila" maknut iz svih Udobnost zapisa (cijela
  // rubrika izbačena iz Plovila). Rubrika "Dodatne opcije" (GPS/ploter,
  // Autopilot, Sidreno vitlo) bila je plovila-ekskluzivna — obrisana u
  // cijelosti umjesto suženja scopea.

  // Ostalo (domenska analiza)
  // Karlo 30.07: "Tip ponude" i "Garancija" izbrisani iz kampera i kamp prikolica.
  // ⚠️ Karlo 29.08.2026 (st.20): "najam" maknut — Tip ponude izbačen iz Ponuda za najam.
  { key: "offerType", label: "Tip ponude", type: "multi", storage: "attr", group: "Ostalo",
    scope: ["kamperi", "mobilne-kucice", "kamp-prikolice", "moduli-za-kamper", "satorske-prikolice", "krovni-satori", "plovila", "e-bicikli", "e-skuteri", "prosti-cas-ostalo"],
    options: [v("prodaja"), v("najam")] },
  { key: "ownership", label: "Vlasništvo", type: "multi", storage: "attr", group: "Ostalo",
    options: [
      { value: "servisna", label: "Servisna evidencija" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
    ],
    // ⚠️ Karlo 26.08.2026: Vlasništvo se NE prikazuje kod mobilnih kućica.
    // ⚠️ Karlo 29.08.2026 (st.20): "najam" maknut — Vlasništvo izbačen iz Ponuda za najam.
    scope: ["kamperi", "kamp-prikolice", "plovila", "prosti-cas-ostalo"] },
  // ⚠️ Karlo 29.08.2026 (st.16/17): E-romobil i E-bicikl izjednačeni s Motom —
  // iste 3 opcije i grupa "Povijest" (Moto tu rubriku ima, prosti-cas inače ne).
  { key: "ownership", label: "Vlasništvo", type: "multi", storage: "attr", group: "Povijest",
    options: [
      { value: "servisna", label: "Servisna knjižica" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
      { value: "garazirano", label: "Garažirano" },
    ],
    scope: ["e-skuteri", "e-bicikli"] },
  // ⚠️ Grupa "Ostalo" (ne "Povijest") — PROSTI_CAS nema rubriku Povijest, pa bi
  // je ovo polje samo za sebe stvorilo. Karlo 29.08.2026 (st.16): E-romobil
  // izuzet iz ovog popisa — izjednačen s Motom (grupa "Povijest") u zapisu ispod.
  // ⚠️ Karlo 29.08.2026 (st.20): "najam" maknut — Broj vlasnika izbačen iz Ponuda za najam.
  { ...NUM_OWNERS_FIELD, shared: false, group: "Ostalo",
    scope: ["kamperi", "kamp-prikolice", "mobilne-kucice", "moduli-za-kamper", "satorske-prikolice",
      "krovni-satori", "plovila", "prosti-cas-ostalo"] },
  { ...NUM_OWNERS_FIELD, shared: false, group: "Povijest", scope: ["e-skuteri", "e-bicikli"] },
  // ⚠️ Karlo 29.08.2026 (st.20): "najam" maknut — Garancija izbačena iz Ponuda za najam.
  { key: "warranty", label: "Garancija", type: "toggle", storage: "attr", group: "Ostalo", scope: ["plovila", "kamping-oprema"] },
  // Karlo 30.07: nova rubrika "Stanje vozila" — traži se za KAMPERE.
  { key: "hideDamaged", label: "Vozilo oštećeno", type: "select", storage: "attr", searchOnly: true,
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS,
    scope: ["kamperi"] },
  { key: "hideBroken", label: "Vozilo u kvaru", type: "select", storage: "attr", searchOnly: true,
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS,
    scope: ["kamperi"] },

  // Karlo 31.07: dokumenti samo za ono što ide na cestu s tablicama —
  // kamper i kamp prikolica. Mobilna kućica, modul, šatorska prikolica,
  // plovilo, bicikl i kamping oprema nemaju ni šasiju ni tehnički.
  ...documentFields(["kamperi", "kamp-prikolice"]),

  // Polja "Stanje vozila" (dijeljena lista) — samo za E-romobil, isti obrazac
  // kao UTV u gospodarskoj (`SELLER_STATE_FIELDS.map(... scope: ["utv"])`).
  ...SELLER_STATE_FIELDS.map((f) => ({ ...f, scope: ["e-skuteri"] })),
  // ⚠️ Karlo 25.08.2026: E-romobil u Slobodnom vremenu mora imati IDENTIČNA
  // polja kao moto/e-skuter — ova su preslikana iz MOTO_FIELDS, scope samo
  // "e-skuteri" da ne procure na kampere/plovila.
  // ⚠️ Karlo 26.08.2026: Stil maknut iz E-romobila (isto kao u Motu) — polje je
  // bilo isključivo za "e-skuteri", pa je uklonjeno u cijelosti.
  { key: "maxSpeedEv", label: "Maks. brzina", type: "range", unit: "km/h", min: 0, max: 150, step: 5,
    storage: "attr", group: "Električna", scope: ["e-skuteri", "e-bicikli"] },
  { key: "color", label: "Boja", type: "multi", storage: "column", group: "Boja",
    options: ["Crna","Bijela","Crvena","Plava","Zelena","Žuta","Narančasta","Siva","Srebrna"].map(v), scope: ["e-skuteri", "e-bicikli"] },
  // E-romobil koristi moto nazive polja (Prikaz u kvaru / Prikaz oštećenih) —
  // rubrika mora izgledati identično kao u Motu.
  // ⚠️ Karlo 26.08.2026: Pogon maknut — E-romobil nema rubriku Motor.
  { key: "hideDamaged", label: "Prikaz oštećenih", type: "select", storage: "attr", searchOnly: true,
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS,
    scope: ["e-skuteri", "e-bicikli"] },
  { key: "hideBroken", label: "Prikaz u kvaru", type: "select", storage: "attr", searchOnly: true,
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS,
    scope: ["e-skuteri", "e-bicikli"] },

  // ⚠️ Karlo 25.08.2026: E-bicikli u Slobodnom vremenu = ISTA rubrika kao
  // moto/e-bicikl (dvije lokacije, isti sadržaj). Polja preslikana iz
  // MOTO_FIELDS sa scope samo "e-bicikli".
  // ⚠️ Karlo 26.08.2026 (st. 15): rubrike Motor i Dodatne opcije maknute s OBJE
  // lokacije, pa su preslikana polja uklonjena — ostaju samo ova ispod.
  ...SELLER_STATE_FIELDS.map((f) => ({ ...f, scope: ["e-bicikli"] })),
];

// ── DIJELOVI (parts and accessories) ───────────────────────────────────
const DIJELOVI_FIELDS: FilterField[] = [
  COMMON_PRICE, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  ...vrstaFromChildren("dijelovi"),
  // ⚠️ Karlo 31.08.2026 (st.27): Auto dijelovi — Tip dijela, Stanje dijela,
  // Kompatibilno s i Količina maknuti; ostatak Dijelova (gume, felge,
  // multimedija, ulja...) zadržava sva 4 polja.
  { key: "partType", label: "Tip dijela", type: "select", storage: "attr", group: "Detalji",
    scope: ["auto-dodatna-oprema", "multimedija", "moto-dijelovi", "za-gospodarska", "za-gradevinske-strojeve", "za-poljoprivredne-strojeve", "za-vilicare", "servisna-oprema", "gume", "ulja-tekucine", "dijelovi-ostalo"],
    options: [
      v("Karoserija"), v("Motor"), v("Mjenjač"), v("Kočnice"),
      v("Ovjes"), v("Elektronika"), v("Interijer"), v("Vanjski"),
      v("Rasvjeta"), v("Ispuh"), v("Filteri"),
    ] },
  { key: "condition2", label: "Stanje dijela", type: "select", storage: "attr", group: "Detalji",
    scope: ["auto-dodatna-oprema", "multimedija", "moto-dijelovi", "za-gospodarska", "za-gradevinske-strojeve", "za-poljoprivredne-strojeve", "za-vilicare", "servisna-oprema", "gume", "ulja-tekucine", "dijelovi-ostalo"],
    options: [v("Novo"), v("Rabljeno"), { value: "obnovljeno", label: "Obnovljeno" }] },
  { key: "compatibleWith", label: "Kompatibilno s (marka/model)", type: "text", storage: "attr", group: "Detalji",
    scope: ["auto-dodatna-oprema", "multimedija", "moto-dijelovi", "za-gospodarska", "za-gradevinske-strojeve", "za-poljoprivredne-strojeve", "za-vilicare", "servisna-oprema", "gume", "ulja-tekucine", "dijelovi-ostalo"] },
  { key: "oem", label: "OEM / kataloški broj", type: "text", storage: "attr", group: "Detalji" },
  { key: "brandPart", label: "Proizvođač dijela", type: "text", storage: "attr", group: "Detalji" },
  { key: "quantity", label: "Količina (kom)", type: "select", storage: "attr", group: "Detalji",
    scope: ["auto-dodatna-oprema", "multimedija", "moto-dijelovi", "za-gospodarska", "za-gradevinske-strojeve", "za-poljoprivredne-strojeve", "za-vilicare", "servisna-oprema", "gume", "ulja-tekucine", "dijelovi-ostalo"],
    options: [1,2,3,4,5].map((n) => ({ value: String(n), label: n === 5 ? "5+" : `${n}` })) },

  // Gume (tires) — scope gume
  { key: "tireWidth", label: "Širina gume", type: "select", storage: "attr", group: "Gume", scope: ["gume"],
    options: [155,165,175,185,195,205,215,225,235,245,255,265,275,285,295,305].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "tireProfile", label: "Profil gume", type: "select", storage: "attr", group: "Gume", scope: ["gume"],
    options: [30,35,40,45,50,55,60,65,70,75,80].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "tireDiameter", label: "Promjer (col)", type: "select", storage: "attr", group: "Gume", scope: ["gume"],
    options: [13,14,15,16,17,18,19,20,21,22].map((n) => ({ value: String(n), label: `R${n}` })) },
  { key: "tireSeason", label: "Sezona", type: "multi", storage: "attr", group: "Gume", scope: ["gume"],
    options: [v("Ljetne"), v("Zimske"), { value: "all-season", label: "Cjelogodišnje" }] },
  { key: "tireType", label: "Vrsta", type: "multi", storage: "attr", group: "Gume", scope: ["gume"],
    options: [{ value: "osobne", label: "Osobne" }, { value: "teretne", label: "Teretne" }, v("Moto"), { value: "off-road", label: "Off-road" }] },
  { key: "tireLoadIndex", label: "Indeks nosivosti", type: "text", storage: "attr", group: "Gume", scope: ["gume"] },
  { key: "tireSpeedIndex", label: "Indeks brzine", type: "select", storage: "attr", group: "Gume", scope: ["gume"],
    options: ["T","H","V","W","Y"].map(v) },
  { key: "tireRunflat", label: "Runflat", type: "toggle", storage: "attr", group: "Gume", scope: ["gume"] },

  // Felge (wheels) — scope felge
  { key: "rimSize", label: "Promjer felge (col)", type: "select", storage: "attr", group: "Felge", scope: ["felge"],
    options: [13,14,15,16,17,18,19,20,21,22].map((n) => ({ value: String(n), label: `${n}"` })) },
  { key: "rimWidth", label: "Širina felge (J)", type: "select", storage: "attr", group: "Felge", scope: ["felge"],
    options: [5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10].map((n) => ({ value: String(n), label: `${n}J` })) },
  { key: "rimBoltPattern", label: "Razmak rupa (PCD)", type: "select", storage: "attr", group: "Felge", scope: ["felge"],
    options: ["4x100","4x108","5x100","5x108","5x112","5x114.3","5x120","6x139.7"].map(v) },
  { key: "rimET", label: "ET (offset)", type: "text", storage: "attr", group: "Felge", scope: ["felge"] },
  { key: "rimLugHoles", label: "Broj rupa", type: "select", storage: "attr", group: "Felge", scope: ["felge"],
    options: [4,5,6].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "rimMaterial", label: "Materijal", type: "multi", storage: "attr", group: "Felge", scope: ["felge"],
    options: [{ value: "alu", label: "Aluminij" }, { value: "celik", label: "Čelik" }] },
  { key: "rimColor", label: "Boja felge", type: "text", storage: "attr", group: "Felge", scope: ["felge"] },
  { key: "rimQuantity", label: "Količina (kom)", type: "select", storage: "attr", group: "Felge", scope: ["felge"],
    options: [1,2,4].map((n) => ({ value: String(n), label: `${n}` })) },

  // Ulja i tekućine (oils/fluids) — scope ulja-tekucine
  { key: "fluidType", label: "Vrsta tekućine", type: "select", storage: "attr", group: "Tekućine", scope: ["ulja-tekucine"],
    options: [
      { value: "motorno-ulje", label: "Motorno ulje" },
      { value: "ulje-mjenjac", label: "Ulje za mjenjač" },
      { value: "rashladna", label: "Rashladna tekućina" },
      { value: "kocnice", label: "Kočiona tekućina" },
      { value: "adblue", label: "AdBlue" },
    ] },
  { key: "viscosity", label: "Viskozitet", type: "select", storage: "attr", group: "Tekućine", scope: ["ulja-tekucine"],
    options: ["0W-20","0W-30","5W-30","5W-40","10W-40","15W-40"].map(v) },
  { key: "oilSpecification", label: "Specifikacija", type: "text", storage: "attr", group: "Tekućine", scope: ["ulja-tekucine"] },
  { key: "oilSynthetic", label: "Tip", type: "select", storage: "attr", group: "Tekućine", scope: ["ulja-tekucine"],
    options: [
      { value: "sintetsko", label: "Sintetsko" },
      { value: "polusintetsko", label: "Polusintetsko" },
      { value: "mineralno", label: "Mineralno" },
    ] },
  { key: "oilVolume", label: "Volumen", type: "range", unit: "L", min: 0, max: 60, step: 1, storage: "attr", group: "Tekućine", scope: ["ulja-tekucine"] },
  { key: "oilBrand", label: "Proizvođač", type: "text", storage: "attr", group: "Tekućine", scope: ["ulja-tekucine"] },

  // Multimedija — scope multimedija
  { key: "mediaType", label: "Vrsta uređaja", type: "select", storage: "attr", group: "Detalji", scope: ["multimedija"],
    options: [
      { value: "radio", label: "Radio / glavna jedinica" },
      { value: "zvucnici", label: "Zvučnici" },
      { value: "pojacalo", label: "Pojačalo" },
      { value: "subwoofer", label: "Subwoofer" },
      { value: "navigacija", label: "Navigacija" },
      { value: "kamera", label: "Kamera" },
    ] },
  { key: "mediaConnectivity", label: "Povezivost", type: "multi", storage: "attr", group: "Detalji", scope: ["multimedija"],
    options: [
      { value: "bluetooth", label: "Bluetooth" },
      { value: "carplay", label: "Apple CarPlay" },
      { value: "androidauto", label: "Android Auto" },
      { value: "usb", label: "USB" },
      { value: "dab", label: "DAB+" },
    ] },

  { key: "warranty", label: "Garancija", type: "toggle", storage: "attr", group: "Ostalo" },
  // ⚠️ Karlo 31.08.2026 (st.27): "Dostava moguća" maknuta iz Auto dijelova;
  // ostatak Dijelova zadržava.
  { key: "shipping", label: "Dostava moguća", type: "toggle", storage: "attr", group: "Ostalo",
    scope: ["auto-dodatna-oprema", "multimedija", "moto-dijelovi", "za-gospodarska",
      "za-gradevinske-strojeve", "za-poljoprivredne-strojeve", "za-vilicare",
      "servisna-oprema", "gume", "ulja-tekucine", "dijelovi-ostalo"] },
];

export const FILTER_DEFS: Record<string, CategoryFilters> = {
  auto: { category: "auto", label: "Auto", fields: AUTO_FIELDS },
  moto: { category: "moto", label: "Moto", fields: MOTO_FIELDS },
  gospodarska: { category: "gospodarska", label: "Gospodarska", fields: GOSPODARSKA_FIELDS },
  mehanizacija: { category: "mehanizacija", label: "Mehanizacija", fields: MEHANIZACIJA_FIELDS },
  "prosti-cas": { category: "prosti-cas", label: "Slobodno vrijeme", fields: PROSTI_CAS_FIELDS },
  dijelovi: { category: "dijelovi", label: "Dijelovi i oprema", fields: DIJELOVI_FIELDS },
};

export function getFilterDefs(category?: string): CategoryFilters {
  return FILTER_DEFS[category ?? "auto"] ?? FILTER_DEFS.auto;
}

// Group fields by their `group` for sectioned UI rendering.
export function groupFields(fields: FilterField[]): Array<{ name: string; fields: FilterField[] }> {
  const groups = new Map<string, FilterField[]>();
  for (const f of fields) {
    const g = f.group ?? "Osnovno";
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(f);
  }
  // Karlo 31.07: KAROSERIJA je sada PRVA, iznad "Osnovno" — oblik vozila je
  // prvo o čemu prodavač/kupac razmišlja, pa je bilo neprirodno da je zakopana
  // ispod motora.
  const order = [
    "Karoserija", "Osnovno", "Vrsta", "Cijena", "Motor", "Vrata i sjedala", "Boja",
    "Osovine i nosivost", "Nosivost, visina dizanja", "Dimenzije i upotrebljivost",
    // Karlo 30.07: stanje je odluka "hoću li ovo uopće vidjeti" → visoko, odmah
    // iza osnovnih svojstava, a ne zakopano među Dodatnim opcijama.
    "Stanje vozila", "Stanje mehanizacije",
    "Specifikacije", "Električna", "Dodatne opcije", "Pravno", "Povijest",
    "Udobnost", "Dimenzije", "Detalji", "Gume", "Felge", "Tekućine", "Ostalo",
  ];
  const sorted: Array<{ name: string; fields: FilterField[] }> = [];
  for (const name of order) if (groups.has(name)) sorted.push({ name, fields: groups.get(name)! });
  for (const [name, fs] of groups) if (!order.includes(name)) sorted.push({ name, fields: fs });
  return sorted;
}
