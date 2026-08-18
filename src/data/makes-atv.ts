// ATV / UTV marke — Karlo 18.08.2026 ("Evo ovo su marke za Atv u Moto i za
// UTV u Gospodarska"), popisi s avto.net slika.
//
// - ATV lista vrijedi za moto podkategoriju "atv-utv" (ravna abeceda, bez
//   grupe "Najpopularnije" — kao moped).
// - UTV lista (10 marki) vrijedi za gospodarsku podkategoriju "utv".
// - Marke koje postoje u MOTO_MAKES se REFERENCIRAJU (isti slug + modeli);
//   nove marke nastaju ovdje s praznim popisom modela (avto.net za njih na
//   Karlovim slikama ne pokazuje modele).
// - "Apollo": avto.net prikazuje "Apollo"; kod nas ista marka nosi slug
//   "apollo-motors" — u ATV/UTV kontekstu prikazujemo avto.net ime.
import type { CarMake } from "@/lib/types";
import { MOTO_MAKES } from "./makes-moto";

/** Postojeća moto marka po slugu — greška u slugu mora SRUŠITI build, ne tiho nestati. */
const moto = (slug: string, name?: string): CarMake => {
  const m = MOTO_MAKES.find((x) => x.slug === slug);
  if (!m) throw new Error(`makes-atv: moto marka "${slug}" ne postoji u MOTO_MAKES`);
  return name ? { ...m, name } : m;
};
/** Nova marka bez modela. */
const N = (slug: string, name: string): CarMake => ({ slug, name, country: "", models: [] });

export const ATV_MAKES: CarMake[] = [
  N("access-motor", "Access Motor"),
  moto("adly"),
  moto("aeon"),
  N("aixam", "Aixam"),
  N("alke", "Alke"),
  N("apache", "Apache"),
  moto("apollo-motors", "Apollo"),
  N("arctic-cat", "Arctic Cat"),
  N("argo", "Argo"),
  N("atv", "ATV"),
  N("barossa", "Barossa"),
  moto("barton"),
  moto("bashan"),
  moto("benda"),
  N("bombardier", "Bombardier"),
  N("brc", "BRC"),
  moto("can-am"),
  N("carello", "Carello"),
  N("cectek", "Cectek"),
  moto("cf-moto"),
  N("chatenet", "Chatenet"),
  N("club-car", "Club Car"),
  N("columbia", "Columbia"),
  N("corvus", "Corvus"),
  moto("cpi"),
  N("cushman", "Cushman"),
  N("dfm", "DFM"),
  N("dinli", "Dinli"),
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
  N("irbis", "Irbis"),
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
  N("ligier", "Ligier"),
  moto("linhai"),
  moto("lintex"),
  N("lizhong", "Lizhong"),
  N("loncin", "Loncin"),
  N("melex", "Melex"),
  N("microcar", "Microcar"),
  N("odes", "Odes"),
  N("orion", "Orion"),
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
  N("stels", "Stels"),
  moto("stomp"),
  moto("suzuki"),
  moto("sym"),
  moto("tao-motor"),
  N("taylor-dunn", "Taylor-Dunn"),
  N("textron", "Textron"),
  moto("tgb"),
  moto("thumpstar"),
  moto("tms"),
  N("tomberlin", "Tomberlin"),
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
];

/** ATV marka po slugu (za UTV listu — dijele nove zapise poput Loncin/Odes/Segway). */
const atv = (slug: string): CarMake => {
  const m = ATV_MAKES.find((x) => x.slug === slug);
  if (!m) throw new Error(`makes-atv: ATV marka "${slug}" ne postoji`);
  return m;
};

export const UTV_MAKES: CarMake[] = [
  moto("apollo-motors", "Apollo"),
  moto("can-am"),
  moto("cf-moto"),
  moto("linhai"),
  atv("loncin"),
  atv("odes"),
  moto("polaris"),
  atv("segway"),
  moto("tgb"),
  moto("yamaha"),
];
