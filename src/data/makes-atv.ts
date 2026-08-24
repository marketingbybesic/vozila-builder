// ATV / UTV marke — Karlo 18.08.2026 ("Evo ovo su marke za Atv u Moto i za
// UTV u Gospodarska"), popisi s avto.net slika.
//
// - ATV lista vrijedi za moto podkategoriju "atv-utv" (ravna abeceda, bez
//   grupe "Najpopularnije" — kao moped).
// - UTV lista (10 marki) vrijedi za gospodarsku podkategoriju "utv".
// - Marke koje postoje u MOTO_MAKES se REFERENCIRAJU (isti slug + modeli);
//   nove marke nastaju ovdje s praznim popisom modela (avto.net za njih na
//   Karlovim slikama ne pokazuje modele).
// - "Apollo" je na avto.netu ODVOJENA marka od "Apollo Motors" (obje postoje
//   u njihovoj bazi) — zato ovdje ima vlastiti slug "apollo" i vlastite modele.
import type { CarMake } from "@/lib/types";
import { MOTO_MAKES } from "./makes-moto";

/** Postojeća moto marka po slugu — greška u slugu mora SRUŠITI build, ne tiho nestati. */
const moto = (slug: string, name?: string): CarMake => {
  const m = MOTO_MAKES.find((x) => x.slug === slug);
  if (!m) throw new Error(`makes-atv: moto marka "${slug}" ne postoji u MOTO_MAKES`);
  return name ? { ...m, name } : m;
};
/** Nova marka bez modela. */
const N = (slug: string, name: string, models: string[] = []): CarMake => ({ slug, name, country: "", models });

export const ATV_MAKES: CarMake[] = [
  N("access-motor", "Access Motor"),
  moto("adly"),
  moto("aeon"),
  N("aixam", "Aixam"),
  N("alke", "Alke"),
  N("apache", "Apache"),
  N("apollo", "Apollo", ["RFN Thunder 70", "RFN Thunder 125", "RFN Thunder 250"]),
  N("arctic-cat", "Arctic Cat"),
  N("argo", "Argo"),
  N("atv", "ATV"),
  N("barossa", "Barossa", ["AL5", "APO", "KHB", "MAM 170", "MAM 250", "Mini AK3"]),
  moto("barton"),
  moto("bashan"),
  moto("benda"),
  N("bombardier", "Bombardier"),
  N("brc", "BRC"),
  moto("can-am"),
  N("carello", "Carello"),
  N("cectek", "Cectek", ["Gladiator", "Kingcobra", "Quadrift"]),
  moto("cf-moto"),
  N("chatenet", "Chatenet"),
  N("club-car", "Club Car"),
  N("columbia", "Columbia"),
  N("corvus", "Corvus"),
  moto("cpi"),
  N("cushman", "Cushman", ["Eagle"]),
  N("dfm", "DFM"),
  N("dinli", "Dinli", ["DL 281", "DL 282", "DL 700", "DL 800", "DL 900"]),
  moto("e-ton"),
  moto("e-z-go"),
  N("egl-moto", "EGL moto"),
  N("emover", "eMover"),
  N("estrima", "Estrima"),
  N("explorer", "Explorer"),
  N("fangpower", "Fangpower"),
  N("garia", "Garia"),
  moto("generic"),
  moto("gilera"),
  moto("goes"),
  N("goupil", "Goupil"),
  N("hdk", "HDK"),
  N("hisun", "Hisun"),
  moto("honda"),
  moto("hyosung"),
  N("irbis", "Irbis", ["TTR 223R"]),
  moto("italjet"),
  N("jcb", "JCB"),
  N("john-deere", "John Deere"),
  moto("jonway"),
  moto("kangchao"),
  moto("kawasaki"),
  moto("kayo"),
  moto("keeway"),
  N("kingwell", "Kingwell"),
  moto("kinroad"),
  N("kioti", "Kioti"),
  moto("ktm"),
  N("kubota", "Kubota"),
  moto("kymco"),
  moto("lem"),
  N("lifan", "Lifan"),
  N("ligier", "Ligier", ["Be Four 50", "Be Four 350", "Be Pro"]),
  moto("linhai"),
  moto("lintex"),
  N("lizhong", "Lizhong"),
  N("loncin", "Loncin", ["CR4", "CR5", "CR6", "GP200", "GP250", "GP300", "JL150", "JL200", "JL250", "LX 50", "LX 110", "LX 125", "LX 150", "LX 175", "LX 200", "LX 250", "Reiz", "SK 110", "SX1", "SX2", "TH125"]),
  N("melex", "Melex"),
  N("microcar", "Microcar"),
  N("odes", "Odes"),
  N("orion", "Orion", ["50", "110", "125", "250", "AGB 50", "AGB 125", "AGB 150", "AGB 250", "Kiddy"]),
  N("parcar", "ParCar"),
  moto("pgo"),
  moto("piaggio"),
  N("pilotcar", "Pilotcar"),
  moto("pioneer"),
  moto("pitsterpro"),
  moto("polaris"),
  moto("qjmotor"),
  N("quadix", "Quadix"),
  N("reinmech", "Reinmech"),
  moto("romet"),
  N("segway", "Segway"),
  moto("shineray"),
  moto("skygo"),
  moto("skyteam"),
  N("smc", "SMC"),
  moto("stark"),
  N("stels", "Stels", ["100RS", "600Y Leopard", "800G Guepard"]),
  moto("stomp"),
  moto("suzuki"),
  moto("sym"),
  moto("tao-motor"),
  N("taylor-dunn", "Taylor-Dunn"),
  N("textron", "Textron"),
  moto("tgb"),
  moto("thumpstar"),
  moto("tms"),
  N("tomberlin", "Tomberlin", ["MadAss", "SDX 150", "SDX-200", "SDX-300", "SDX-400", "SDX-600", "TX 50", "XS"]),
  N("toro", "Toro"),
  moto("triton"),
  N("upmoto", "UPmoto"),
  moto("ural"),
  N("utv", "UTV"),
  moto("volta"),
  moto("vonroad"),
  moto("xingyue"),
  moto("xmotos"),
  moto("yamaha"),
  // Karlo 22.08.2026: "Ostalo" ide na kraj SVAKOG popisa marki.
  N("ostalo", "Ostalo"),
];

/**
 * ⚠️ Karlo 18.08.2026 (ispravka): UTV u Gospodarskoj mora imati ISTE marke
 * kao ATV u Moto — ne skraćeni popis. Kratka lista s njegove slike bila je
 * kriva interpretacija.
 */
export const UTV_MAKES: CarMake[] = ATV_MAKES;
