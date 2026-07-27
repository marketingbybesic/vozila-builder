import type { CarMake } from "@/lib/types";
import { MAKES as AUTO_MAKES } from "./makes";
import { MOTO_MAKES } from "./makes-moto";
import { GOSPODARSKA_MAKES } from "./makes-gospodarska";

export type Subcategory = {
  slug: string;
  name: string; // Croatian
  children?: Subcategory[]; // 2. nivo (avto.net "Rezervni deli" logika, npr. dijelovi)
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
  { slug: "auto-oglasi", name: "Auto oglasi - Napredno" },
  { slug: "trkaci", name: "Trkaći auti" },
  { slug: "eko", name: "Eko (hibrid + EV)" },
  { slug: "luksuzni", name: "Luksuzni" },
  { slug: "oldtimer", name: "Oldtimer" },
  { slug: "ostecen-u-kvaru", name: "Oštećeni i u kvaru" },
  { slug: "najam", name: "Ponude za najam" },
];

const MOTO_SUBS: Subcategory[] = [
  { slug: "motocikl", name: "Motocikl" },
  { slug: "skuter", name: "Skuter" },
  { slug: "moped", name: "Moped" },
  { slug: "atv-utv", name: "ATV / UTV" },
  { slug: "minimoto", name: "Minimoto" },
  { slug: "oldtimer", name: "Oldtimer" },
  { slug: "gokart", name: "Go-kart" },
  { slug: "motorne-sanke", name: "Motorne sanke" },
  { slug: "e-skuter", name: "E-skuter" },
  { slug: "e-bicikl", name: "E-bicikl" },
  { slug: "e-moto", name: "E-moto" },
  { slug: "najam", name: "Ponude za najam" },
];

const GOSPODARSKA_SUBS: Subcategory[] = [
  { slug: "dostavna", name: "Dostavna vozila" },
  { slug: "kamioni", name: "Kamioni" },
  { slug: "autobusi", name: "Autobusi" },
  { slug: "prikolice", name: "Teretne prikolice" },
  { slug: "utv", name: "UTV vozila" },
  { slug: "najam", name: "Ponude za najam" },
];

const MEHANIZACIJA_SUBS: Subcategory[] = [
  { slug: "poljoprivredni-strojevi", name: "Poljoprivredni strojevi" },
  { slug: "vilicari", name: "Viličari" },
  { slug: "sumarski-strojevi", name: "Šumarski strojevi" },
  { slug: "komunalni-strojevi", name: "Komunalni strojevi" },
  { slug: "gradevinski-strojevi", name: "Građevinski strojevi" },
  { slug: "najam", name: "Ponude za najam" },
];

const PROSTI_CAS_SUBS: Subcategory[] = [
  { slug: "kamperi", name: "Kamperi" },
  { slug: "kamp-prikolice", name: "Kamp prikolice" },
  { slug: "mobilne-kucice", name: "Mobilne kućice" },
  { slug: "moduli-za-kamper", name: "Moduli za kamper" },
  { slug: "satorske-prikolice", name: "Šatorske prikolice" },
  { slug: "plovila", name: "Plovila" },
  { slug: "e-bicikli", name: "E-bicikli" },
  { slug: "e-skuteri", name: "E-skuteri" },
  { slug: "kamping-oprema", name: "Kamping oprema" },
];

