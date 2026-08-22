/**
 * Izvršava STVARNU shemu filtera i ispisuje što korisnik vidi po podkategoriji.
 * Ne parsira tekst — importa modul, pa nema lažnih pozitiva iz regexa.
 * Pokretanje: npx tsx scripts/check-filters.mts
 */
import { execSync } from "node:child_process";
import path from "node:path";

// category-filters.ts koristi `@/` alias koji tsx ne razrješava → esbuild bundle.
const bundlePath = "/tmp/auti-filters-check.mjs";
const src = path.resolve(import.meta.dirname, "../src/data/category-filters.ts");
const tsconfig = path.resolve(import.meta.dirname, "../tsconfig.json");
execSync(
  `npx esbuild ${src} --bundle --platform=node --format=esm --target=es2020 --tsconfig=${tsconfig} --outfile=${bundlePath}`,
  { stdio: "ignore" }
);
const { getFilterDefs, groupFields } = (await import(bundlePath)) as typeof import("../src/data/category-filters");

const CASES: Array<[string, string]> = [
  ["auto", "auto-oglasi"],
  ["moto", "motocikl"],
  ["moto", "skuter"],
  ["moto", "atv-utv"],
  ["moto", "minimoto"],
  ["moto", "gokart"],
  ["gospodarska", "dostavna"],
  ["gospodarska", "kamioni"],
  ["gospodarska", "prikolice"],
  // ⚠️ 16.08.2026: autobusi/utv/najam NISU bili pokriveni — mijenjali smo im
  // shemu (Karlo st.2/st.4) nad neprovjerenim terenom. Bez ovih redaka guard
  // prolazi zeleno bez obzira što se dogodi.
  ["gospodarska", "autobusi"],
  ["gospodarska", "utv"],
  ["gospodarska", "najam"],
  ["mehanizacija", "poljoprivredni-strojevi"],
  ["mehanizacija", "vilicari"],
  ["mehanizacija", "gradevinski-strojevi"],
  ["mehanizacija", "sumarski-strojevi"],
  ["mehanizacija", "komunalni-strojevi"],
  ["prosti-cas", "kamperi"],
  ["prosti-cas", "kamp-prikolice"],
];

let problems = 0;
for (const [cat, sub] of CASES) {
  const def = getFilterDefs(cat);
  const visible = def.fields.filter((f) =>
    f.scope && f.scope.length > 0 ? f.scope.includes(sub) : true
  );
  console.log(`\n${"=".repeat(64)}\n${cat.toUpperCase()} / ${sub}\n${"=".repeat(64)}`);
  for (const g of groupFields(visible)) {
    const labels = g.fields.map((f) => {
      const st = f.steps ? ` [${f.steps.length} koraka]` : "";
      return `${f.label}(${f.key})${st}`;
    });
    console.log(`  ▸ ${g.name}: ${labels.join(", ")}`);
  }
  // dupli ključevi u vidljivom skupu = bug (scope se preklapa)
  const keys = visible.map((f) => f.key);
  const dupes = [...new Set(keys.filter((k, i) => keys.indexOf(k) !== i))];
  if (dupes.length) {
    console.log(`  ⚠️ DUPLI KLJUČEVI: ${dupes.join(", ")}`);
    problems++;
  }
}
console.log(problems ? `\n⚠️ problema: ${problems}` : `\n✅ 0 duplih ključeva u svim slučajevima`);
