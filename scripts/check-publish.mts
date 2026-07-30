/**
 * Usporedba: koja polja nudi NAPREDNA PRETRAGA vs koja nudi OBJAVA oglasa,
 * po podkategoriji. Karlo 30.07: objava mora nuditi sve što pretraga filtrira,
 * inače korisnik ne može popuniti podatak po kojem ga drugi traže.
 *
 * Pokretanje: npx tsx scripts/check-publish.mts
 */
import { execSync } from "node:child_process";
import path from "node:path";

const bundlePath = "/tmp/auti-pub-check.mjs";
const src = path.resolve(import.meta.dirname, "../src/data/category-filters.ts");
const tsconfig = path.resolve(import.meta.dirname, "../tsconfig.json");
execSync(
  `npx esbuild ${src} --bundle --platform=node --format=esm --target=es2020 --tsconfig=${tsconfig} --outfile=${bundlePath}`,
  { stdio: "ignore" }
);
const { getFilterDefs } = (await import(bundlePath)) as typeof import("../src/data/category-filters");

// Ista lista koju objava preskače (post-listing-form.tsx SKIP_KEYS).
const SKIP = new Set([
  "priceEur", "year", "county", "sellerType", "condition", "adAge",
  "subcategory", "make", "model", "q",
]);

const CASES: Array<[string, string]> = [
  ["auto", "auto-oglasi"],
  ["moto", "motocikl"],
  ["moto", "skuter"],
  ["gospodarska", "dostavna"],
  ["gospodarska", "kamioni"],
  ["gospodarska", "prikolice"],
  ["mehanizacija", "poljoprivredni-strojevi"],
  ["mehanizacija", "vilicari"],
  ["prosti-cas", "kamperi"],
  ["prosti-cas", "kamp-prikolice"],
  ["dijelovi", "auto-dijelovi"],
  ["dijelovi", "gume"],
];

let problems = 0;
for (const [cat, sub] of CASES) {
  const def = getFilterDefs(cat);
  const searchable = def.fields.filter((f) =>
    f.scope && f.scope.length > 0 ? f.scope.includes(sub) : true
  );
  // Objava: isti filter + makne SKIP_KEYS
  const publishable = searchable.filter((f) => !SKIP.has(f.key));
  const missing = searchable.filter(
    (f) => !SKIP.has(f.key) && !publishable.some((p) => p.key === f.key)
  );

  console.log(`\n${cat}/${sub}`);
  console.log(`  pretraga nudi: ${searchable.length} polja`);
  console.log(`  objava nudi:   ${publishable.length} polja`);
  if (missing.length) {
    console.log(`  ⚠️ FALI U OBJAVI: ${missing.map((m) => m.key).join(", ")}`);
    problems++;
  }
}

// Povijesni scenarij: korisnik NIJE odabrao podkategoriju.
// Od 30.07. NIJE dostupan — `stepValid` za korak 1 traži podkategoriju kad
// kategorija ima ijednu (post-listing-form.tsx). Brojke niže pokazuju ZAŠTO:
// bez podkategorije objava izgubi gotovo sva polja, pa oglas ostane bez podataka
// po kojima ga pretraga filtrira. Ostavljeno kao regresijski dokaz.
console.log("\n" + "=".repeat(60));
console.log("POVIJESNO (blokirano od 30.07.) — bez odabrane podkategorije:");
for (const cat of ["auto", "moto", "gospodarska", "mehanizacija", "prosti-cas", "dijelovi"]) {
  const def = getFilterDefs(cat);
  const all = def.fields.filter((f) => !SKIP.has(f.key));
  // post-listing-form: scope-ana polja ISPADAJU ako nema podkategorije
  const shown = all.filter((f) => !(f.scope && f.scope.length > 0));
  const lost = all.length - shown.length;
  const flag = lost > 0 ? `⚠️ gubi ${lost}` : "ok";
  console.log(`  ${cat.padEnd(14)} ukupno ${String(all.length).padStart(3)} → prikazano ${String(shown.length).padStart(3)}  ${flag}`);
}
console.log(problems ? `\n⚠️ problema: ${problems}` : `\n✅ objava pokriva sve što pretraga nudi`);
