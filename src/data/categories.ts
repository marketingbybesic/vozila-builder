import type { CarMake } from "@/lib/types";
import { MAKES as AUTO_MAKES } from "./makes";
import { MOTO_MAKES, MINIMOTO_MAKES, GOKART_MAKES, SANKE_MAKES, EROMOBIL_MAKES, EBICIKL_MAKES } from "./makes-moto";
import { GOSPODARSKA_MAKES } from "./makes-gospodarska";
import { ATV_MAKES, UTV_MAKES } from "./makes-atv";
import { PROSTI_CAS_KAMPERI_MAKES, PROSTI_CAS_KAMP_PRIKOLICE_MAKES, PROSTI_CAS_MOBILNE_KUCICE_MAKES, PROSTI_CAS_MODULI_MAKES, PROSTI_CAS_SATORSKE_MAKES, PROSTI_CAS_KROVNI_SATORI_MAKES, PROSTI_CAS_NAJAM_MAKES } from "./makes-prosti-cas";
import {
  GOSPODARSKA_DOSTAVNA_MAKES,
  GOSPODARSKA_KAMIONI_MAKES,
  GOSPODARSKA_PRIKOLICE_MAKES,
  GOSPODARSKA_AUTOBUSI_MAKES,
} from "./makes-gospodarska-sub";
import {
  MEHANIZACIJA_VILICARI_MAKES,
  MEHANIZACIJA_GRADEVINSKI_MAKES,
  MEHANIZACIJA_POLJOPRIVREDNI_MAKES,
  MEHANIZACIJA_SUMARSKI_MAKES,
  MEHANIZACIJA_KOMUNALNI_MAKES,
} from "./makes-mehanizacija";

export type Subcategory = {
  slug: string;
  name: string; // Croatian
  children?: Subcategory[]; // 2. nivo (avto.net "Rezervni deli" logika, npr. dijelovi)
  /** Karlo 31.08.2026: slikoviti odabir podkategorije za Dijelovi i oprema
   * (SubcategoryIconGrid) — samo top-level DIJELOVI_SUBS ga imaju, ostale
   * kategorije i dalje koriste izbornik bez ikone. */
  icon?: string;
};

export type Category = {
  slug: string;
  name: string; // Croatian display
  subLabel?: string; // alternativni naslov u submenu (npr. "Auto oglasi" za auto)
  icon: "car" | "bike" | "truck" | "excavator" | "camper" | "brakedisc";
  active: boolean; // false = "Uskoro" overlay
  subcategories: Subcategory[];
  // Makes are populated from per-category data files. For "auto" we reuse the
  // existing MAKES[] in makes.ts. Other categories use a small starter list
  // until full scraped data lands.
  makes: { slug: string; name: string }[];
};

const SLUG = (s: string) =>
  s
    .toLowerCase()
    .replace(/č|ć/g, "c")
    .replace(/š/g, "s")
    .replace(/ž/g, "z")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// Podkategorije po rubrikama (hrvatski).

const AUTO_SUBS: Subcategory[] = [
  // "Auto oglasi" = primary entry → opens advanced auto search (avto.net logic).
  // Novi/Rabljeni removed as separate subcats; new/used is now a filter (condition).
  // Karlo 31.07: "Auto oglasi - Napredno" → "Osobni auto". Prije je ovo bila
  // ULAZNA TOČKA za naprednu pretragu (izuzimala se iz svih izbornika i filtera),
  // sad je PRAVA podkategorija — obični osobni automobili. Slug ostaje
  // `auto-oglasi` da postojeći linkovi i bookmarkovi ne puknu.
  { slug: "auto-oglasi", name: "Osobni auto" },
  { slug: "trkaci", name: "Trkaći auti" },
  { slug: "eko", name: "Eko (hibrid + EV)" },
  { slug: "luksuzni", name: "Luksuzni" },
  { slug: "oldtimer", name: "Oldtimer" },
  { slug: "ostecen-u-kvaru", name: "Oštećeni i u kvaru" },
  { slug: "najam", name: "Ponude za najam" },
  { slug: "auto-ostalo", name: "Ostalo" },
];

const MOTO_SUBS: Subcategory[] = [
  { slug: "motocikl", name: "Motocikl", icon: "route" },
  { slug: "skuter", name: "Skuter", icon: "gauge" },
  { slug: "moped", name: "Moped", icon: "circledot" },
  { slug: "atv-utv", name: "ATV / UTV", icon: "mountain" },
  { slug: "minimoto", name: "Minimoto", icon: "rocket" },
  { slug: "oldtimer", name: "Oldtimer", icon: "history" },
  { slug: "gokart", name: "Go-kart", icon: "flag" },
  { slug: "motorne-sanke", name: "Motorne sanke", icon: "mountainsnow" },
  // ⚠️ Karlo 13.08.2026 (st. 3): naziv "E-skuter" → "E-romobil". SLUG ostaje
  // `e-skuter` — mijenjanje sluga bi izbacilo postojeće oglase iz filtera
  // (enum drift) i razbilo `scope` u category-filters.ts.
  { slug: "e-skuter", name: "E-romobil", icon: "zap" },
  { slug: "e-bicikl", name: "E-bicikl", icon: "bike" },
  // ⚠️ Karlo 22.08.2026: podkategorija "E-moto" MAKNUTA na njegov zahtjev.
  // Postojeći električni motocikli prebačeni u "motocikl" (DB skripta
  // fix-makes-2026-08-22.mts). Scope zapisi u category-filters.ts zadržani
  // bezopasno — ne referenciraju podkategoriju koja se više ne nudi.
  { slug: "najam", name: "Ponude za najam", icon: "calendardays" },
  { slug: "moto-ostalo", name: "Ostalo", icon: "box" },
];

