/**
 * Provjera prikaza oglasa po kategorijama: koja se polja pojavljuju na
 * detaljnoj stranici i kartici. Hvata "auto-polja na dijelu" klasu greške.
 * Pokretanje: npx tsx scripts/check-detail.mts
 */
import { execSync } from "node:child_process";
import path from "node:path";

const bundle = "/tmp/auti-detail-check.mjs";
execSync(
  `npx esbuild ${path.resolve(import.meta.dirname, "../src/lib/listing-fields.ts")} ` +
    `--bundle --platform=node --format=esm --target=es2020 ` +
    `--tsconfig=${path.resolve(import.meta.dirname, "../tsconfig.json")} --outfile=${bundle}`,
  { stdio: "ignore" }
);
const { specGroupsFor, cardSummary, isVehicle } =
  (await import(bundle)) as typeof import("../src/lib/listing-fields");

const base = {
  id: "x", slug: "s", title: "t", year: 2025, priceEur: 1000, km: 0,
  fuel: "Benzin", transmission: "Automatski", bodyType: "Limuzina",
  drive: "Prednji", color: "Crna", condition: "Novo", engineCc: 0, powerKw: 1,
  doors: 4, seats: 5, city: "Zagreb", county: "Grad Zagreb", description: "d",
  features: [], images: ["i"], sellerName: "n", sellerType: "Privatni",
  sellerPhone: "p", views: 1, featured: false, createdAt: new Date().toISOString(),
} as const;

// Polja koja NE SMIJU izaći na nevozilima.
const CAR_ONLY = ["Kilometri", "Kilometraža", "Gorivo", "Mjenjač", "Karoserija", "Pogon", "Vrata", "Sjedala"];

const CASES = [
  { lab: "dijelovi/filter", cat: "dijelovi", sub: "za-poljoprivredne-strojeve", vehicle: false },
  { lab: "dijelovi/gume", cat: "dijelovi", sub: "gume", vehicle: false },
  { lab: "dijelovi/ulja", cat: "dijelovi", sub: "ulja-tekucine", vehicle: false },
  { lab: "mehanizacija/vilicari", cat: "mehanizacija", sub: "vilicari", vehicle: true },
  { lab: "gospodarska/prikolice", cat: "gospodarska", sub: "prikolice", vehicle: true },
  { lab: "prosti-cas/plovila", cat: "prosti-cas", sub: "plovila", vehicle: true },
  { lab: "auto", cat: "auto", sub: "auto-oglasi", vehicle: true },
];

let problems = 0;
for (const c of CASES) {
  const l = { ...base, make: "X", model: "Y", category: c.cat, subcategory: c.sub, attributes: {} } as never;
  const groups = specGroupsFor(l);
  const labels = groups.flatMap((g) => g.items.map((i) => i.label));
  const summary = cardSummary(l);

  const leaked = c.cat === "dijelovi" ? labels.filter((x) => CAR_ONLY.includes(x)) : [];
  const summaryLeak = c.cat === "dijelovi" ? summary.filter((x) => /km|Benzin|Dizel/i.test(x)) : [];

  console.log(`\n${c.lab}`);
  console.log(`  kartica: ${summary.join(" · ") || "(prazno)"}`);
  console.log(`  rubrike: ${groups.map((g) => g.name).join(", ") || "(nema)"}`);
  console.log(`  vozilo:  ${isVehicle(l)}`);
  if (leaked.length) { console.log(`  ⚠️ AUTO-POLJA NA DIJELU: ${leaked.join(", ")}`); problems++; }
  if (summaryLeak.length) { console.log(`  ⚠️ KARTICA LAŽE: ${summaryLeak.join(", ")}`); problems++; }
}
console.log(problems ? `\n⚠️ problema: ${problems}` : `\n✅ nijedno auto-polje ne curi na nevozila`);
if (problems) process.exit(1);