// DIJELOVI I OPREMA — 2-nivoa struktura (avto.net "Rezervni deli in oprema").
// Svaka gornja kategorija ima svoje podkategorije koje se otvaraju u submenu.
const DIJELOVI_SUBS: Subcategory[] = [
  {
    slug: "auto-dijelovi",
    name: "Auto dijelovi",
    children: [
      { slug: "motor-dijelovi", name: "Motor i dijelovi motora" },
      { slug: "mjenjac-transmisija", name: "Mjenjač i transmisija" },
      { slug: "kocnice", name: "Kočnice" },
      { slug: "ovjes-amortizeri", name: "Ovjes i amortizeri" },
      { slug: "upravljac-volan", name: "Upravljački sustav" },
      { slug: "ispuh-katalizator", name: "Ispuh i katalizator" },
      { slug: "hladenje-grijanje", name: "Hlađenje i grijanje" },
      { slug: "elektrika-senzori", name: "Elektrika i senzori" },
      { slug: "akumulatori", name: "Akumulatori" },
      { slug: "karoserija-limarija", name: "Karoserija i limarija" },
      { slug: "stakla-retrovizori", name: "Stakla i retrovizori" },
      { slug: "svjetla-zarulje", name: "Svjetla i žarulje" },
      { slug: "filteri", name: "Filteri" },
      { slug: "gorivo-sustav", name: "Sustav goriva" },
      { slug: "unutrasnjost", name: "Dijelovi unutrašnjosti" },
    ],
  },
  {
    slug: "auto-dodatna-oprema",
    name: "Auto dodatna oprema",
    children: [
      { slug: "krovni-nosaci", name: "Krovni nosači i kutije" },
      { slug: "vucne-kuke", name: "Vučne kuke" },
      { slug: "presvlake-tepisi", name: "Presvlake i tepisi" },
      { slug: "lanci-snijeg", name: "Lanci i oprema za snijeg" },
      { slug: "auto-kozmetika", name: "Auto kozmetika" },
      { slug: "alarmi-zastita", name: "Alarmi i zaštita" },
      { slug: "djecja-sjedalica", name: "Dječje sjedalice" },
      { slug: "tuning", name: "Tuning oprema" },
    ],
  },
  {
    slug: "multimedija",
    name: "Multimedija",
    children: [
      { slug: "radio-navigacija", name: "Radio i navigacija" },
      { slug: "zvucnici-pojacala", name: "Zvučnici i pojačala" },
      { slug: "kamere-parkiranje", name: "Kamere i senzori parkiranja" },
      { slug: "android-carplay", name: "Android / CarPlay" },
      { slug: "antene", name: "Antene" },
    ],
  },
  {
    slug: "moto-dijelovi",
    name: "Moto dijelovi i oprema",
    children: [
      { slug: "moto-motor", name: "Motor i dijelovi" },
      { slug: "moto-kocnice", name: "Kočnice" },
      { slug: "moto-ovjes", name: "Ovjes" },
      { slug: "moto-ispuh", name: "Ispuh" },
      { slug: "moto-elektrika", name: "Elektrika" },
      { slug: "moto-oplata", name: "Oplata i karoserija" },
      { slug: "kacige", name: "Kacige" },
      { slug: "moto-odjeca", name: "Moto odjeća i zaštita" },
    ],
  },
  {
    slug: "za-gospodarska",
    name: "Za gospodarska vozila",
    children: [
      { slug: "gv-motor", name: "Motor i pogon" },
      { slug: "gv-kocnice", name: "Kočnice i zračni sustav" },
      { slug: "gv-ovjes", name: "Ovjes i osovine" },
      { slug: "gv-elektrika", name: "Elektrika" },
      { slug: "gv-kabina", name: "Kabina i karoserija" },
      { slug: "gv-nadogradnja", name: "Nadogradnje i sanduci" },
    ],
  },
  {
    slug: "za-gradevinske-strojeve",
    name: "Za građevinske strojeve",
    children: [
      { slug: "gs-hidraulika", name: "Hidraulika" },
      { slug: "gs-podvozje", name: "Podvozje i gusjenice" },
      { slug: "gs-zlice-prikljucci", name: "Žlice i priključci" },
      { slug: "gs-motor", name: "Motor i pogon" },
      { slug: "gs-elektrika", name: "Elektrika" },
    ],
  },
  {
    slug: "za-poljoprivredne-strojeve",
    name: "Za poljoprivredne strojeve",
    children: [
      { slug: "ps-motor", name: "Motor i pogon" },
      { slug: "ps-hidraulika", name: "Hidraulika" },
      { slug: "ps-gume", name: "Gume i kotači" },
      { slug: "ps-prikljucci", name: "Priključci" },
      { slug: "ps-elektrika", name: "Elektrika" },
    ],
  },
  {
    slug: "za-vilicare",
    name: "Za viličare",
    children: [
      { slug: "vil-vilice", name: "Vilice i nosači" },
      { slug: "vil-baterije", name: "Baterije i punjači" },
      { slug: "vil-gume", name: "Gume i kotači" },
      { slug: "vil-hidraulika", name: "Hidraulika" },
    ],
  },
  {
    slug: "servisna-oprema",
    name: "Servisna oprema",
    children: [
      { slug: "alat-rucni", name: "Ručni alat" },
      { slug: "dijagnostika", name: "Dijagnostika" },
      { slug: "dizalice-podizaci", name: "Dizalice i podizači" },
      { slug: "kompresori", name: "Kompresori" },
      { slug: "radionicka-oprema", name: "Radionička oprema" },
    ],
  },
  {
    slug: "gume",
    name: "Gume",
    children: [
      { slug: "ljetne-gume", name: "Ljetne gume" },
      { slug: "zimske-gume", name: "Zimske gume" },
      { slug: "cjelogodisnje-gume", name: "Cjelogodišnje gume" },
      { slug: "teretne-gume", name: "Teretne gume" },
      { slug: "moto-gume", name: "Moto gume" },
    ],
  },
  {
    slug: "felge",
    name: "Felge",
    children: [
      { slug: "aluminijske-felge", name: "Aluminijske felge" },
      { slug: "celicne-felge", name: "Čelične felge" },
      { slug: "cjelina-guma-felga", name: "Komplet guma + felga" },
      { slug: "ratkape", name: "Ratkape" },
    ],
  },
  {
    slug: "ulja-tekucine",
    name: "Ulja i tekućine",
    children: [
      { slug: "motorno-ulje", name: "Motorno ulje" },
      { slug: "ulje-mjenjac", name: "Ulje za mjenjač" },
      { slug: "antifriz-rashladno", name: "Antifriz i rashladna tekućina" },
      { slug: "kocnicna-tekucina", name: "Kočnička tekućina" },
      { slug: "aditivi", name: "Aditivi" },
    ],
  },
];