const GOSPODARSKA_SUBS: Subcategory[] = [
  { slug: "dostavna", name: "Dostavna vozila", icon: "package" },
  { slug: "kamioni", name: "Kamioni", icon: "truck" },
  { slug: "autobusi", name: "Autobusi", icon: "bus" },
  { slug: "prikolice", name: "Teretne prikolice", icon: "container" },
  { slug: "utv", name: "UTV vozila", icon: "mountain" },
  { slug: "najam", name: "Ponude za najam", icon: "calendardays" },
  { slug: "gospodarska-ostalo", name: "Ostalo", icon: "box" },
];

const MEHANIZACIJA_SUBS: Subcategory[] = [
  { slug: "poljoprivredni-strojevi", name: "Poljoprivredni strojevi", icon: "tractor" },
  { slug: "vilicari", name: "Viličari", icon: "forklift" },
  { slug: "sumarski-strojevi", name: "Šumarski strojevi", icon: "treepine" },
  { slug: "komunalni-strojevi", name: "Komunalni strojevi", icon: "trash2" },
  { slug: "gradevinski-strojevi", name: "Građevinski strojevi", icon: "cone" },
  { slug: "najam", name: "Ponude za najam", icon: "calendardays" },
  { slug: "mehanizacija-ostalo", name: "Ostalo", icon: "box" },
];

const PROSTI_CAS_SUBS: Subcategory[] = [
  { slug: "kamperi", name: "Kamperi", icon: "caravan" },
  { slug: "kamp-prikolice", name: "Kamp prikolice", icon: "container" },
  { slug: "mobilne-kucice", name: "Mobilne kućice", icon: "house" },
  { slug: "moduli-za-kamper", name: "Moduli za kamper", icon: "layers" },
  { slug: "satorske-prikolice", name: "Šatorske prikolice", icon: "tent" },
  // Karlo 25.08.2026: nova rubrika, postavljena 1:1 kao šatorske prikolice
  // (ista polja u shemi, vlastiti popis marki, bez polja "Model").
  { slug: "krovni-satori", name: "Krovni šatori", icon: "tenttree" },
  // ⚠️ Karlo 31.08.2026: "Plovila" vraćeno — st.25 (30.08.) ga je maknuo iz
  // pretrage/podkategorija, Karlo odmah zatražio povratak ("vrati kako je
  // bilo"). Ništa nije trebalo obnavljati — schema/marke/makesForSub i 22
  // aktivna oglasa nikad nisu ni bili dirani, samo ovaj zapis.
  { slug: "plovila", name: "Plovila", icon: "ship" },
  { slug: "e-bicikli", name: "E-bicikli", icon: "bike" },
  // ⚠️ Karlo 25.08.2026: preimenovano "E-skuteri" → "E-romobil"; rubrika mora
  // biti IDENTIČNA onoj u Motu (moto/e-skuter) — ista polja, iste marke, isti
  // Model. SLUG ostaje "e-skuteri" (postojeći oglasi i linkovi).
  { slug: "e-skuteri", name: "E-romobil", icon: "zap" },
  // Karlo 30.07: "Kamping oprema" → "Oprema za kampere i kamping" + 2. nivo.
  // Jedina rubrika u SLOBODNOM VREMENU s djecom (ostale su ravne) — drill-down
  // radi isto kao u DIJELOVIMA (`subChildHref` → `a.vrsta=<slug>`).
  {
    slug: "kamping-oprema",
    name: "Oprema za kampere i kamping",
    icon: "backpack",
    children: [
      { slug: "kamper-dijelovi-nadogradnje", name: "Dijelovi i nadogradnje za kampere", icon: "wrench" },
      { slug: "kamper-grijanje-plin", name: "Grijanje, hlađenje i plin", icon: "flame" },
      { slug: "kamper-voda-sanitarije", name: "Voda i sanitarije", icon: "droplets" },
      { slug: "kamper-struja-solari", name: "Struja, solari i autonomija", icon: "sun" },
      { slug: "kamper-tende-predsatori", name: "Tende, predšatori i vanjska oprema", icon: "tent" },
      { slug: "kamper-namjestaj", name: "Namještaj i oprema za kampiranje", icon: "armchair" },
      { slug: "kamping-oprema-ostalo", name: "Ostalo", icon: "box" },
    ],
  },
  // Karlo 25.08.2026: "Ponude za najam" i u Slobodnom vremenu — ista rubrika
  // kao u Moto/Gospodarska/Mehanizacija (vlastiti oglasi, polja kao mobilne
  // kućice jer je to najbliža rubrika u kategoriji).
  { slug: "najam", name: "Ponude za najam", icon: "calendardays" },
  { slug: "prosti-cas-ostalo", name: "Ostalo", icon: "box" },
];

