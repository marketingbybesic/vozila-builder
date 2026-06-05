import { MAKES as AUTO_MAKES } from "./makes";

export type Subcategory = {
  slug: string;
  name: string; // Croatian
};

export type Category = {
  slug: string;
  name: string; // Croatian display
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
  { slug: "auto-oglasi", name: "Auto oglasi" },
  { slug: "eko", name: "Eko (hibrid + EV)" },
  { slug: "luksuzni", name: "Luksuzni" },
  { slug: "oldtimer", name: "Oldtimer" },
  { slug: "karamboli", name: "Karambolirani" },
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

const DIJELOVI_SUBS: Subcategory[] = [
  { slug: "auto-dodatna-oprema", name: "Auto dodatna oprema" },
  { slug: "multimedija", name: "Multimedija" },
  { slug: "moto-dijelovi", name: "Moto dijelovi i oprema" },
  { slug: "za-gospodarska", name: "Za gospodarska vozila" },
  { slug: "za-gradevinske-strojeve", name: "Za građevinske strojeve" },
  { slug: "za-poljoprivredne-strojeve", name: "Za poljoprivredne strojeve" },
  { slug: "za-vilicare", name: "Za viličare" },
  { slug: "servisna-oprema", name: "Servisna oprema" },
  { slug: "gume", name: "Gume" },
  { slug: "felge", name: "Felge" },
  { slug: "ulja-tekucine", name: "Ulja i tekućine" },
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
