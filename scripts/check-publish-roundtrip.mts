/**
 * Guard: podaci iz koraka 1–5 objave MORAJU preživjeti zod shemu akcije.
 * Zod strip-a nepoznate ključeve — dok `category`/`subcategory`/`attributes`
 * nisu bili u shemi, prodavač ih unese a oglas ih izgubi (Karlo, 01.08.).
 */
import { z } from "zod";
import {
  FUEL_TYPES, ALL_TRANSMISSIONS, ALL_BODY_TYPES, DRIVES, COLORS, CONDITIONS,
} from "../src/lib/types";

// Ogledalo sheme iz src/actions/listings.ts
const CreateListing = z.object({
  category: z.string().min(1).default("auto"),
  subcategory: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  make: z.string().min(1),
  model: z.string().min(1),
  variant: z.string().optional(),
  year: z.coerce.number().int().min(1950).max(2030),
  priceEur: z.coerce.number().int().positive(),
  km: z.coerce.number().int().nonnegative(),
  fuel: z.enum(FUEL_TYPES),
  transmission: z.enum(ALL_TRANSMISSIONS),
  bodyType: z.enum(ALL_BODY_TYPES),
  drive: z.enum(DRIVES),
  color: z.enum(COLORS),
  condition: z.enum(CONDITIONS),
  engineCc: z.coerce.number().int().nonnegative().default(0),
  powerKw: z.coerce.number().int().nonnegative(),
  doors: z.coerce.number().int().min(2).max(5).default(5),
  seats: z.coerce.number().int().min(2).max(9).default(5),
  city: z.string().min(1),
  county: z.string().min(1),
  description: z.string().min(30).max(2000),
  features: z.array(z.string()).default([]),
  images: z.array(z.string()).min(1, "Dodaj barem jednu fotografiju"),
});

// Karlov oglas sa screenshota 01.08. (JAECOO 7 Elite Plugin Hybrid)
const karlo = {
  category: "auto",
  subcategory: "auto-oglasi",
  make: "JAECOO", model: "7", variant: "ELITE PLUGIN HYBRID",
  year: 2026, priceEur: 36000, km: 10000,
  fuel: "Hibrid", transmission: "Automatski", bodyType: "SUV",
  drive: "Prednji", color: "Bijela", condition: "Rabljeno",
  engineCc: 0, powerKw: 200, doors: 5, seats: 5,
  city: "Zagreb", county: "Grad Zagreb",
  description: "Auto je brutalan. Range rover moze se sakrit uz njega bez problema.",
  features: ["Kontrola tlaka u gumama (RDK)", "Bi-ksenonska svjetla"],
  attributes: {
    subcategory: "auto-oglasi", tapacirung: "koza", upholsteryColor: "crna",
    paintType: "metalik", emissionStandard: "EURO 7", co2: 50,
    combinedConsumption: 5, airbagCount: 9, warranty: "da",
    wheelSize: "20", damageState: "osteceno", engineRuns: "da",
    vin: "WVW1234FGB4567JG", firstRegistration: "2026-02", roadworthyUntil: "2027-02",
  },
  images: ["https://images.unsplash.com/photo-1"],
};

let fail = 0;

console.log("=== KARLOV SLUČAJ ===");
const r = CreateListing.safeParse(karlo);
if (!r.success) {
  console.log("❌ zod ODBIO oglas:");
  for (const i of r.error.issues) console.log(`   ${i.path.join(".")}: ${i.message}`);
  fail++;
} else {
  const d = r.data as Record<string, unknown>;
  const must: Array<[string, unknown]> = [
    ["category", d.category],
    ["subcategory", d.subcategory],
    ["attributes", d.attributes],
  ];
  for (const [k, v] of must) {
    const ok = v !== undefined;
    console.log(`${ok ? "✅" : "❌"} ${k} preživio: ${ok ? JSON.stringify(v).slice(0, 60) : "STRIPAN — PODATAK IZGUBLJEN"}`);
    if (!ok) fail++;
  }
  const attrs = d.attributes as Record<string, unknown>;
  const n = Object.keys(attrs ?? {}).length;
  console.log(`${n >= 15 ? "✅" : "❌"} broj atributa: ${n} (očekivano ≥15 iz koraka 2–4)`);
  if (n < 15) fail++;
  const feats = d.features as string[];
  console.log(`${feats.length >= 2 ? "✅" : "❌"} oprema: ${feats.length} stavki`);
  if (feats.length < 2) fail++;
}

console.log("\n=== GOSPODARSKA (Furgon) — prije bi pao ===");
const furgon = CreateListing.safeParse({
  ...karlo, category: "gospodarska", subcategory: "dostavna",
  bodyType: "Furgon", make: "Renault", model: "Master",
});
console.log(furgon.success ? "✅ prošao" : `❌ ${furgon.error.issues[0]?.path.join(".")}: ${furgon.error.issues[0]?.message}`);
if (!furgon.success) fail++;

console.log("\n=== MEHANIZACIJA (hidrostatski) — prije bi pao ===");
const hidro = CreateListing.safeParse({
  ...karlo, category: "mehanizacija", subcategory: "gradjevinski-strojevi",
  transmission: "hidrostatski", make: "Caterpillar", model: "320",
});
console.log(hidro.success ? "✅ prošao" : `❌ ${hidro.error.issues[0]?.path.join(".")}: ${hidro.error.issues[0]?.message}`);
if (!hidro.success) fail++;

console.log(fail === 0
  ? "\n✅ objava ne gubi ništa iz prethodnih koraka"
  : `\n❌ ${fail} problema — oglas bi izgubio podatke ili ne bi bio spremljen`);
process.exit(fail === 0 ? 0 : 1);
