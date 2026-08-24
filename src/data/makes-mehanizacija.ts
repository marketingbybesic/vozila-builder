// Mehanizacija — marke PO PODKATEGORIJI, 1:1 s avto.net gdje postoji (22.08.2026).
// Viličari skinuti UŽIVO s avto.netove vlastite forme (Search.asp?SID=45000),
// uklj. "istaknute" marke. Građevinski/Poljoprivredni avto.net NEMA odvojen
// popis (obje forme serviraju identičan globalni katalog od 1379 marki) —
// kurirano poznatim proizvođačima po struci, PRIJAVLJENO Karlu kao best-effort.
// Šumarski/Komunalni nemaju padajući popis, samo "trenutno na zalihi" facet
// na rezultatima — uzet današnji presjek kao početna lista.
import type { CarMake } from "@/lib/types";

const M = (slug: string, name: string, country: string, models: string[] = []): CarMake => ({
  slug, name, country, models,
});

const sortHr = (list: CarMake[]): CarMake[] =>
  [...list].sort((a, b) => a.name.localeCompare(b.name, "hr"));

const SLUG_P = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// --- Viličari (avto.net SID=45000, 102 marke + 6 istaknutih) -------------
export const popularVilicariSlugs = ["hyster", "indos", "jungheinrich", "linde", "still", "toyota"];
const VILICARI_NAMES: string[] = [
  "Alca Europe", "Ameise", "Amros", "AntOn", "Armanni", "Artison", "ATI", "Atlet", "Ausa", "Baoli",
  "Basak", "Baumann", "Bendi", "Bobcat", "BT", "CAT", "Cesab", "Clark", "Combilift", "Crown",
  "Daewoo", "Delacco", "Doosan", "Dulevo", "EP", "Eurotrac", "Everun", "Faima", "Fiat", "Frendix",
  "Genie", "Gutman", "Günter Grossmann", "Hako Jonas", "Halla", "Hangcha", "HanseLifter", "Heber", "Heden", "Heli",
  "Huateng", "Hubtex", "Hyster", "Hyundai", "Imer", "Indos", "Irion", "Jazgot", "JAC", "JCB",
  "Jungheinrich", "Kalmar", "Komatsu", "Lansing", "LGMG", "Lifter", "Linde", "Litostroj", "LiuGong", "Luyu",
  "Magaziner", "Mammut", "Manitou", "Mariotti", "Mast", "Maximal", "Merlo", "Michigan", "Mitsubishi", "Maxbull",
  "Nissan", "Noblelift", "O K", "OM", "Palfinger", "Pramac", "Prolifty", "Samag", "Sambron", "Sanderson",
  "SANY", "Sichelschmidt", "Silverstone", "Steinbock", "Still", "Swedmach", "TCM", "Toyota", "Utilev", "VMAX",
  "Wacker Neuson", "Wagner", "Wecan", "Wolf", "Yale",
];
const VILICARI_RAW: CarMake[] = [
  M("hyster", "Hyster", "SAD"),
  M("indos", "Indos", "Nizozemska"),
  M("jungheinrich", "Jungheinrich", "Njemačka"),
  M("linde", "Linde", "Njemačka"),
  M("still", "Still", "Njemačka"),
  M("toyota", "Toyota", "Japan"),
  ...VILICARI_NAMES.filter((n) => !popularVilicariSlugs.includes(SLUG_P(n))).map((n) => M(SLUG_P(n), n, "—")),
  M("ostalo", "Ostalo", "—"),
];
export const MEHANIZACIJA_VILICARI_MAKES: CarMake[] = [
  ...sortHr(VILICARI_RAW.filter((m) => m.slug !== "ostalo")),
  ...VILICARI_RAW.filter((m) => m.slug === "ostalo"),
];

