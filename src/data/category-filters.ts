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

export type FilterFieldType =
  | "range"
  | "select"
  | "multi"
  | "text"
  | "toggle";

export type FilterOption = { value: string; label: string };

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
  storage: "column" | "attr";
  group?: string; // section header in sidebar (e.g. "Oprema → Sigurnost")
  shared?: boolean;
  // Konzistentnost pretraga↔objava (sve opcionalno, additivno):
  publishRequired?: boolean;   // objava: polje je obavezno
  searchable?: boolean;        // pretraga: prikaži kao filter (default true ako neoznačeno)
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

/** Vozila: dvije nove podrubrike umjesto starog "Stanje karoserije". */
const VEHICLE_STATE_FIELDS: FilterField[] = [
  { key: "hideDamaged", label: "Prikaz oštećenih", type: "select", storage: "attr",
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS },
  { key: "hideBroken", label: "Prikaz u kvaru", type: "select", storage: "attr",
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

  { key: "bodyType", label: "Karoserija", type: "multi", storage: "column", group: "Karoserija",
    options: [
      v("Microcar"), v("Limuzina"), v("Hatchback"), v("Karavan"),
      v("Monovolumen"), v("SUV"), v("Coupe"), v("Cabrio"), v("Pickup"),
    ] },
  { key: "drive", label: "Pogon", type: "multi", storage: "column", group: "Karoserija",
    options: [v("Prednji"), v("Stražnji"), v("4x4")] },
  // Karlo t.16: dodana klizna vrata
  { key: "doors", label: "Vrata", type: "multi", storage: "column", group: "Vrata i sjedala",
    options: [{ value: "3", label: "3 vrata" }, { value: "4", label: "4 vrata" }, { value: "5", label: "5 vrata" }, { value: "klizna", label: "Klizna vrata" }] },
  // Karlo t.17: dodan broj 3
  { key: "seats", label: "Sjedala", type: "multi", storage: "column", group: "Vrata i sjedala",
    options: [2,3,4,5,7,9].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "color", label: "Boja vozila", type: "multi", storage: "column", group: "Boja",
    options: ["Crna","Bijela","Siva","Srebrna","Plava","Crvena","Zelena","Smeđa","Žuta","Narančasta"].map(v) },

  // Emisijska norma + registracija (domenska analiza 2026-06-22)
  { key: "euroNorm", label: "Emisijska norma", type: "select", storage: "attr", group: "Motor",
    options: ["EURO 3","EURO 4","EURO 5","EURO 6","EURO 6d","EURO 7"].map(v) },

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

  // Climate (attr.multi)
  { key: "climate", label: "Klima", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "klima", label: "Klima uređaj" },
      { value: "autoklima", label: "Automatska klima" },
      { value: "grijanje-mirovanje", label: "Grijanje u mirovanju" },
    ] },
  // Interior (attr.multi) — 21 options
  { key: "interior", label: "Interijer", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "grijanje-sjedala", label: "Grijanje sjedala" },
      { value: "hlajenje-sjedala", label: "Hlađenje sjedala" },
      { value: "el-podesavanje-sjedala", label: "El. podešavanje sjedala" },
      { value: "kozna-sjedala", label: "Kožna sjedala" },
      { value: "masaza-sjedala", label: "Masažna funkcija sjedala" },
      { value: "isofix", label: "Isofix" },
      { value: "el-stakla", label: "El. podizači stakala" },
      { value: "centralno-zakljucavanje", label: "Centralno zaključavanje" },
      { value: "servo-volan", label: "Servo volan" },
      { value: "multifunkcijski-volan", label: "Multifunkcijski volan" },
      { value: "grijani-volan", label: "Grijani volan" },
      { value: "panoramski-krov", label: "Panoramski krov" },
      { value: "keyless", label: "Keyless go" },
      { value: "navigacija", label: "Navigacija" },
      { value: "headup", label: "Head-Up display" },
      { value: "bluetooth", label: "Bluetooth" },
      { value: "carplay", label: "Apple CarPlay" },
      { value: "androidauto", label: "Android Auto" },
      { value: "dab", label: "DAB radio" },
      { value: "virtual-cockpit", label: "Digitalna instrumentna ploča" },
      { value: "bezicno-punjenje", label: "Bežično punjenje" },
    ] },
  // Safety (attr.multi) — 14 options
  { key: "safety", label: "Sigurnost", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "abs", label: "ABS" },
      { value: "esp", label: "ESP" },
      { value: "airbag", label: "Zračni jastuci" },
      { value: "tempomat", label: "Tempomat" },
      { value: "adaptivni-tempomat", label: "Adaptivni tempomat" },
      { value: "xenon", label: "Xenon svjetla" },
      { value: "led", label: "LED svjetla" },
      { value: "matrix-led", label: "Matrix LED" },
      { value: "senzor-kiše", label: "Senzor kiše" },
      { value: "lane-assist", label: "Asistent praćenja trake" },
      { value: "auto-cocenje", label: "Automatsko kočenje" },
      { value: "prometni-znakovi", label: "Prepoznavanje prometnih znakova" },
      { value: "mrtvi-kut", label: "Asistent mrtvog kuta" },
      { value: "long-light-assist", label: "Auto long lights" },
    ] },
  // Parking (attr.multi)
  { key: "parking", label: "Parkiranje", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "parkirni-asistent", label: "Parkirni asistent" },
      { value: "kamera", label: "Kamera unatrag" },
      { value: "senzori", label: "Senzori parkiranja" },
      { value: "kamera-360", label: "Kamera 360°" },
    ] },
  // Other equipment (attr.multi)
  { key: "otherEquipment", label: "Ostalo", type: "multi", storage: "attr", group: "Dodatne opcije",
    options: [
      { value: "alu-felge", label: "Alu felge" },
      { value: "4x4", label: "Pogon 4x4" },
      { value: "zracni-ovjes", label: "Zračni ovjes" },
      { value: "vucna", label: "Vučna kuka" },
      { value: "krovni-nosaci", label: "Krovni nosači" },
      { value: "invalid", label: "Prilagođeno invalidu" },
      { value: "el-prtljaznik", label: "El. zatvaranje prtljažnika" },
    ] },

  // Ownership / history (attr.multi)
  { key: "ownership", label: "Vlasništvo", type: "multi", storage: "attr", group: "Povijest",
    options: [
      { value: "prvi-vlasnik", label: "Prvi vlasnik" },
      { value: "servisna", label: "Servisna knjižica" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
      { value: "garazirano", label: "Garažirano" },
      { value: "zamjena", label: "Moguća zamjena" },
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
  { key: "serviceHistory", label: "Servisna evidencija", type: "select", storage: "attr", group: "Povijest",
    options: [
      { value: "potpuna", label: "Potpuna servisna" },
      { value: "djelomicna", label: "Djelomična servisna" },
      { value: "nema", label: "Bez servisne" },
    ] },
  { key: "numOwners", label: "Broj vlasnika", type: "select", storage: "attr", group: "Povijest",
    options: [1,2,3,4].map((n) => ({ value: String(n), label: n === 4 ? "4+" : `${n}` })) },

  // Oštećeni / u kvaru — samo ostecen-u-kvaru subkategorija (domenska analiza)
  { key: "engineRuns", label: "Motor pali", type: "select", storage: "attr", group: "Povijest",
    scope: ["ostecen-u-kvaru"], publishRequired: true,
    options: [
      { value: "da", label: "Da, pali i vozi" },
      { value: "pali-ne-vozi", label: "Pali, ne vozi" },
      { value: "ne", label: "Ne pali" },
    ] },
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
    scope: ["skuter", "e-skuter"],
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

  // Karlo 27.07: obujam do 1500 cm³, snaga do 112 kW (ljestvice u MOTO_ENGINE_STEPS /
  // MOTO_POWER_STEPS ispod — Od/Do izbornik koristi njih, ne linearni step).
  { key: "engineCc", label: "Obujam motora", type: "range", unit: "cm³", min: 0, max: 1500, step: 50, storage: "column", group: "Motor" },
  { key: "powerKw", label: "Snaga", type: "range", unit: "kW", min: 0, max: 112, step: 1, storage: "column", group: "Motor" },
  { key: "fuel", label: "Pogon", type: "multi", storage: "column", group: "Motor",
    options: [v("Benzin"), v("Električni")] },
  { key: "transmission", label: "Mjenjač", type: "multi", storage: "column", group: "Motor",
    options: [v("Ručni"), v("Automatski")] },
  { key: "cylinders", label: "Cilindri", type: "select", storage: "attr", group: "Motor",
    options: [1,2,3,4,5,6].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "stroke", label: "Takt", type: "select", storage: "attr", group: "Motor",
    options: [
      { value: "2T", label: "2-taktni" },
      { value: "4T", label: "4-taktni" },
      { value: "ev", label: "Električni" },
    ] },
  { key: "drivetrain", label: "Prijenos", type: "select", storage: "attr", group: "Motor",
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
      { value: "prvi-vlasnik", label: "Prvi vlasnik" },
      { value: "servisna", label: "Servisna knjižica" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
      { value: "garazirano", label: "Garažirano" },
    ] },
  // Karlo 30.07: "Registriran do" izbačen iz Povijesti.
  // Karlo 29.07 (2. runda): grupa "Ostalo" ukinuta u MOTO —
  // "Garancija" je bila duplikat gornjeg osnovnog panela (TogglePill), a
  // "Oldtimer" je premješten u rubriku "Dodatne opcije".
  // Karlo 27.07: iz grupe "Ostalo" izbačeni "Tip ponude" i "Na zalihi".
  { key: "oldtimer", label: "Oldtimer", type: "toggle", storage: "attr", group: "Dodatne opcije" },

  // Karlo 30.07: nova rubrika "Stanje vozila" (motocikl/skuter/ATV — sve podkat.).
  ...VEHICLE_STATE_FIELDS,
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
    scope: ["dostavna", "autobusi", "utv", "najam"],
    options: [
      v("Furgon"), v("Kombi"), { value: "kamionet", label: "Kamionet" },
      { value: "sasija-kabina", label: "Šasija s kabinom" },
      { value: "sasija-nadgradnja", label: "Šasija s nadgradnjom" },
      { value: "pickup", label: "Pick up" },
    ] },

  { key: "priceVat",
    scope: ["dostavna", "kamioni", "autobusi", "utv", "najam"], label: "PDV", type: "select", storage: "attr", group: "Cijena",
    options: [
      { value: "brutto", label: "S PDV-om" },
      { value: "netto", label: "Bez PDV-a" },
    ] },

  { key: "fuel",
    scope: ["dostavna", "kamioni", "autobusi", "utv", "najam"], label: "Gorivo", type: "multi", storage: "column", group: "Motor",
    options: ["Dizel","Benzin","Hibrid","Električni","Plin"].map(v) },
  { key: "transmission",
    scope: ["dostavna", "kamioni", "autobusi", "utv", "najam"], label: "Mjenjač", type: "multi", storage: "column", group: "Motor",
    options: [v("Ručni"), v("Automatski")] },
  { key: "powerKw",
    scope: ["dostavna", "kamioni", "autobusi", "utv", "najam"], label: "Snaga", type: "range", unit: "kW", min: 0, max: 600, step: 5, storage: "column", group: "Motor" },
  // Karlo 27.07: "Obujam" izbačen iz Kamiona.
  // Karlo 29.07 (2. runda): DOSTAVNA ga opet ima — Od/Do izbornik kao u
  // "Auto oglasi napredno" (ljestvica ENGINE_STEPS u napredno-form).
  { key: "engineCc", label: "Obujam motora", type: "range", unit: "cm³", min: 0, max: 16000, step: 100, storage: "column", group: "Motor",
    scope: ["dostavna", "autobusi", "utv", "najam"] },
  // Karlo 27.07: "Emisijska norma" izbačena iz Dostavne i Kamiona.
  { key: "euroNorm", label: "Emisijska norma", type: "select", storage: "attr", group: "Motor",
    scope: ["autobusi", "utv", "najam"],
    options: ["EURO 3","EURO 4","EURO 5","EURO 6","EURO 6d","EURO 7"].map(v) },

  // Karlo 29.07: KAROSERIJA izbačena iz kamiona i teretnih prikolica.
  { key: "seats", label: "Broj sjedala", type: "range", min: 1, max: 80, step: 1, storage: "column", group: "Karoserija",
    scope: ["dostavna", "autobusi", "utv", "najam"] },
  // Karlo 27.07: stražnja i bočna vrata — skraćene liste ("Sve" je prazna vrijednost dropdowna).
  { key: "rearDoors", label: "Stražnja vrata", type: "select", storage: "attr", group: "Karoserija",
    scope: ["dostavna", "autobusi", "utv", "najam"],
    options: [
      { value: "podizna", label: "Podizna vrata" },
      { value: "dvokrilna", label: "Dvokrilna vrata" },
    ] },
  { key: "sideDoors", label: "Bočna vrata", type: "select", storage: "attr", group: "Karoserija",
    scope: ["dostavna", "autobusi", "utv", "najam"],
    options: [
      { value: "klizna-jednostrana", label: "Klizna jednostrana" },
      { value: "obje", label: "Obje klizne" },
    ] },

  // Karlo 27.07: cijela grupa "Specifikacije" izbačena iz DOSTAVNE.
  // Ostale podkategorije (kamioni/autobusi/prikolice/UTV/najam) je zadržavaju —
  // zato scope, a ne brisanje polja.
  { key: "gvwKg", label: "Ukupna masa", type: "range", unit: "kg", min: 0, max: 60000, step: 100, storage: "attr", group: "Specifikacije",
    scope: ["autobusi", "utv", "najam"] },
  { key: "payloadKg", label: "Korisna nosivost", type: "range", unit: "kg", min: 0, max: 30000, step: 100, storage: "attr", group: "Specifikacije",
    scope: ["autobusi", "utv", "najam"] },
  { key: "axles", label: "Broj osovina", type: "select", storage: "attr", group: "Specifikacije",
    scope: ["autobusi", "utv", "najam"],
    options: [2,3,4,5,6].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "wheelbaseMm", label: "Međuosovinski razmak", type: "range", unit: "mm", min: 2000, max: 7500, step: 50, storage: "attr", group: "Specifikacije",
    scope: ["autobusi", "utv", "najam"] },
  { key: "axleConfiguration", label: "Konfiguracija osovina", type: "select", storage: "attr", group: "Specifikacije",
    scope: ["autobusi"],
    options: ["4x2","4x4","6x2","6x4","6x6","8x4"].map(v) },
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
    scope: ["autobusi", "utv", "najam"],
    options: [
      { value: "abs", label: "ABS" },
      { value: "ebs", label: "EBS" },
      { value: "abs-ebs", label: "ABS + EBS" },
    ] },

  // Autobusi — kapacitet (domenska analiza)
  { key: "seatingCapacity", label: "Broj sjedećih mjesta", type: "range", min: 1, max: 80, step: 1,
    storage: "attr", group: "Specifikacije", scope: ["autobusi"] },
  { key: "standingCapacity", label: "Broj stajaćih mjesta", type: "range", min: 0, max: 120, step: 1,
    storage: "attr", group: "Specifikacije", scope: ["autobusi"] },

  // Equipment groups (same as AUTO trimmed)
  { key: "climate", label: "Klima", type: "multi", storage: "attr", group: "Dodatne opcije",
    scope: ["dostavna", "autobusi", "utv", "najam"],
    options: [
      { value: "klima", label: "Klima uređaj" },
      { value: "autoklima", label: "Automatska klima" },
      { value: "grijanje-mirovanje", label: "Grijanje u mirovanju" },
    ] },
  { key: "interior", label: "Interijer", type: "multi", storage: "attr", group: "Dodatne opcije",
    scope: ["dostavna", "autobusi", "utv", "najam"],
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
    scope: ["dostavna", "autobusi", "utv", "najam"],
    options: [
      { value: "abs", label: "ABS" },
      { value: "esp", label: "ESP" },
      { value: "airbag", label: "Zračni jastuci" },
      { value: "tempomat", label: "Tempomat" },
      { value: "led", label: "LED svjetla" },
      { value: "auto-cocenje", label: "Automatsko kočenje" },
    ] },
  { key: "parking", label: "Parkiranje", type: "multi", storage: "attr", group: "Dodatne opcije",
    scope: ["dostavna", "autobusi", "utv", "najam"],
    options: [
      { value: "kamera", label: "Kamera unatrag" },
      { value: "senzori", label: "Senzori parkiranja" },
    ] },
  { key: "otherEquipment", label: "Ostalo", type: "multi", storage: "attr", group: "Dodatne opcije",
    scope: ["dostavna", "autobusi", "utv", "najam"],
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
  { key: "busWc", label: "WC", type: "toggle", storage: "attr", group: "Dodatne opcije", scope: ["autobusi"] },
  { key: "busTv", label: "TV / multimedija", type: "toggle", storage: "attr", group: "Dodatne opcije", scope: ["autobusi"] },

  // Karlo 27.07: u DOSTAVNOJ od "Povijesti" ostaje samo Stanje, i to s istom
  // listom kao AUTO ("Stanje karoserije"). Ostale podkat. zadržavaju punu grupu.
  { key: "ownership", label: "Vlasništvo", type: "multi", storage: "attr", group: "Povijest",
    scope: ["autobusi", "utv", "najam"],
    options: [
      { value: "prvi-vlasnik", label: "Prvi vlasnik" },
      { value: "servisna", label: "Servisna knjižica" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
      { value: "garazirano", label: "Garažirano" },
    ] },
  // Karlo 30.07: "Stanje" (6 stupnjeva štete) zamijenjeno rubrikom "Stanje vozila"
  // s Prikaži/Ne prikaži logikom — vrijedi za dostavnu, kamione, autobuse, utv, najam.
  { key: "hideDamaged", label: "Prikaz oštećenih", type: "select", storage: "attr",
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS,
    scope: ["dostavna", "kamioni", "autobusi", "utv", "najam"] },
  { key: "hideBroken", label: "Prikaz u kvaru", type: "select", storage: "attr",
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS,
    scope: ["dostavna", "kamioni", "autobusi", "utv", "najam"] },
  // TERETNE PRIKOLICE dobivaju SAMO "Prikaz oštećenih" — prikolica nema motor,
  // pa "u kvaru" nema smisla (Dinova potvrda 30.07, nije previd u Karlovom popisu).
  { key: "hideDamaged", label: "Prikaz oštećenih", type: "select", storage: "attr",
    group: "Stanje vozila", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS,
    scope: ["prikolice"] },
  { key: "registrationUntil", label: "Registriran do", type: "text", storage: "attr", group: "Povijest",
    scope: ["autobusi", "utv", "najam"] },
  { key: "importedFrom", label: "Uvezeno iz", type: "text", storage: "attr", group: "Povijest",
    scope: ["autobusi", "utv", "najam"] },

  { key: "color",
    scope: ["dostavna", "kamioni", "autobusi", "utv", "najam"], label: "Boja", type: "multi", storage: "column", group: "Boja",
    options: ["Bijela","Plava","Crvena","Crna","Siva","Žuta","Zelena","Narančasta"].map(v) },

  // Karlo 27.07: grupa "Ostalo" izbačena iz GOSPODARSKE — "Tip ponude" i
  // "Garancija" već stoje u gornjem osnovnom panelu, ovdje su bili duplikat.
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
  { key: "drive4x4", label: "Pogon 4x4 / 4WD", type: "toggle", storage: "attr", group: "Dodatne opcije" },
  { key: "pto", label: "Priključno vratilo (PTO)", type: "toggle", storage: "attr", group: "Dodatne opcije", scope: ["poljoprivredni-strojevi"] },
  { key: "threePointHitch", label: "Trozglobna poveznica", type: "toggle", storage: "attr", group: "Dodatne opcije", scope: ["poljoprivredni-strojevi"] },
  { key: "frontLoader", label: "Prednji utovarivač", type: "toggle", storage: "attr", group: "Dodatne opcije", scope: ["poljoprivredni-strojevi"] },
  { key: "cabin", label: "Klimatizirana kabina", type: "toggle", storage: "attr", group: "Dodatne opcije" },
  { key: "rops", label: "ROPS (zaštita od prevrtanja)", type: "toggle", storage: "attr", group: "Dodatne opcije" },
  { key: "fops", label: "FOPS (zaštita od pada predmeta)", type: "toggle", storage: "attr", group: "Dodatne opcije" },
  { key: "gps", label: "GPS / Telematika", type: "toggle", storage: "attr", group: "Dodatne opcije" },
  { key: "ac", label: "Klima uređaj", type: "toggle", storage: "attr", group: "Dodatne opcije" },
  { key: "quickCoupler", label: "Brza spojka", type: "toggle", storage: "attr", group: "Dodatne opcije" },

  // ── Karlo 30.07: nova rubrika "Stanje mehanizacije" ─────────────────────
  // Traži se za poljoprivredne i građevinske strojeve; dajemo je i preostalim
  // podkategorijama radi dosljednosti (ista logika Prikaži / Ne prikaži).
  { key: "hideDamaged", label: "Mehanizacija oštećena", type: "select", storage: "attr",
    group: "Stanje mehanizacije", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS },
  { key: "hideBroken", label: "Mehanizacija u kvaru", type: "select", storage: "attr",
    group: "Stanje mehanizacije", placeholder: "Prikaži", options: SHOW_HIDE_OPTIONS },

  // Povijest — Karlo 30.07: "Stanje" (6 stupnjeva) izbačeno, gore je zamjena.
  { key: "ownership", label: "Vlasništvo", type: "multi", storage: "attr", group: "Povijest",
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"],
    options: [
      { value: "prvi-vlasnik", label: "Prvi vlasnik" },
      { value: "servisna", label: "Servisna knjižica" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
    ] },
  { key: "registeredForRoad", label: "Registriran za cestu", type: "toggle", storage: "attr", group: "Povijest",
    scope: ["sumarski-strojevi", "komunalni-strojevi", "najam"] },

  // Najam — samo najam subkategorija (domenska analiza)
  { key: "dailyRate", label: "Dnevna cijena najma", type: "range", unit: "€", min: 0, max: 5000, step: 10, storage: "attr", group: "Ostalo", scope: ["najam"] },
  { key: "minRentalDays", label: "Min. dana najma", type: "select", storage: "attr", group: "Ostalo", scope: ["najam"],
    options: [1,3,7,14,30].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "operator", label: "S operaterom", type: "toggle", storage: "attr", group: "Ostalo", scope: ["najam"] },
  { key: "delivery", label: "Dostava na lokaciju", type: "toggle", storage: "attr", group: "Ostalo", scope: ["najam"] },

  { key: "offerType", label: "Tip ponude", type: "multi", storage: "attr", group: "Ostalo",
    options: [v("prodaja"), v("najam")] },
  { key: "warranty", label: "Garancija", type: "toggle", storage: "attr", group: "Ostalo" },
  { key: "serviceHistory", label: "Servisna evidencija", type: "toggle", storage: "attr", group: "Ostalo" },
];

// ── PROSTI-CAS (leisure: campers, caravans, boats) — our taxonomy ──────
const PROSTI_CAS_FIELDS: FilterField[] = [
  COMMON_PRICE, COMMON_YEAR, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  { key: "subcategory", label: "Vrsta", type: "multi", storage: "column", group: "Vrsta",
    options: [
      { value: "kamperi", label: "Kamperi" },
      { value: "kamp-prikolice", label: "Kamp prikolice" },
      { value: "mobilne-kucice", label: "Mobilne kućice" },
      { value: "moduli-za-kamper", label: "Moduli za kamper" },
      { value: "satorske-prikolice", label: "Šatorske prikolice" },
      { value: "plovila", label: "Plovila" },
      { value: "e-bicikli", label: "E-bicikli" },
      { value: "e-skuteri", label: "E-skuteri" },
      { value: "kamping-oprema", label: "Kamping oprema" },
    ] },

  // Tip — po subkategoriji (domenska analiza)
  { key: "boatType", label: "Tip plovila", type: "multi", storage: "attr", group: "Vrsta", scope: ["plovila"],
    options: [
      { value: "gliser", label: "Gliser" },
      { value: "jedrilica", label: "Jedrilica" },
      { value: "gumenjak", label: "Gumenjak" },
      { value: "kabinski", label: "Kabinski" },
      { value: "jahta", label: "Jahta" },
      { value: "radni", label: "Radni brod" },
    ] },
  { key: "camperLayout", label: "Raspored kampera", type: "select", storage: "attr", group: "Vrsta", scope: ["kamperi"],
    options: [
      { value: "poluintegralni", label: "Poluintegralni" },
      { value: "integralni", label: "Integralni" },
      { value: "alkoven", label: "Alkoven" },
      { value: "buscamper", label: "Bus camper / van" },
    ] },
  { key: "eBikeType", label: "Tip e-bicikla", type: "select", storage: "attr", group: "Vrsta", scope: ["e-bicikli"],
    options: [
      { value: "city", label: "Gradski" },
      { value: "mtb", label: "MTB" },
      { value: "trekking", label: "Trekking" },
      { value: "cargo", label: "Cargo" },
      { value: "sklopivi", label: "Sklopivi" },
    ] },

  { key: "sleeps", label: "Broj spavanja", type: "select", storage: "attr", group: "Dimenzije",
    scope: ["kamperi", "kamp-prikolice", "mobilne-kucice", "satorske-prikolice", "plovila"],
    options: [2,3,4,5,6,7,8].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "lengthM", label: "Dužina", type: "range", unit: "m", min: 2, max: 18, step: 0.1, storage: "attr", group: "Dimenzije" },
  { key: "widthM", label: "Širina", type: "range", unit: "m", min: 1.5, max: 5, step: 0.1, storage: "attr", group: "Dimenzije" },
  { key: "heightM", label: "Visina", type: "range", unit: "m", min: 1.5, max: 4, step: 0.1, storage: "attr", group: "Dimenzije" },
  { key: "weightKg", label: "Težina", type: "range", unit: "kg", min: 0, max: 7500, step: 50, storage: "attr", group: "Dimenzije" },
  { key: "axles", label: "Broj osovina", type: "select", storage: "attr", group: "Dimenzije",
    scope: ["kamp-prikolice", "satorske-prikolice"],
    options: [1,2,3].map((n) => ({ value: String(n), label: `${n}` })) },

  // Motor kamper — samo kamperi/mobilne (domenska analiza)
  { key: "km", label: "Kilometri", type: "range", unit: "km", min: 0, max: 500000, step: 5000, storage: "column", group: "Motor",
    scope: ["kamperi", "mobilne-kucice"] },
  { key: "fuel", label: "Gorivo", type: "multi", storage: "column", group: "Motor", scope: ["kamperi", "mobilne-kucice"],
    options: ["Dizel","Benzin"].map(v) },
  { key: "transmission", label: "Mjenjač", type: "multi", storage: "column", group: "Motor", scope: ["kamperi", "mobilne-kucice"],
    options: [v("Ručni"), v("Automatski")] },
  { key: "powerKw", label: "Snaga", type: "range", unit: "kW", min: 0, max: 300, step: 5, storage: "column", group: "Motor",
    scope: ["kamperi", "mobilne-kucice"] },

  // Motor plovila — samo plovila (domenska analiza)
  { key: "numEngines", label: "Broj motora", type: "select", storage: "attr", group: "Motor", scope: ["plovila"],
    options: [1,2,3,4].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "engineType", label: "Tip motora", type: "select", storage: "attr", group: "Motor", scope: ["plovila"],
    options: [
      { value: "vanbrodski", label: "Vanbrodski" },
      { value: "unutarbrodski", label: "Unutarbrodski (inboard)" },
      { value: "z-pogon", label: "Z-pogon (sterndrive)" },
      { value: "bez-motora", label: "Bez motora" },
    ] },
  { key: "engineHp", label: "Snaga motora (HP)", type: "range", unit: "HP", min: 0, max: 600, step: 5, storage: "attr", group: "Motor", scope: ["plovila"] },
  { key: "engineHours", label: "Radni sati motora", type: "range", unit: "h", min: 0, max: 5000, step: 50, storage: "attr", group: "Motor", scope: ["plovila"] },
  { key: "hullMaterial", label: "Materijal trupa", type: "select", storage: "attr", group: "Motor", scope: ["plovila"],
    options: ["GRP","Aluminij","Drvo","Čelik","PVC"].map(v) },
  { key: "boatRegistered", label: "Registriran / upisan", type: "toggle", storage: "attr", group: "Motor", scope: ["plovila"] },

  // E-bicikli / e-skuteri (domenska analiza)
  { key: "motorPowerW", label: "Snaga motora", type: "range", unit: "W", min: 0, max: 5000, step: 50, storage: "attr", group: "Električna", scope: ["e-bicikli", "e-skuteri"] },
  { key: "batteryCapacityWh", label: "Kapacitet baterije", type: "range", unit: "Wh", min: 0, max: 2000, step: 25, storage: "attr", group: "Električna", scope: ["e-bicikli", "e-skuteri"] },
  { key: "rangeKm", label: "Doseg", type: "range", unit: "km", min: 0, max: 200, step: 5, storage: "attr", group: "Električna", scope: ["e-bicikli", "e-skuteri"] },
  { key: "maxSpeedKmh", label: "Maks. brzina", type: "range", unit: "km/h", min: 0, max: 80, step: 1, storage: "attr", group: "Električna", scope: ["e-bicikli", "e-skuteri"] },
  { key: "foldable", label: "Sklopivo", type: "toggle", storage: "attr", group: "Električna", scope: ["e-bicikli", "e-skuteri"] },
  { key: "wheelSizeInch", label: "Promjer kotača", type: "select", storage: "attr", group: "Električna", scope: ["e-bicikli"],
    options: [16,20,24,26,27.5,28,29].map((n) => ({ value: String(n), label: `${n}"` })) },

  // Udobnost (domenska analiza)
  { key: "wc", label: "WC", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "kitchen", label: "Kuhinja", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "shower", label: "Tuš", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "refrigerator", label: "Hladnjak", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "ac", label: "Klima", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "heating", label: "Grijanje", type: "select", storage: "attr", group: "Udobnost",
    options: [
      { value: "plin", label: "Plinsko" },
      { value: "dizel", label: "Dizelsko" },
      { value: "truma", label: "Truma" },
      { value: "webasto", label: "Webasto" },
    ] },
  { key: "solar", label: "Solarni panel", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "awning", label: "Markiza", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "tv", label: "TV", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "boiler", label: "Bojler", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "waterTankL", label: "Spremnik vode", type: "range", unit: "L", min: 0, max: 300, step: 10, storage: "attr", group: "Udobnost" },
  { key: "mover", label: "Mover (manevarski pogon)", type: "toggle", storage: "attr", group: "Udobnost", scope: ["kamp-prikolice"] },

  // Plovila — navigacija (domenska analiza)
  { key: "boatGps", label: "GPS / ploter", type: "toggle", storage: "attr", group: "Dodatne opcije", scope: ["plovila"] },
  { key: "autopilot", label: "Autopilot", type: "toggle", storage: "attr", group: "Dodatne opcije", scope: ["plovila"] },
  { key: "windlass", label: "Sidreno vitlo", type: "toggle", storage: "attr", group: "Dodatne opcije", scope: ["plovila"] },

  // Ostalo (domenska analiza)
  { key: "offerType", label: "Tip ponude", type: "multi", storage: "attr", group: "Ostalo",
    options: [v("prodaja"), v("najam")] },
  { key: "ownership", label: "Vlasništvo", type: "multi", storage: "attr", group: "Ostalo",
    options: [
      { value: "prvi-vlasnik", label: "Prvi vlasnik" },
      { value: "servisna", label: "Servisna evidencija" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
    ] },
  { key: "warranty", label: "Garancija", type: "toggle", storage: "attr", group: "Ostalo" },
];

// ── DIJELOVI (parts and accessories) ───────────────────────────────────
const DIJELOVI_FIELDS: FilterField[] = [
  COMMON_PRICE, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  { key: "subcategory", label: "Vrsta", type: "multi", storage: "column", group: "Vrsta",
    options: [
      { value: "auto-dijelovi", label: "Auto dijelovi" },
      { value: "auto-dodatna-oprema", label: "Auto dodatna oprema" },
      { value: "multimedija", label: "Multimedija" },
      { value: "moto-dijelovi", label: "Moto dijelovi i oprema" },
      { value: "za-gospodarska", label: "Za gospodarska vozila" },
      { value: "za-gradevinske-strojeve", label: "Za građevinske strojeve" },
      { value: "za-poljoprivredne-strojeve", label: "Za poljoprivredne strojeve" },
      { value: "za-vilicare", label: "Za viličare" },
      { value: "servisna-oprema", label: "Servisna oprema" },
      { value: "gume", label: "Gume" },
      { value: "felge", label: "Felge" },
      { value: "ulja-tekucine", label: "Ulja i tekućine" },
    ] },
  { key: "partType", label: "Tip dijela", type: "select", storage: "attr", group: "Detalji",
    options: [
      v("Karoserija"), v("Motor"), v("Mjenjač"), v("Kočnice"),
      v("Ovjes"), v("Elektronika"), v("Interijer"), v("Vanjski"),
      v("Rasvjeta"), v("Ispuh"), v("Filteri"),
    ] },
  { key: "condition2", label: "Stanje dijela", type: "select", storage: "attr", group: "Detalji",
    options: [v("Novo"), v("Rabljeno"), { value: "obnovljeno", label: "Obnovljeno" }] },
  { key: "compatibleWith", label: "Kompatibilno s (marka/model)", type: "text", storage: "attr", group: "Detalji" },
  { key: "oem", label: "OEM / kataloški broj", type: "text", storage: "attr", group: "Detalji" },
  { key: "brandPart", label: "Proizvođač dijela", type: "text", storage: "attr", group: "Detalji" },
  { key: "quantity", label: "Količina (kom)", type: "select", storage: "attr", group: "Detalji",
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
  { key: "shipping", label: "Dostava moguća", type: "toggle", storage: "attr", group: "Ostalo" },
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
  // Stable order: Osnovno → Vrsta → Motor → Karoserija → Specifikacije → Oprema → ...
  const order = [
    "Osnovno", "Vrsta", "Cijena", "Motor", "Karoserija", "Vrata i sjedala", "Boja",
    "Osovine i nosivost", "Nosivost, visina dizanja",
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