// DIJELOVI I OPREMA — 2-nivoa struktura (avto.net "Rezervni deli in oprema").
// Svaka gornja kategorija ima svoje podkategorije koje se otvaraju u submenu.
const DIJELOVI_SUBS: Subcategory[] = [
  {
    slug: "auto-dijelovi",
    name: "Auto dijelovi",
    icon: "wrench",
    children: [
      { slug: "motor-dijelovi", name: "Motor, dijelovi motora i brtve" },
      { slug: "mjenjac-transmisija", name: "Mjenjač i prijenos" },
      { slug: "kocnice", name: "Kočnice" },
      { slug: "ovjes-amortizeri", name: "Ovjes i amortizeri" },
      { slug: "upravljac-volan", name: "Sustav upravljanja" },
      { slug: "ispuh-katalizator", name: "Ispušni sistemi serijski" },
      { slug: "hladenje-grijanje", name: "Hlađenje i grijanje" },
      { slug: "elektrika-senzori", name: "Elektrika i kompjuter" },
      { slug: "akumulatori", name: "Akumulatori" },
      { slug: "karoserija-limarija", name: "Karoserija i limarija" },
      { slug: "stakla-retrovizori", name: "Stakla i retrovizori" },
      { slug: "svjetla-zarulje", name: "Svjetla i žarulje" },
      { slug: "filteri", name: "Filteri" },
      { slug: "gorivo-sustav", name: "Sustav goriva" },
      { slug: "unutrasnjost", name: "Dijelovi unutrašnjosti" },
      { slug: "auto-dijelovi-ostalo", name: "Ostalo" },
    ],
  },
  {
    slug: "auto-dodatna-oprema",
    name: "Auto dodatna oprema",
    icon: "package",
    children: [
      { slug: "krovni-nosaci", name: "Krovni nosači, kutije i nosači bicikala" },
      { slug: "ratkape-oprema", name: "Ratkape" },
      { slug: "vanjski-styling", name: "Vanjski styling i body kit" },
      { slug: "sportski-ovjes-kocnice", name: "Sportski ovjes i kočnice" },
      { slug: "racing-oprema", name: "Racing oprema" },
      { slug: "ispuh-sportski", name: "Ispušni sistemi sportski" },
      { slug: "tuning-motora", name: "Tuning motora i dijagnostika" },
      { slug: "tuning-svjetla", name: "Tuning svjetla i LED rasvjeta" },
      { slug: "unutarnja-oprema", name: "Unutarnja oprema" },
      { slug: "auto-kozmetika", name: "Auto kozmetika" },
      { slug: "presvlake-tepisi", name: "Presvlake i tepisi" },
      { slug: "oprema-za-snijeg", name: "Oprema za snijeg" },
      { slug: "alarmi-zastita", name: "Alarmi i zaštita" },
      { slug: "djecja-sjedalica", name: "Dječje sjedalice" },
      { slug: "obavezna-oprema", name: "Obavezna i sigurnosna oprema" },
      // Karlo 30.07: naknadno dodano, izričito ISPRED "Ostalo".
      { slug: "auto-kuke", name: "Auto kuke" },
      { slug: "auto-oprema-ostalo", name: "Ostalo" },
    ],
  },
  {
    slug: "multimedija",
    name: "Multimedija",
    icon: "speaker",
    children: [
      { slug: "radio-navigacija", name: "Autoradio i navigacija" },
      { slug: "android-carplay", name: "Android / CarPlay uređaji" },
      { slug: "zvucnici-subwoofer", name: "Zvučnici i subwooferi" },
      { slug: "pojacala-procesori", name: "Pojačala i procesori zvuka" },
      { slug: "kamere-parkiranje", name: "Kamere, dash-cam i senzori" },
      { slug: "kablovi-adapteri", name: "Kablovi, adapteri i okviri" },
      { slug: "antene", name: "Antene i prijemnici" },
      { slug: "ekrani-zabava", name: "Ekrani i zabava na stražnjim sjedalima" },
      { slug: "multimedija-ostalo", name: "Ostala auto akustika i oprema" },
    ],
  },
  {
    slug: "moto-dijelovi",
    name: "Moto dijelovi i oprema",
    icon: "bike",
    children: [
      { slug: "moto-motor", name: "Motor i mehanički dijelovi" },
      { slug: "moto-pogon", name: "Pogon (lanac, lančanici, remen i varijatori)" },
      { slug: "moto-kocnice", name: "Kočnice i ovjes" },
      { slug: "moto-ispuh", name: "Ispušni sustavi" },
      { slug: "moto-elektrika", name: "Elektrika, paljenje i akumulatori" },
      { slug: "moto-oplate", name: "Oplate, plastike i karoserija" },
      { slug: "moto-gume", name: "Moto gume" },
      { slug: "kacige-komunikatori", name: "Kacige i komunikatori" },
      { slug: "moto-odjeca", name: "Moto odjeća i zaštita" },
      { slug: "moto-obuca-rukavice", name: "Moto obuća i rukavice" },
      { slug: "koferi-torbe", name: "Koferi, torbe i nosači" },
      { slug: "atv-quad-dijelovi", name: "ATV / Quad dijelovi i oprema" },
      { slug: "moto-dijelovi-ostalo", name: "Ostalo" },
    ],
  },
  {
    slug: "za-gospodarska",
    name: "Za gospodarska vozila",
    icon: "truck",
    children: [
      { slug: "za-kamione-dostavna", name: "Za kamione i dostavna vozila" },
      { slug: "za-teretne-prikolice", name: "Za teretne prikolice i poluprikolice" },
      { slug: "za-autobuse", name: "Za autobuse i minibuseve" },
      { slug: "za-komunalna", name: "Za komunalna i specijalna vozila" },
      { slug: "za-gospodarska-ostalo", name: "Ostalo" },
    ],
  },
  {
    slug: "za-gradevinske-strojeve",
    name: "Za građevinske strojeve",
    icon: "cone",
    children: [
      { slug: "grad-hidraulika", name: "Hidraulika" },
      { slug: "grad-zlice-korpe", name: "Žlice, korpe i priključni alati" },
      { slug: "grad-podvozje", name: "Podvozje, gusjenice i kotači" },
      { slug: "grad-motor-pogon", name: "Motor i pogonski sklop" },
      { slug: "grad-kabina", name: "Kabina, stakla i karoserija" },
      { slug: "grad-elektrika", name: "Elektrika i elektronika" },
      { slug: "grad-potrosni-filteri", name: "Potrošni materijal i filteri" },
      { slug: "za-gradevinske-ostalo", name: "Ostalo" },
    ],
  },
  {
    slug: "za-poljoprivredne-strojeve",
    name: "Za poljoprivredne strojeve",
    icon: "wheat",
    children: [
      { slug: "polj-traktori-kombajni", name: "Dijelovi za traktore i kombajne" },
      { slug: "polj-prikljucni", name: "Dijelovi za priključne strojeve" },
      { slug: "polj-gume-felge", name: "Gume, felge i utezi" },
      { slug: "polj-kabina", name: "Kabina, stakla i nadogradnje" },
      { slug: "polj-elektrika", name: "Elektrika, elektronika i rasvjeta" },
      { slug: "za-poljoprivredne-ostalo", name: "Ostalo" },
    ],
  },
  {
    slug: "za-vilicare",
    name: "Za viličare",
    icon: "forklift",
    children: [
      { slug: "vil-vilice-kranovi", name: "Vilice, kranovi i priključni alati" },
      { slug: "vil-baterije-punjaci", name: "Baterije, punjači i napajanje" },
      { slug: "vil-hidraulika", name: "Hidraulika i podizni sustav" },
      { slug: "vil-motor-pogon", name: "Motor i pogonski sklop" },
      { slug: "vil-kabina-sjedala", name: "Kabina, sjedala i upravljanje" },
      { slug: "vil-elektrika", name: "Elektrika i elektronika" },
      { slug: "za-vilicare-ostalo", name: "Ostalo" },
    ],
  },
  {
    slug: "servisna-oprema",
    name: "Servisna oprema",
    icon: "settings2",
    children: [
      { slug: "dizalice-podizaci", name: "Dizalice i podizači" },
      { slug: "dijagnostika", name: "Dijagnostika i elektronika" },
      { slug: "rucni-pneumatski-alat", name: "Ručni, pneumatski i specijalni alat" },
      { slug: "vulkanizerska-oprema", name: "Vulkanizerska oprema" },
      { slug: "limarska-lakirerska", name: "Limarska i lakirerska oprema" },
      { slug: "kompresori-pneumatika", name: "Kompresori i pneumatika" },
      { slug: "radionicki-namjestaj", name: "Radionički namještaj i oprema" },
      { slug: "servisna-oprema-ostalo", name: "Ostalo" },
    ],
  },
  {
    // Karlo 30.07: "Gume" i "Felge" spojene u JEDNU kategoriju (Dinova potvrda).
    // Slug ostaje `gume` da 25 postojećih oglasa ne izgubi vezu; oglasi iz stare
    // `felge` rubrike migriraju skriptom (vidi scripts/migrate-dijelovi.mts).
    slug: "gume",
    name: "Gume i felge",
    icon: "circledot",
    children: [
      { slug: "ljetne-gume", name: "Ljetne gume" },
      { slug: "zimske-gume", name: "Zimske gume" },
      { slug: "cjelogodisnje-gume", name: "Cjelogodišnje gume" },
      { slug: "teretne-c-gume", name: "Teretne i C gume" },
      { slug: "moto-atv-gume", name: "Moto i ATV gume" },
      { slug: "agro-industrijske-gume", name: "Agro i industrijske gume" },
      { slug: "aluminijske-felge", name: "Aluminijske felge" },
      { slug: "celicne-felge", name: "Čelične felge" },
      { slug: "kompleti-gume-felge", name: "Kompleti (gume + felge)" },
      { slug: "ratkape", name: "Ratkape / poklopci kotača" },
      { slug: "tpms-senzori", name: "TPMS senzori, ventili i oprema" },
      { slug: "distancijeri-prstenovi", name: "Distancijeri i prstenovi" },
      { slug: "gume-felge-ostalo", name: "Ostalo" },
    ],
  },
  {
    slug: "ulja-tekucine",
    name: "Ulja i tekućine",
    icon: "droplets",
    children: [
      { slug: "motorna-ulja", name: "Motorna ulja" },
      { slug: "ulja-mjenjac", name: "Ulja za mjenjače i transmisiju" },
      { slug: "hidraulicna-ulja", name: "Hidraulična i ostala industrijska ulja" },
      { slug: "rashladne-tekucine", name: "Rashladne i staklo tekućine" },
      { slug: "aditivi", name: "Aditivi i kemijska sredstva" },
      { slug: "autokozmetika-njega", name: "Autokozmetika i njega vozila" },
      { slug: "ulja-tekucine-ostalo", name: "Ostalo" },
    ],
  },
  { slug: "dijelovi-ostalo", name: "Ostalo", icon: "box" },
];