// --- Građevinski strojevi (avto.net nema odvojen popis — kurirano) -------
const GRADEVINSKI_RAW: CarMake[] = [
  M("bobcat", "Bobcat", "SAD"),
  M("case-ce", "Case CE", "SAD"),
  M("caterpillar", "Caterpillar", "SAD"),
  M("doosan", "Doosan", "Južna Koreja"),
  M("hitachi", "Hitachi", "Japan"),
  M("hyundai-ce", "Hyundai CE", "Južna Koreja"),
  M("jcb", "JCB", "Velika Britanija"),
  M("komatsu", "Komatsu", "Japan"),
  M("kubota", "Kubota", "Japan"),
  M("liebherr", "Liebherr", "Njemačka"),
  M("manitou", "Manitou", "Francuska"),
  M("new-holland-ce", "New Holland CE", "Italija"),
  M("sany", "SANY", "Kina"),
  M("takeuchi", "Takeuchi", "Japan"),
  M("terex", "Terex", "SAD"),
  M("volvo-ce", "Volvo CE", "Švedska"),
  M("wacker-neuson", "Wacker Neuson", "Njemačka"),
  M("xcmg", "XCMG", "Kina"),
  M("yanmar", "Yanmar", "Japan"),
  M("zoomlion", "Zoomlion", "Kina"),
  M("ostalo", "Ostalo", "—"),
];
export const MEHANIZACIJA_GRADEVINSKI_MAKES: CarMake[] = [
  ...sortHr(GRADEVINSKI_RAW.filter((m) => m.slug !== "ostalo")),
  ...GRADEVINSKI_RAW.filter((m) => m.slug === "ostalo"),
];

// --- Poljoprivredni strojevi (avto.net nema odvojen popis — kurirano) ----
const POLJOPRIVREDNI_RAW: CarMake[] = [
  M("case-ih", "Case IH", "SAD"),
  M("claas", "Claas", "Njemačka"),
  M("deutz-fahr", "Deutz-Fahr", "Njemačka"),
  M("fendt", "Fendt", "Njemačka"),
  M("john-deere", "John Deere", "SAD"),
  M("kubota", "Kubota", "Japan"),
  M("kuhn", "Kuhn", "Francuska"),
  M("landini", "Landini", "Italija"),
  M("lindner", "Lindner", "Austrija"),
  M("massey-ferguson", "Massey Ferguson", "SAD"),
  M("new-holland", "New Holland", "Italija"),
  M("same", "Same", "Italija"),
  M("steyr", "Steyr", "Austrija"),
  M("ursus", "Ursus", "Poljska"),
  M("valtra", "Valtra", "Finska"),
  M("ostalo", "Ostalo", "—"),
];
export const MEHANIZACIJA_POLJOPRIVREDNI_MAKES: CarMake[] = [
  ...sortHr(POLJOPRIVREDNI_RAW.filter((m) => m.slug !== "ostalo")),
  ...POLJOPRIVREDNI_RAW.filter((m) => m.slug === "ostalo"),
];

// --- Šumarski strojevi (avto.net "Gozdarska", facet 22.08.2026, 129 marki) -
// ⚠️ 22.08.2026: presjek "na zalihi" NIJE imao Ponsse — vodeći šumarski brend
// (harvesteri/forwarderi), a u bazi postoje Ponsse oglasi. Dodan ručno.
const SUMARSKI_NAMES: string[] = [
  "Ponsse",
  "AADI", "ABI", "Accord", "Aebi", "Agria", "Agriforest", "AgroPretex", "Agros", "AGT", "Airo",
  "AL-KO", "AMR", "Atlas", "Balavto", "Balfor", "Baumforst", "Bernardi", "BFM", "BGU", "Bider",
  "Bijol", "Binderberger", "BMF", "Cangini", "Cemeh", "Country", "Cramer", "Deutz-Fahr", "Energreen", "FAE",
  "Farmi Forest", "Fassi", "FCR", "Fliegl", "Fors MW Farma", "Fransgard", "FSI", "FTG", "Geel", "Geo",
  "GMT", "Goljat", "Gude", "Hecht", "Hiab", "Hittner", "Hofman", "HRUST", "Husqvarna", "Hydrofast",
  "Icarbazzoli", "Igland", "Impodan", "IMT", "INO", "Intermercato", "Jansen", "Jensen", "John Deere", "Jonsered",
  "KA Kolenc", "Komatsu", "Kretzer", "Krpan", "Kubota", "Lancman", "Landini", "Lescha", "Liebherr", "LKT",
  "Massey Ferguson", "Matej Lavrač sp", "MAVE", "MB Crusher", "MB-Trac", "MDB", "Metal", "Mustang", "Negri", "Neuson",
  "NTS", "Oehler", "OMEF", "Oniar", "Orsi", "Oset", "Palfinger", "Palms", "Panex AGM", "Paus",
  "Penz Crane", "Pfanzelt", "PONSSE", "Posch", "Rabaud", "Remet CNC", "Riko Ribnica", "Robust", "Rosselli", "Scandic",
  "Schliesing", "SIP", "Stihl", "Still", "Struc Muta", "Tajfun", "Tehnos", "Teknamotor", "THOR", "TIM",
  "Timberjack", "TMC Cancela", "TMV Priore", "Trevi Benne", "Uniforest", "Ursus", "Vaderstadt", "Valentini", "Valtra", "Ventura",
  "Verachtert", "Villager", "Wagner", "Westtech", "Willibald", "Wood-Mizer", "Wravor", "Zanon", "Zipper",
];
const SUMARSKI_RAW: CarMake[] = [
  ...SUMARSKI_NAMES.map((n) => M(SLUG_P(n), n, "—")),
  M("ostalo", "Ostalo", "—"),
];
export const MEHANIZACIJA_SUMARSKI_MAKES: CarMake[] = [
  ...sortHr(SUMARSKI_RAW.filter((m) => m.slug !== "ostalo")),
  ...SUMARSKI_RAW.filter((m) => m.slug === "ostalo"),
];

