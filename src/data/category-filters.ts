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
  options?: FilterOption[];
  storage: "column" | "attr";
  group?: string; // section header in sidebar (e.g. "Oprema → Sigurnost")
  shared?: boolean;
};

export type CategoryFilters = {
  category: string;
  label: string;
  fields: FilterField[];
};

const v = (s: string) => ({ value: s, label: s });

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
  { key: "doors", label: "Vrata", type: "multi", storage: "column", group: "Karoserija",
    options: [{ value: "3", label: "3 vrata" }, { value: "4", label: "4 vrata" }, { value: "5", label: "5 vrata" }] },
  { key: "seats", label: "Sjedala", type: "multi", storage: "column", group: "Karoserija",
    options: [2,4,5,7,9].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "color", label: "Boja vanjska", type: "multi", storage: "column", group: "Boja",
    options: ["Crna","Bijela","Siva","Srebrna","Plava","Crvena","Zelena","Smeđa","Žuta","Narančasta"].map(v) },

  // EV-specific (attr)
  { key: "evRangeKm", label: "Doseg (EV)", type: "range", unit: "km", min: 0, max: 800, step: 25, storage: "attr", group: "Električna" },
  { key: "batteryKwh", label: "Baterija", type: "range", unit: "kWh", min: 0, max: 150, step: 5, storage: "attr", group: "Električna" },
  { key: "batteryCertificate", label: "Certifikat baterije", type: "toggle", storage: "attr", group: "Električna" },
  { key: "heatPump", label: "Toplinska crpka", type: "toggle", storage: "attr", group: "Električna" },

  // Climate (attr.multi)
  { key: "climate", label: "Klima", type: "multi", storage: "attr", group: "Oprema",
    options: [
      { value: "klima", label: "Klima uređaj" },
      { value: "autoklima", label: "Automatska klima" },
      { value: "grijanje-mirovanje", label: "Grijanje u mirovanju" },
    ] },
  // Interior (attr.multi) — 21 options
  { key: "interior", label: "Interijer", type: "multi", storage: "attr", group: "Oprema",
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
  { key: "safety", label: "Sigurnost", type: "multi", storage: "attr", group: "Oprema",
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
  { key: "parking", label: "Parkiranje", type: "multi", storage: "attr", group: "Oprema",
    options: [
      { value: "parkirni-asistent", label: "Parkirni asistent" },
      { value: "kamera", label: "Kamera unatrag" },
      { value: "senzori", label: "Senzori parkiranja" },
      { value: "kamera-360", label: "Kamera 360°" },
    ] },
  // Other equipment (attr.multi)
  { key: "otherEquipment", label: "Ostalo", type: "multi", storage: "attr", group: "Oprema",
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
  // Damage state (attr.select) — 6 options
  { key: "damageState", label: "Stanje karoserije", type: "select", storage: "attr", group: "Povijest",
    options: [
      { value: "bez-stete", label: "Bez štete" },
      { value: "lakse-popravljeno", label: "Lakša šteta popravljena" },
      { value: "veca-popravljena", label: "Veća šteta popravljena" },
      { value: "ostecen-prednji", label: "Oštećen prednji dio" },
      { value: "ostecen-straznji", label: "Oštećen stražnji dio" },
      { value: "ostecen-bocni", label: "Oštećen bočni dio" },
    ] },
  { key: "floodState", label: "Poplavljen", type: "select", storage: "attr", group: "Povijest",
    options: [
      { value: "ne", label: "Ne" },
      { value: "potencijalno", label: "Potencijalno" },
      { value: "da", label: "Da, sanirano" },
    ] },

  // Color type (attr.multi)
  { key: "colorType", label: "Tip boje", type: "multi", storage: "attr", group: "Boja",
    options: [v("metalik"), v("mat")] },
  { key: "upholsteryColor", label: "Boja unutrašnjosti", type: "select", storage: "attr", group: "Boja",
    options: ["Crna","Bež","Smeđa","Siva","Bijela","Crvena"].map(v) },

  // Misc (attr.toggle / attr.select)
  { key: "warranty", label: "Garancija", type: "toggle", storage: "attr", group: "Ostalo" },
  { key: "warrantyProgram", label: "Program garancije", type: "select", storage: "attr", group: "Ostalo",
    options: [
      { value: "bmw-premium-selection", label: "BMW Premium Selection" },
      { value: "mercedes-young-classic", label: "Mercedes Young Classic" },
    ] },
  { key: "inStock", label: "Na zalihi", type: "toggle", storage: "attr", group: "Ostalo" },
  { key: "adAge", label: "Starost oglasa", type: "select", storage: "attr", group: "Ostalo",
    options: [
      { value: "1d", label: "Posljednji dan" },
      { value: "3d", label: "Posljednja 3 dana" },
      { value: "7d", label: "Posljednji tjedan" },
      { value: "30d", label: "Posljednji mjesec" },
    ] },
  { key: "offerType", label: "Tip ponude", type: "multi", storage: "attr", group: "Ostalo",
    options: [v("prodaja"), v("najam")] },
  { key: "oldtimer", label: "Oldtimer", type: "toggle", storage: "attr", group: "Ostalo" },
  { key: "slidingDoors", label: "Klizna vrata", type: "toggle", storage: "attr", group: "Ostalo" },
];

// ── MOTO — full 26-field taxonomy from avto.net ────────────────────────
const MOTO_FIELDS: FilterField[] = [
  COMMON_PRICE, COMMON_YEAR, COMMON_KM, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  { key: "subcategory", label: "Vrsta vozila", type: "multi", storage: "column", group: "Vrsta",
    options: [
      { value: "motocikl", label: "Motocikl" },
      { value: "skuter", label: "Skuter" },
      { value: "moped", label: "Moped" },
      { value: "atv-utv", label: "ATV / UTV" },
      { value: "minimoto", label: "Minimoto" },
      { value: "oldtimer", label: "Oldtimer" },
      { value: "gokart", label: "Go-kart" },
      { value: "motorne-sanke", label: "Motorne sanke" },
      { value: "e-skuter", label: "E-skuter" },
      { value: "e-bicikl", label: "E-bicikl" },
      { value: "e-moto", label: "E-moto" },
    ] },
  { key: "motoCategory", label: "Stil", type: "multi", storage: "attr", group: "Vrsta",
    options: [
      v("Sport"), v("Chopper"), v("Tourer"),
      { value: "naked", label: "Naked bike" },
      v("Enduro"), v("Supermoto"), v("Trial"), v("Cross"),
    ] },

  { key: "engineCc", label: "Obujam motora", type: "range", unit: "cm³", min: 0, max: 2500, step: 50, storage: "column", group: "Motor" },
  { key: "powerKw", label: "Snaga", type: "range", unit: "kW", min: 0, max: 220, step: 1, storage: "column", group: "Motor" },
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

  { key: "licenceClass", label: "Vozačka kategorija", type: "multi", storage: "attr", group: "Pravno",
    options: ["AM","A1","A2","A","B"].map(v) },

  { key: "color", label: "Boja", type: "multi", storage: "column", group: "Boja",
    options: ["Crna","Bijela","Crvena","Plava","Zelena","Žuta","Narančasta","Siva","Srebrna"].map(v) },
  { key: "colorType", label: "Tip boje", type: "multi", storage: "attr", group: "Boja",
    options: [v("metalik"), v("mat")] },

  { key: "motoOptions", label: "Oprema", type: "multi", storage: "attr", group: "Oprema",
    options: [
      { value: "abs", label: "ABS" },
      { value: "el-ovjes", label: "Električno podesiv ovjes" },
      { value: "tempomat", label: "Tempomat" },
      { value: "navigacija", label: "Navigacija" },
      { value: "prvi-vlasnik", label: "Prvi vlasnik" },
      { value: "servisna", label: "Servisna knjižica" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
      { value: "zamjena", label: "Moguća zamjena" },
    ] },

  { key: "damageState", label: "Stanje karoserije", type: "select", storage: "attr", group: "Povijest",
    options: [
      { value: "bez-stete", label: "Bez štete" },
      { value: "lakse-popravljeno", label: "Lakša šteta popravljena" },
      { value: "veca-popravljena", label: "Veća šteta popravljena" },
    ] },
  { key: "warranty", label: "Garancija", type: "toggle", storage: "attr", group: "Ostalo" },
  { key: "offerType", label: "Tip ponude", type: "multi", storage: "attr", group: "Ostalo",
    options: [v("prodaja"), v("najam")] },
  { key: "oldtimer", label: "Oldtimer", type: "toggle", storage: "attr", group: "Ostalo" },
  { key: "inStock", label: "Na zalihi", type: "toggle", storage: "attr", group: "Ostalo" },
];

// ── GOSPODARSKA — full 34-field taxonomy from avto.net ─────────────────
const GOSPODARSKA_FIELDS: FilterField[] = [
  COMMON_PRICE, COMMON_YEAR, COMMON_KM, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  { key: "subcategory", label: "Vrsta vozila", type: "multi", storage: "column", group: "Vrsta",
    options: [
      { value: "dostavna", label: "Dostavna vozila" },
      { value: "kamioni", label: "Kamioni" },
      { value: "autobusi", label: "Autobusi" },
      { value: "prikolice", label: "Teretne prikolice" },
      { value: "utv", label: "UTV vozila" },
      { value: "najam", label: "Ponude za najam" },
    ] },
  { key: "bodyType", label: "Karoserija", type: "multi", storage: "column", group: "Vrsta",
    options: [
      v("Furgon"), v("Kombi"), { value: "kamionet", label: "Kamionet" },
      { value: "sasija-kabina", label: "Šasija s kabinom" },
      { value: "sasija-nadgradnja", label: "Šasija s nadgradnjom" },
      { value: "pickup", label: "Pick up" },
    ] },

  { key: "priceVat", label: "PDV", type: "select", storage: "attr", group: "Cijena",
    options: [
      { value: "brutto", label: "S PDV-om" },
      { value: "netto", label: "Bez PDV-a" },
    ] },

  { key: "fuel", label: "Gorivo", type: "multi", storage: "column", group: "Motor",
    options: ["Dizel","Benzin","Hibrid","Električni","Plin"].map(v) },
  { key: "transmission", label: "Mjenjač", type: "multi", storage: "column", group: "Motor",
    options: [v("Ručni"), v("Automatski")] },
  { key: "powerKw", label: "Snaga", type: "range", unit: "kW", min: 0, max: 600, step: 5, storage: "column", group: "Motor" },
  { key: "engineCc", label: "Obujam motora", type: "range", unit: "cm³", min: 0, max: 16000, step: 100, storage: "column", group: "Motor" },
  { key: "euroNorm", label: "Emisijska norma", type: "select", storage: "attr", group: "Motor",
    options: ["EURO 3","EURO 4","EURO 5","EURO 6","EURO 6d","EURO 7"].map(v) },

  { key: "seats", label: "Broj sjedala", type: "range", min: 1, max: 80, step: 1, storage: "column", group: "Karoserija" },
  { key: "rearDoors", label: "Stražnja vrata", type: "select", storage: "attr", group: "Karoserija",
    options: [
      { value: "krilna", label: "Krilna vrata" },
      { value: "rolo", label: "Roleta" },
      { value: "klizna", label: "Klizna" },
    ] },
  { key: "sideDoors", label: "Bočna vrata", type: "select", storage: "attr", group: "Karoserija",
    options: [
      { value: "klizna-l", label: "Klizna lijeva" },
      { value: "klizna-d", label: "Klizna desna" },
      { value: "obje", label: "Obje klizne" },
    ] },

  { key: "gvwKg", label: "Ukupna masa", type: "range", unit: "kg", min: 0, max: 60000, step: 100, storage: "attr", group: "Specifikacije" },
  { key: "payloadKg", label: "Korisna nosivost", type: "range", unit: "kg", min: 0, max: 30000, step: 100, storage: "attr", group: "Specifikacije" },
  { key: "axles", label: "Broj osovina", type: "select", storage: "attr", group: "Specifikacije",
    options: [2,3,4,5,6].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "wheelbaseMm", label: "Međuosovinski razmak", type: "range", unit: "mm", min: 2000, max: 7500, step: 50, storage: "attr", group: "Specifikacije" },

  // Equipment groups (same as AUTO trimmed)
  { key: "climate", label: "Klima", type: "multi", storage: "attr", group: "Oprema",
    options: [
      { value: "klima", label: "Klima uređaj" },
      { value: "autoklima", label: "Automatska klima" },
      { value: "grijanje-mirovanje", label: "Grijanje u mirovanju" },
    ] },
  { key: "interior", label: "Interijer", type: "multi", storage: "attr", group: "Oprema",
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
  { key: "safety", label: "Sigurnost", type: "multi", storage: "attr", group: "Oprema",
    options: [
      { value: "abs", label: "ABS" },
      { value: "esp", label: "ESP" },
      { value: "airbag", label: "Zračni jastuci" },
      { value: "tempomat", label: "Tempomat" },
      { value: "led", label: "LED svjetla" },
      { value: "auto-cocenje", label: "Automatsko kočenje" },
    ] },
  { key: "parking", label: "Parkiranje", type: "multi", storage: "attr", group: "Oprema",
    options: [
      { value: "kamera", label: "Kamera unatrag" },
      { value: "senzori", label: "Senzori parkiranja" },
    ] },
  { key: "otherEquipment", label: "Ostalo", type: "multi", storage: "attr", group: "Oprema",
    options: [
      { value: "alu-felge", label: "Alu felge" },
      { value: "4x4", label: "Pogon 4x4" },
      { value: "vucna", label: "Vučna kuka" },
      { value: "produljeni-meduosovinski", label: "Produljen međuosovinski razmak" },
      { value: "povisen-krov", label: "Povišen krov kabine" },
      { value: "retarder", label: "Retarder" },
    ] },
  { key: "ownership", label: "Vlasništvo", type: "multi", storage: "attr", group: "Povijest",
    options: [
      { value: "prvi-vlasnik", label: "Prvi vlasnik" },
      { value: "servisna", label: "Servisna knjižica" },
      { value: "hr-podrijetlo", label: "Hrvatsko podrijetlo" },
      { value: "garazirano", label: "Garažirano" },
    ] },
  { key: "damageState", label: "Stanje", type: "select", storage: "attr", group: "Povijest",
    options: [
      { value: "bez-stete", label: "Bez štete" },
      { value: "lakse-popravljeno", label: "Lakša šteta popravljena" },
      { value: "veca-popravljena", label: "Veća šteta popravljena" },
    ] },

  { key: "color", label: "Boja", type: "multi", storage: "column", group: "Boja",
    options: ["Bijela","Plava","Crvena","Crna","Siva","Žuta","Zelena","Narančasta"].map(v) },
];

// ── MEHANIZACIJA (machinery) — auto.net stub, our taxonomy ─────────────
const MEHANIZACIJA_FIELDS: FilterField[] = [
  COMMON_PRICE, COMMON_YEAR, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  { key: "subcategory", label: "Vrsta", type: "multi", storage: "column", group: "Vrsta",
    options: [
      { value: "poljoprivredni-strojevi", label: "Poljoprivredni strojevi" },
      { value: "vilicari", label: "Viličari" },
      { value: "sumarski-strojevi", label: "Šumarski strojevi" },
      { value: "komunalni-strojevi", label: "Komunalni strojevi" },
      { value: "gradevinski-strojevi", label: "Građevinski strojevi" },
      { value: "najam", label: "Ponude za najam" },
    ] },
  { key: "machineType", label: "Tip stroja", type: "multi", storage: "attr", group: "Vrsta",
    options: [
      v("Traktor"), v("Kombajn"), v("Bager"), v("Utovarivač"),
      { value: "rovokopac", label: "Rovokopač" },
      { value: "valjak", label: "Valjak" },
      { value: "dizalica", label: "Dizalica" },
      { value: "cistilica", label: "Čistilica" },
      { value: "prikljucni", label: "Priključni stroj" },
    ] },
  { key: "fuel", label: "Pogon", type: "multi", storage: "column", group: "Motor",
    options: ["Dizel","Električni","Hibrid","Plin"].map(v) },
  { key: "transmission", label: "Mjenjač", type: "multi", storage: "column", group: "Motor",
    options: [v("Ručni"), v("Automatski")] },
  { key: "powerKw", label: "Snaga", type: "range", unit: "kW", min: 0, max: 600, step: 5, storage: "column", group: "Motor" },
  { key: "powerHp", label: "Snaga", type: "range", unit: "KS", min: 0, max: 800, step: 5, storage: "attr", group: "Motor" },

  { key: "operatingHours", label: "Radni sati", type: "range", unit: "h", min: 0, max: 30000, step: 100, storage: "attr", group: "Specifikacije" },
  { key: "weightKg", label: "Težina", type: "range", unit: "kg", min: 0, max: 50000, step: 100, storage: "attr", group: "Specifikacije" },
  { key: "bucketCapacity", label: "Kapacitet žlice", type: "range", unit: "m³", min: 0, max: 5, step: 0.1, storage: "attr", group: "Specifikacije" },
  { key: "liftHeightM", label: "Visina dizanja", type: "range", unit: "m", min: 0, max: 15, step: 0.1, storage: "attr", group: "Specifikacije" },
  { key: "liftCapacityKg", label: "Nosivost", type: "range", unit: "kg", min: 0, max: 30000, step: 100, storage: "attr", group: "Specifikacije" },
  { key: "workingWidthM", label: "Radna širina", type: "range", unit: "m", min: 0, max: 12, step: 0.1, storage: "attr", group: "Specifikacije" },
  { key: "reachM", label: "Doseg", type: "range", unit: "m", min: 0, max: 25, step: 0.5, storage: "attr", group: "Specifikacije" },

  { key: "drive4x4", label: "Pogon 4x4", type: "toggle", storage: "attr", group: "Oprema" },
  { key: "cabin", label: "Klimatizirana kabina", type: "toggle", storage: "attr", group: "Oprema" },
  { key: "frontLoader", label: "Prednji utovarivač", type: "toggle", storage: "attr", group: "Oprema" },
  { key: "gps", label: "GPS / Telematika", type: "toggle", storage: "attr", group: "Oprema" },
  { key: "ac", label: "Klima uređaj", type: "toggle", storage: "attr", group: "Oprema" },
  { key: "pto", label: "Priključno vratilo (PTO)", type: "toggle", storage: "attr", group: "Oprema" },
  { key: "quickCoupler", label: "Brza spojka", type: "toggle", storage: "attr", group: "Oprema" },

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

  { key: "sleeps", label: "Broj spavanja", type: "select", storage: "attr", group: "Dimenzije",
    options: [2,3,4,5,6,7,8].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "lengthM", label: "Dužina", type: "range", unit: "m", min: 2, max: 18, step: 0.1, storage: "attr", group: "Dimenzije" },
  { key: "widthM", label: "Širina", type: "range", unit: "m", min: 1.5, max: 5, step: 0.1, storage: "attr", group: "Dimenzije" },
  { key: "heightM", label: "Visina", type: "range", unit: "m", min: 1.5, max: 4, step: 0.1, storage: "attr", group: "Dimenzije" },

  { key: "engineHp", label: "Snaga motora (HP)", type: "range", unit: "HP", min: 0, max: 600, step: 5, storage: "attr", group: "Motor" },
  { key: "engineHours", label: "Radni sati motora", type: "range", unit: "h", min: 0, max: 5000, step: 50, storage: "attr", group: "Motor" },
  { key: "hullMaterial", label: "Materijal trupa", type: "select", storage: "attr", group: "Motor",
    options: ["GRP","Aluminij","Drvo","Čelik","PVC"].map(v) },

  { key: "wc", label: "WC", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "kitchen", label: "Kuhinja", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "shower", label: "Tuš", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "ac", label: "Klima", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "heating", label: "Grijanje", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "solar", label: "Solarni panel", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "awning", label: "Markiza", type: "toggle", storage: "attr", group: "Udobnost" },
  { key: "tv", label: "TV", type: "toggle", storage: "attr", group: "Udobnost" },
];

// ── DIJELOVI (parts and accessories) ───────────────────────────────────
const DIJELOVI_FIELDS: FilterField[] = [
  COMMON_PRICE, COMMON_COUNTY, COMMON_SELLER, COMMON_AGE,

  { key: "subcategory", label: "Vrsta", type: "multi", storage: "column", group: "Vrsta",
    options: [
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

  // Gume (tires)
  { key: "tireWidth", label: "Širina gume", type: "select", storage: "attr", group: "Gume",
    options: [155,165,175,185,195,205,215,225,235,245,255,265,275,285,295,305].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "tireProfile", label: "Profil gume", type: "select", storage: "attr", group: "Gume",
    options: [30,35,40,45,50,55,60,65,70,75,80].map((n) => ({ value: String(n), label: `${n}` })) },
  { key: "tireDiameter", label: "Promjer (col)", type: "select", storage: "attr", group: "Gume",
    options: [13,14,15,16,17,18,19,20,21,22].map((n) => ({ value: String(n), label: `R${n}` })) },
  { key: "tireSeason", label: "Sezona", type: "multi", storage: "attr", group: "Gume",
    options: [v("Ljetne"), v("Zimske"), { value: "all-season", label: "Cjelogodišnje" }] },
  { key: "tireType", label: "Vrsta", type: "multi", storage: "attr", group: "Gume",
    options: [{ value: "osobne", label: "Osobne" }, { value: "teretne", label: "Teretne" }, v("Moto"), { value: "off-road", label: "Off-road" }] },

  // Felge (wheels)
  { key: "rimSize", label: "Promjer felge (col)", type: "select", storage: "attr", group: "Felge",
    options: [13,14,15,16,17,18,19,20,21,22].map((n) => ({ value: String(n), label: `${n}"` })) },
  { key: "rimBoltPattern", label: "Razmak rupa (PCD)", type: "select", storage: "attr", group: "Felge",
    options: ["4x100","4x108","5x100","5x108","5x112","5x114.3","5x120","6x139.7"].map(v) },
  { key: "rimMaterial", label: "Materijal", type: "multi", storage: "attr", group: "Felge",
    options: [{ value: "alu", label: "Aluminij" }, { value: "celik", label: "Čelik" }] },

  // Ulja i tekućine (oils/fluids)
  { key: "fluidType", label: "Vrsta tekućine", type: "select", storage: "attr", group: "Tekućine",
    options: [
      { value: "motorno-ulje", label: "Motorno ulje" },
      { value: "ulje-mjenjac", label: "Ulje za mjenjač" },
      { value: "rashladna", label: "Rashladna tekućina" },
      { value: "kocnice", label: "Kočiona tekućina" },
      { value: "adblue", label: "AdBlue" },
    ] },
  { key: "viscosity", label: "Viskozitet", type: "select", storage: "attr", group: "Tekućine",
    options: ["0W-20","0W-30","5W-30","5W-40","10W-40","15W-40"].map(v) },

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
    "Osnovno", "Vrsta", "Cijena", "Motor", "Karoserija", "Boja",
    "Specifikacije", "Električna", "Oprema", "Pravno", "Povijest",
    "Udobnost", "Dimenzije", "Detalji", "Gume", "Felge", "Tekućine", "Ostalo",
  ];
  const sorted: Array<{ name: string; fields: FilterField[] }> = [];
  for (const name of order) if (groups.has(name)) sorted.push({ name, fields: groups.get(name)! });
  for (const [name, fs] of groups) if (!order.includes(name)) sorted.push({ name, fields: fs });
  return sorted;
}
