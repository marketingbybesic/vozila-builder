import { MAKES as AUTO_MAKES } from "./makes";

export type Subcategory = {
  slug: string;
  name: string; // Croatian
  nameOrig?: string; // Slovenian source for reference
};

export type Category = {
  slug: string;
  name: string; // Croatian display
  icon: "car" | "bike" | "truck" | "tractor" | "tent" | "wrench";
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

// Slovenian → Croatian translations of the subcategories scraped from avto.net.
// Source: /tmp/avto-taxonomy/parsed.json (2026-05-15).

const AUTO_SUBS: Subcategory[] = [
  { slug: "rabljeni", name: "Rabljeni" },
  { slug: "novi", name: "Novi" },
  { slug: "eko", name: "Eko (hibrid + EV)", nameOrig: "Eko vozila" },
  { slug: "luksuzni", name: "Luksuzni", nameOrig: "Luksuzna vozila" },
  { slug: "oldtimer", name: "Oldtimer", nameOrig: "Oldtimerji" },
  { slug: "karamboli", name: "Karambolirani", nameOrig: "Karambolirana vozila" },
  { slug: "katalog-novih", name: "Katalog novih", nameOrig: "Katalog novih vozil" },
  { slug: "najam", name: "Ponude za najam", nameOrig: "Ponudbe za najem" },
];

const MOTO_SUBS: Subcategory[] = [
  { slug: "motocikl", name: "Motocikl", nameOrig: "Motorno kolo" },
  { slug: "skuter", name: "Skuter", nameOrig: "Skuter, Maxi-scooter, 3-4 kolesni scooter" },
  { slug: "moped", name: "Moped", nameOrig: "Moped, kolo z motorjem" },
  { slug: "atv-utv", name: "ATV / UTV", nameOrig: "4-kolesnik, ATV, UTV, 3-kolesnik" },
  { slug: "minimoto", name: "Minimoto" },
  { slug: "oldtimer", name: "Oldtimer" },
  { slug: "gokart", name: "Go-kart" },
  { slug: "motorne-sanke", name: "Motorne sanke", nameOrig: "Motorne sani" },
  { slug: "e-skuter", name: "E-skuter", nameOrig: "E-skiro" },
  { slug: "e-bicikl", name: "E-bicikl", nameOrig: "E-kolo" },
  { slug: "e-moto", name: "E-moto" },
];

const GOSPODARSKA_SUBS: Subcategory[] = [
  { slug: "dostavna", name: "Dostavna vozila", nameOrig: "Dostavna vozila" },
  { slug: "kamioni", name: "Kamioni", nameOrig: "Tovorna vozila" },
  { slug: "autobusi", name: "Autobusi", nameOrig: "Avtobusi" },
  { slug: "prikolice", name: "Teretne prikolice", nameOrig: "Tovorne prikolice" },
  { slug: "utv", name: "UTV vozila" },
  { slug: "kontejneri", name: "Kontejneri", nameOrig: "Kontejnerji" },
];

const MEHANIZACIJA_SUBS: Subcategory[] = [
  // Source page returned no subcategories — manually curated based on industry standard
  { slug: "traktori", name: "Traktori" },
  { slug: "kombajni", name: "Kombajni" },
  { slug: "bageri", name: "Bageri" },
  { slug: "utovarivaci", name: "Utovarivači" },
  { slug: "viljuskari", name: "Viljuškari" },
  { slug: "gradevinski-strojevi", name: "Građevinski strojevi" },
  { slug: "prikljucni-strojevi", name: "Priključni strojevi" },
];

const PROSTI_CAS_SUBS: Subcategory[] = [
  { slug: "kamperi", name: "Kamperi", nameOrig: "Avtodom" },
  { slug: "kamp-prikolice", name: "Kamp prikolice", nameOrig: "Počitniška prikolica" },
  { slug: "mobilne-kucice", name: "Mobilne kućice", nameOrig: "Mobilna hišica" },
  { slug: "moduli-za-kamper", name: "Moduli za kamper", nameOrig: "Snemljivi bivalnik" },
  { slug: "satorske-prikolice", name: "Šatorske prikolice", nameOrig: "Šotorska prikolica" },
  { slug: "plovila", name: "Plovila", nameOrig: "Navtika" },
  { slug: "e-bicikli", name: "E-bicikli", nameOrig: "E-kolo" },
  { slug: "e-skuteri", name: "E-skuteri", nameOrig: "E-skiro" },
  { slug: "kamping-oprema", name: "Kamping oprema", nameOrig: "Camping oprema" },
];

const DIJELOVI_SUBS: Subcategory[] = [
  { slug: "auto-dijelovi", name: "Auto dijelovi" },
  { slug: "moto-dijelovi", name: "Moto dijelovi" },
  { slug: "gume-felge", name: "Gume i felge" },
  { slug: "audio-navigacija", name: "Audio i navigacija" },
  { slug: "alati", name: "Alati i oprema" },
  { slug: "tuning", name: "Tuning" },
];

// Starter brand sets for non-auto categories. Industry-standard makes;
// will be replaced by scraped lists from /tmp/avto-taxonomy/brands-*.md.
const MOTO_MAKES_STARTER = [
  "Honda", "Yamaha", "Kawasaki", "Suzuki", "Ducati", "BMW", "KTM", "Triumph",
  "Aprilia", "Harley-Davidson", "Vespa", "Piaggio", "Husqvarna", "Royal Enfield",
];
const GOSPODARSKA_MAKES_STARTER = [
  "MAN", "Iveco", "Mercedes-Benz", "DAF", "Volvo", "Scania", "Renault Trucks",
  "Ford", "Fiat", "Peugeot", "Citroën", "Opel", "Volkswagen",
];
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
    makes: MOTO_MAKES_STARTER.map((n) => ({ slug: SLUG(n), name: n })),
  },
  {
    slug: "gospodarska",
    name: "Gospodarska",
    icon: "truck",
    active: true,
    subcategories: GOSPODARSKA_SUBS,
    makes: GOSPODARSKA_MAKES_STARTER.map((n) => ({ slug: SLUG(n), name: n })),
  },
  {
    slug: "mehanizacija",
    name: "Mehanizacija",
    icon: "tractor",
    active: true,
    subcategories: MEHANIZACIJA_SUBS,
    makes: MEHANIZACIJA_MAKES_STARTER.map((n) => ({ slug: SLUG(n), name: n })),
  },
  {
    slug: "prosti-cas",
    name: "Slobodno vrijeme",
    icon: "tent",
    active: true,
    subcategories: PROSTI_CAS_SUBS,
    makes: PROSTI_CAS_MAKES_STARTER.map((n) => ({ slug: SLUG(n), name: n })),
  },
  {
    slug: "dijelovi",
    name: "Dijelovi i oprema",
    icon: "wrench",
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