// --- Komunalni strojevi (avto.net "Komunalna", facet 22.08.2026, 119 marki) -
const KOMUNALNI_NAMES: string[] = [
  "AADI", "ABG", "Accord", "Active", "Adler", "Agrartechnik", "Agrex", "AgroPretex", "Agros", "AGT",
  "AL-KO", "Amazone", "Ariens", "AS-motor", "BCS", "Beilhack", "Bobcat", "Boschung", "Bucher", "Cangini",
  "Caterpillar", "Claas", "CM Crusher", "Cramer", "Dexwal", "Doppstadt", "Eco", "Eco-Air", "Energreen", "Epoke",
  "FAE", "Ferri", "Fliegl", "Flotzinger", "Fransgard", "Frontoni", "GandiniMeccanica", "Garden Pro", "GardenPro", "Geo",
  "Gmeiner", "Gmelin", "Goljat", "Gorenc", "GreenMachines", "Grillo", "Hako", "Hilltip", "Hitachi", "Hofman",
  "Holder", "Honda", "Hummel", "Husqvarna", "Impodan", "INO", "InterTech", "Irus", "Iveco", "Jansen",
  "JCB", "John Deere", "Johnston", "Kahlbacher", "Karcher", "Kassbohrer", "Kawasaki", "Kerland", "Koppl", "Kramer",
  "Kubota", "Kuepper Weisser", "Kutter", "Lesnik", "Lindner", "LS", "Mathieu", "MAVE", "MB Crusher", "Megametal",
  "Mercedes-Benz", "Merlo", "MTD", "Multicar", "Murray", "Niftylift", "NPK", "NTS", "Orkel", "Orsi",
  "Padagas", "POSIPALEC EPOKE", "Procoma", "Procomas", "Rasant", "Reform", "Riko Ekos", "Riko Ribnica", "SaMASZ", "Schmidt",
  "Sherpa", "Sima", "Simex", "SON", "Spider", "Stark", "Struc Muta", "Talex", "Teknamotor", "Tielburger",
  "Toro", "Tuchel", "Unimog", "Valentini", "Villager", "WAP", "Westa", "Yamaha", "Zipper",
];
const KOMUNALNI_RAW: CarMake[] = [
  ...KOMUNALNI_NAMES.map((n) => M(SLUG_P(n), n, "—")),
  M("ostalo", "Ostalo", "—"),
];
export const MEHANIZACIJA_KOMUNALNI_MAKES: CarMake[] = [
  ...sortHr(KOMUNALNI_RAW.filter((m) => m.slug !== "ostalo")),
  ...KOMUNALNI_RAW.filter((m) => m.slug === "ostalo"),
];