// Starter brand sets for non-auto categories. Industry-standard makes;
// will be replaced by scraped lists from /tmp/avto-taxonomy/brands-*.md.
// Karlo 27.07: moto i gospodarska koriste pune avto.net baze s modelima
// (src/data/makes-moto.ts, makes-gospodarska.ts) umjesto starter imena.
const MEHANIZACIJA_MAKES_STARTER = [
  "JCB", "Caterpillar", "Komatsu", "John Deere", "Case IH", "New Holland",
  "Massey Ferguson", "Kubota", "Bobcat", "Hitachi", "Volvo CE", "Liebherr",
  "Doosan", "Hyundai", "Manitou",
  // Karlo 22.08.2026: "Ostalo" na kraj svakog popisa.
  "Ostalo",
];
const PROSTI_CAS_MAKES_STARTER = [
  "Hobby", "Knaus", "Adria", "Bürstner", "Carado", "Dethleffs", "Fendt",
  "Hymer", "LMC", "Sun Living", "Quicksilver", "Bayliner", "Sea Ray", "Bavaria",
  // 22.08.2026: marke postojećih AKTIVNIH oglasa u bazi — bez njih su ti
  // oglasi bili NEDOHVATLJIVI kroz filtar marke (DB audit).
  "3DOG", "Atlas", "Beneteau", "Coleman", "Combi-Camp", "Cube", "Fiat", "Giant", "Jeanneau", "Mercedes-Benz", "Niu", "Outwell", "Reimo", "VanEssa", "Willerby", "Xiaomi",
  // Karlo 22.08.2026: "Ostalo" na kraj svakog popisa.
  "Ostalo",
];
const DIJELOVI_MAKES_STARTER = [
  "Bosch", "Brembo", "Castrol", "Continental", "Goodyear", "Michelin",
  "Bridgestone", "Pirelli", "Hella", "Mann-Filter", "NGK", "Sachs", "Valeo",
  // 22.08.2026: marke postojećih AKTIVNIH oglasa u bazi — bez njih su ti
  // oglasi bili NEDOHVATLJIVI kroz filtar marke (DB audit).
  "Akrapovič", "Alpine", "ATE", "BBS", "Borbet", "Bosal", "Caterpillar", "Hazet", "Hydac", "John Deere", "Knorr-Bremse", "Kverneland", "Linde", "Motul", "Nokian", "OZ", "Pioneer", "Shoei", "Thule", "Toyota", "Wabco",
  // Karlo 22.08.2026: "Ostalo" na kraj svakog popisa.
  "Ostalo",
];