// Starter brand sets for non-auto categories. Industry-standard makes;
// will be replaced by scraped lists from /tmp/avto-taxonomy/brands-*.md.
// Karlo 27.07: moto i gospodarska koriste pune avto.net baze s modelima
// (src/data/makes-moto.ts, makes-gospodarska.ts) umjesto starter imena.
const MEHANIZACIJA_MAKES_STARTER = [
  "JCB", "Caterpillar", "Komatsu", "John Deere", "Case IH", "New Holland",
  "Massey Ferguson", "Kubota", "Bobcat", "Hitachi", "Volvo CE", "Liebherr",
  "Doosan", "Hyundai", "Manitou",
];
const PROSTI_CAS_MAKES_STARTER = [
  "Hobby", "Knaus", "Adria", "Bürstner", "Carado", "Dethleffs", "Fendt",
  "Hymer", "LMC", "Sun Living", "Quicksilver", "Bayliner", "Sea Ray", "Bavaria",
];
const DIJELOVI_MAKES_STARTER = [
  "Bosch", "Brembo", "Castrol", "Continental", "Goodyear", "Michelin",
  "Bridgestone", "Pirelli", "Hella", "Mann-Filter", "NGK", "Sachs", "Valeo",
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
  gospodarska: ["dostavna", "kamioni", "prikolice"],
  mehanizacija: ["gradevinski-strojevi", "poljoprivredni-strojevi", "vilicari"],
  "prosti-cas": ["kamperi", "kamp-prikolice"],
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