export const CATEGORIES: Category[] = [
  {
    slug: "auto",
    name: "Auto",
    subLabel: "Auto oglasi",
    icon: "car",
    active: true,
    subcategories: AUTO_SUBS,
    makes: AUTO_MAKES.map((m) => ({ slug: m.slug, name: m.name })),
  },
  {
    slug: "moto",
    name: "Moto",
    icon: "bike",
    active: true,
    subcategories: MOTO_SUBS,
    makes: MOTO_MAKES.map((m) => ({ slug: m.slug, name: m.name })),
  },
  {
    slug: "gospodarska",
    name: "Gospodarska",
    icon: "truck",
    active: true,
    subcategories: GOSPODARSKA_SUBS,
    makes: GOSPODARSKA_MAKES.map((m) => ({ slug: m.slug, name: m.name })),
  },
  {
    slug: "mehanizacija",
    name: "Mehanizacija",
    icon: "excavator",
    active: true,
    subcategories: MEHANIZACIJA_SUBS,
    makes: MEHANIZACIJA_MAKES_STARTER.map((n) => ({ slug: SLUG(n), name: n })),
  },
  {
    slug: "prosti-cas",
    name: "Slobodno vrijeme",
    icon: "camper",
    active: true,
    subcategories: PROSTI_CAS_SUBS,
    makes: PROSTI_CAS_MAKES_STARTER.map((n) => ({ slug: SLUG(n), name: n })),
  },
  {
    slug: "dijelovi",
    name: "Dijelovi i oprema",
    icon: "brakedisc",
    active: true,
    subcategories: DIJELOVI_SUBS,
    makes: DIJELOVI_MAKES_STARTER.map((n) => ({ slug: SLUG(n), name: n })),
  },
];

export function getCategory(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}

export function getDefaultCategory(): Category {
  return CATEGORIES[0];
}

/**
 * Podkategorije koje vode na NAPREDNU pretragu (Dinov izbor).
 * Sve ostale podkategorije → odmah rezultati (/oglasi).
 * auto: "auto-oglasi" (Napredno) tretira se posebno u nav-u.
 */
export const ADVANCED_SUBCATEGORIES: Record<string, string[]> = {
  auto: ["auto-oglasi"],
  moto: ["motocikl", "skuter", "atv-utv"],
  // ⚠️ Karlo 16.08.2026 (st.3): "utv" dodan — bez njega je klik na
  // Gospodarska/UTV vodio na /oglasi umjesto na naprednu pretragu, dok se
  // Moto/ATV otvarao ispravno. To je bio JEDINI uzrok razlike.
  gospodarska: ["dostavna", "kamioni", "prikolice", "utv"],
  mehanizacija: ["gradevinski-strojevi", "poljoprivredni-strojevi", "vilicari"],
  // ⚠️ Karlo 29.08.2026 (st.21): "plovila" dodan — klik je vodio ravno na
  // /oglasi umjesto na naprednu pretragu.
  "prosti-cas": ["kamperi", "kamp-prikolice", "plovila"],
  dijelovi: [],
};

/** Vodi li (kategorija, podkategorija) na naprednu pretragu? */
export function subcategoryUsesAdvanced(categorySlug: string, subSlug: string): boolean {
  return (ADVANCED_SUBCATEGORIES[categorySlug] ?? []).includes(subSlug);
}

/** Link za klik na podkategoriju iz homepage/header submenu. */
export function subcategoryHref(categorySlug: string, subSlug: string): string {
  if (subcategoryUsesAdvanced(categorySlug, subSlug)) {
    return `/oglasi/napredno?category=${categorySlug}&subcategory=${subSlug}`;
  }
  return `/oglasi?category=${categorySlug}&subcategory=${subSlug}`;
}

/**
 * Link za klik na podkategoriju 2. nivoa (dijelovi, avto.net logika).
 * parent = gornja kategorija (npr. auto-dijelovi), child = konkretna vrsta (kocnice).
 * Vodi na rezultate filtrirane po subcategory=parent & vrsta=child.
 */
export function subChildHref(
  categorySlug: string,
  parentSlug: string,
  childSlug: string,
): string {
  // 2. nivo se filtrira preko attr engine-a (a.vrsta=<child>) → bez izmjena
  // filter enginea; radi automatski kad oglasi dobiju attributes.vrsta.
  return `/oglasi?category=${categorySlug}&subcategory=${parentSlug}&a.vrsta=${childSlug}`;
}

/** Ima li podkategorija drugi nivo (children)? */
export function hasChildren(sub: Subcategory): boolean {
  return Array.isArray(sub.children) && sub.children.length > 0;
}

/**
 * Baza marki S MODELIMA za zadanu kategoriju.
 * Karlo 27.07: Model dropdown je prije uvijek čitao AUTO bazu, pa moto i
 * gospodarske marke nisu imale nijedan model. Kategorije bez vlastite baze
 * (mehanizacija, prosti-cas, dijelovi) vraćaju [] → Model ostaje slobodan unos.
 */
export function makesDbFor(categorySlug: string): CarMake[] {
  if (categorySlug === "auto") return AUTO_MAKES;
  if (categorySlug === "moto") return MOTO_MAKES;
  if (categorySlug === "gospodarska") return GOSPODARSKA_MAKES;
  return [];
}

/**
 * Karlo 18.08.2026: ATV (moto) i UTV (gospodarska) imaju VLASTITE popise marki
 * s avto.neta — ne dijele popis svoje kategorije. Vraća null kad podkategorija
 * nema override, pa pozivatelj padne na popis kategorije. Troše ga sve TRI
 * komponente (sidebar / napredna / objava) + model dropdownovi.
 *
 * 22.08.2026: prošireno na prikolice/dostavna/kamioni/autobusi (gospodarska)
 * i vilicari/gradevinski/poljoprivredni/sumarski/komunalni (mehanizacija) —
 * skinuto uživo s avto.neta (Dostavna SID=20000, Tovorna SID=41000, Tovorne
 * prikolice SID=46000 — svaka VLASTiti <select name="znamka">, ne dijeljen).
 * Autobusi/gradevinski/poljoprivredni/sumarski/komunalni nemaju vlastiti
 * padajući popis na avto.netu (provjereno, ne pretpostavljeno) — kurirano ili
 * uzet današnji facet-presjek, prijavljeno Karlu kao best-effort.
 * Minimoto/gokart imaju Karlove vlastite popise (22.08.2026).
 */
/**
 * ⚠️ Karlo 25.08.2026: kod KAMPERA, KAMP PRIKOLICA, MOBILNIH KUĆICA, MODULA ZA
 * KAMPER, ŠATORSKIH PRIKOLICA i KROVNIH ŠATORA polje "Model" se NE
 * prikazuje — kod tih vozila model nije podatak po kojem se pretražuje
 * (naziv izvedbe ide u opis). Vrijedi za sve tri forme + uređivanje.
 */
/**
 * ⚠️ Karlo 26.08.2026: kod KAMIONA, AUTOBUSA, TERETNIH PRIKOLICA,
 * POLJOPRIVREDNIH STROJEVA, VILIČARA i SVIH STROJEVA MEHANIZACIJE model se
 * UPISUJE slobodno (nadogradnje,
 * varijante i tipovi šasije su previše raznoliki za popis), a prazno polje se
 * u pretrazi čita kao "svi modeli". Popis modela u `makes-gospodarska-sub.ts`
 * OSTAJE (koristi ga prikaz oglasa), samo se ne nudi kao padajući izbornik.
 */
export function freeTextModelField(categorySlug: string, subcategory?: string): boolean {
  if (categorySlug === "gospodarska") {
    return subcategory === "kamioni" || subcategory === "autobusi" || subcategory === "prikolice";
  }
  // Karlo 26.08.2026: nakon građevinskih, SVE rubrike mehanizacije imaju
  // slobodan upis — jednostavnije od nabrajanja svih pet.
  if (categorySlug === "mehanizacija") return true;
  // ⚠️ Karlo 30.08.2026 (st.23): PLOVILA — klijent sam upisuje marku i model,
  // bez ponuđenih limitiranih popisa (previše proizvođača/varijanti da bi
  // fiksni popis pokrio sve).
  if (categorySlug === "prosti-cas" && subcategory === "plovila") return true;
  // ⚠️ Karlo 01.09.2026 (st.38): kamping oprema — Marka bira iz spojenog
  // popisa (gore), ali Model se upisuje slobodno (varijante dijelova/opreme
  // su previše raznolike za fiksni popis, isto obrazloženje kao mehanizacija).
  if (categorySlug === "prosti-cas" && subcategory === "kamping-oprema") return true;
  return false;
}

/**
 * ⚠️ Karlo 30.08.2026 (st.23): PLOVILA — Marka je slobodan upis, ne padajući
 * izbornik iz fiksnog popisa. Isti obrazac kao freeTextModelField, ali za
 * Marku (do sada nijedna rubrika nije tražila slobodnu marku — sve ostale
 * i dalje biraju iz popisa da oglas ostane dohvatljiv kroz filtar marke).
 */
export function freeTextMakeField(categorySlug: string, subcategory?: string): boolean {
  return categorySlug === "prosti-cas" && subcategory === "plovila";
}

export function showsModelField(categorySlug: string, subcategory?: string): boolean {
  if (categorySlug === "prosti-cas" && (subcategory === "kamperi" || subcategory === "kamp-prikolice" || subcategory === "mobilne-kucice" ||
      subcategory === "moduli-za-kamper" || subcategory === "satorske-prikolice" ||
      subcategory === "krovni-satori" || subcategory === "najam")) return false;
  // ⚠️ Karlo 26.08.2026: E-romobil nema izbornik Modela — u Motu (slug
  // `e-skuter`) i u Slobodnom vremenu (`e-skuteri`), jer rubrika mora biti
  // identična na obje lokacije.
  if (categorySlug === "moto" && subcategory === "e-skuter") return false;
  if (categorySlug === "prosti-cas" && subcategory === "e-skuteri") return false;
  // ⚠️ Karlo 26.08.2026 (st. 15): isto i za E-bicikl, na obje lokacije.
  if (categorySlug === "moto" && subcategory === "e-bicikl") return false;
  if (categorySlug === "prosti-cas" && subcategory === "e-bicikli") return false;
  return true;
}

/**
 * ⚠️ Karlo 01.09.2026 (st.40/41): "Dijelovi za X" podkategorije trebaju sve
 * marke I MODELE iz čitave izvorne kategorije X (Moto/Gospodarska/...), ne
 * samo AUTO_MAKES iz opće dijelovi-grane (st.39).
 *
 * ⚠️ Za razliku od PROSTI_CAS_NAJAM_MAKES (koji kod duplog sluga zadrži samo
 * PRVI nailazak i baci ostatak) — velik dio marki se javlja u VIŠE od jedne
 * izvorne liste s RAZLIČITIM modelima (npr. Moto Honda: motocikli + ATV-i +
 * go-kartovi; Gospodarska Mercedes-Benz: kamioni + dostavna + autobusi).
 * Karlo je oba puta izričito tražio "marke I MODELE", pa se modeli za isti
 * slug SPAJAJU (unija, bez duplikata), ne odbacuju.
 */
function mergeMakesWithModels(sourceLists: CarMake[][]): CarMake[] {
  const bySlug = new Map<string, CarMake>();
  for (const list of sourceLists) {
    for (const m of list) {
      if (m.slug === "ostalo") continue;
      const existing = bySlug.get(m.slug);
      if (!existing) {
        bySlug.set(m.slug, { ...m, models: [...m.models] });
        continue;
      }
      const mergedModels = new Set([...existing.models, ...m.models]);
      existing.models = [...mergedModels].sort((a, b) => a.localeCompare(b, "hr"));
    }
  }
  return [
    ...[...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name, "hr")),
    { slug: "ostalo", name: "Ostalo", country: "—", models: [] },
  ];
}

/** Dijelovi i oprema/Moto dijelovi i oprema — spoj svih 7 izvora Mota. */
export const MOTO_DIJELOVI_MAKES: CarMake[] = mergeMakesWithModels([
  MOTO_MAKES, ATV_MAKES, MINIMOTO_MAKES, GOKART_MAKES, SANKE_MAKES, EROMOBIL_MAKES, EBICIKL_MAKES,
]);

/** Dijelovi i oprema/Za gospodarska vozila (st.41) — spoj svih 6 izvora Gospodarske. */
export const GOSPODARSKA_DIJELOVI_MAKES: CarMake[] = mergeMakesWithModels([
  GOSPODARSKA_MAKES, UTV_MAKES, GOSPODARSKA_DOSTAVNA_MAKES, GOSPODARSKA_KAMIONI_MAKES,
  GOSPODARSKA_PRIKOLICE_MAKES, GOSPODARSKA_AUTOBUSI_MAKES,
]);

export function makesForSub(categorySlug: string, subcategory?: string): CarMake[] | null {
  // ⚠️ Karlo 01.09.2026 (st.40/41): moraju stajati ISPRED "dijelovi" grane
  // niže (st.39, cijela kategorija → AUTO_MAKES) — inače bi opća grana
  // pobijedila i ovi override-i nikad ne bi bili dosegnuti.
  if (categorySlug === "dijelovi" && subcategory === "moto-dijelovi") return MOTO_DIJELOVI_MAKES;
  if (categorySlug === "dijelovi" && subcategory === "za-gospodarska") return GOSPODARSKA_DIJELOVI_MAKES;
  if (categorySlug === "moto" && subcategory === "atv-utv") return ATV_MAKES;
  if (categorySlug === "moto" && subcategory === "minimoto") return MINIMOTO_MAKES;
  if (categorySlug === "moto" && subcategory === "gokart") return GOKART_MAKES;
  if (categorySlug === "moto" && subcategory === "motorne-sanke") return SANKE_MAKES;
  if (categorySlug === "moto" && subcategory === "e-skuter") return EROMOBIL_MAKES;
  if (categorySlug === "moto" && subcategory === "e-bicikl") return EBICIKL_MAKES;
  if (categorySlug === "prosti-cas" && subcategory === "kamperi") return PROSTI_CAS_KAMPERI_MAKES;
  if (categorySlug === "prosti-cas" && subcategory === "kamp-prikolice") return PROSTI_CAS_KAMP_PRIKOLICE_MAKES;
  if (categorySlug === "prosti-cas" && subcategory === "mobilne-kucice") return PROSTI_CAS_MOBILNE_KUCICE_MAKES;
  // ⚠️ Karlo 29.08.2026 (st.19): "Ponude za najam" u Slobodnom vremenu — marke
  // su spoj svih 8 rubrika (kamperi/kamp prikolice/mobilne kućice/moduli za
  // kamper/šatorske prikolice/krovni šatori/e-bicikli/e-romobil), ne samo
  // mobilnih kućica kao prije. Polja i "bez Modela" ostaju nepromijenjeni.
  if (categorySlug === "prosti-cas" && subcategory === "najam") return PROSTI_CAS_NAJAM_MAKES;
  if (categorySlug === "prosti-cas" && subcategory === "moduli-za-kamper") return PROSTI_CAS_MODULI_MAKES;
  if (categorySlug === "prosti-cas" && subcategory === "satorske-prikolice") return PROSTI_CAS_SATORSKE_MAKES;
  if (categorySlug === "prosti-cas" && subcategory === "krovni-satori") return PROSTI_CAS_KROVNI_SATORI_MAKES;
  // Karlo 25.08.2026: E-romobil u Slobodnom vremenu = ista rubrika kao u Motu.
  if (categorySlug === "prosti-cas" && subcategory === "e-skuteri") return EROMOBIL_MAKES;
  if (categorySlug === "prosti-cas" && subcategory === "e-bicikli") return EBICIKL_MAKES;
  if (categorySlug === "gospodarska" && subcategory === "utv") return UTV_MAKES;
  if (categorySlug === "gospodarska" && subcategory === "dostavna") return GOSPODARSKA_DOSTAVNA_MAKES;
  if (categorySlug === "gospodarska" && subcategory === "kamioni") return GOSPODARSKA_KAMIONI_MAKES;
  if (categorySlug === "gospodarska" && subcategory === "prikolice") return GOSPODARSKA_PRIKOLICE_MAKES;
  if (categorySlug === "gospodarska" && subcategory === "autobusi") return GOSPODARSKA_AUTOBUSI_MAKES;
  if (categorySlug === "mehanizacija" && subcategory === "vilicari") return MEHANIZACIJA_VILICARI_MAKES;
  if (categorySlug === "mehanizacija" && subcategory === "gradevinski-strojevi") return MEHANIZACIJA_GRADEVINSKI_MAKES;
  if (categorySlug === "mehanizacija" && subcategory === "poljoprivredni-strojevi") return MEHANIZACIJA_POLJOPRIVREDNI_MAKES;
  if (categorySlug === "mehanizacija" && subcategory === "sumarski-strojevi") return MEHANIZACIJA_SUMARSKI_MAKES;
  if (categorySlug === "mehanizacija" && subcategory === "komunalni-strojevi") return MEHANIZACIJA_KOMUNALNI_MAKES;
  // ⚠️ Karlo 31.08.2026 (st.26): Dijelovi i oprema/Auto dijelovi (svih 15
  // vrsta, uklj. Motor/dijelovi motora i brtve) — "Marka" preimenovana u "Za
  // marku" i puni popis auto marki+modela (isti kao Osobni auto), umjesto
  // popisa proizvođača dijelova (Bosch/Michelin...) koji ostaje svugdje
  // drugdje u Dijelovima (gume/felge/multimedija/ulja).
  // ⚠️ Karlo 01.09.2026 (st.39): "Sve u Dijelovima i opremi" — Auto dijelovi
  // je imao ISPRAVNA polja, primijenjeno na CIJELU kategoriju. Sad SVE
  // podkategorije Dijelova i opreme (gume, felge, multimedija, moto dijelovi,
  // ulja...) koriste isti puni popis auto marki+modela, ne popis proizvođača
  // dijelova (Bosch/Michelin...).
  if (categorySlug === "dijelovi") return AUTO_MAKES;
  // ⚠️ Karlo 01.09.2026 (st.38): Slobodno vrijeme/Oprema za kampere i kamping
  // — "Za marku" popis marki NIJE bio kompletan (st.30 ga je stavio na AUTO_MAKES,
  // krivo — kamperska oprema treba marke IZ SLOBODNOG VREMENA, ne osobna vozila).
  // Sad koristi isti spojeni popis kao "Ponude za najam" (svih 8 rubrika Slobodnog
  // vremena s vlastitim popisom marki, bez duplikata) — Model ostaje slobodan upis
  // (freeTextModelField niže), jer kamperska oprema ima previše varijanti za popis.
  if (categorySlug === "prosti-cas" && subcategory === "kamping-oprema") return PROSTI_CAS_NAJAM_MAKES;
  return null;
}
