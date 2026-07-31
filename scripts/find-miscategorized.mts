/**
 * Nalazi oglase koji su u KRIVOJ kategoriji — npr. gume/ulja/dijelovi zavedeni
 * kao "auto". Nalaz 31.07: pod "Osobni auto" pojavili su se "Goodyear F1 komplet
 * guma" i "Castrol 12" (ulje).
 *
 * Pokretanje: npx tsx --env-file=.env.local scripts/find-miscategorized.mts [--fix]
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
const FIX = process.argv.includes("--fix");

// Marke koje NIKAD nisu proizvođači vozila — ako su u kategoriji vozila, greška je.
const PARTS_BRANDS = [
  "Goodyear", "Michelin", "Continental", "Bridgestone", "Nokian", "Pirelli", "Dunlop",
  "Castrol", "Motul", "Mobil", "Shell", "Liqui Moly",
  "Bosch", "Brembo", "ATE", "Sachs", "Valeo", "Hella", "Mann-Filter", "NGK",
  "Akrapovič", "Knorr-Bremse", "Wabco", "BBS", "OZ", "Thule", "Bosal",
  "Pioneer", "Alpine", "Hazet", "Hydac", "Kverneland",
];

const rows = await sql<{ id: string; title: string; make: string; category: string; subcategory: string | null }[]>`
  select id, title, make, category, subcategory from listings
  where category in ('auto', 'moto', 'gospodarska', 'mehanizacija', 'prosti-cas')
    and make = any(${PARTS_BRANDS})
`;

console.log(`krivo kategorizirano: ${rows.length}`);
for (const r of rows.slice(0, 15)) {
  console.log(`  ${r.make.padEnd(16)} ${r.title.slice(0, 40).padEnd(42)} ${r.category}/${r.subcategory ?? "-"}`);
}

if (FIX && rows.length) {
  // Podkategorija se izvodi iz marke: gume → gume, ulja → ulja-tekucine, ostalo → auto-dijelovi.
  const TIRE = ["Goodyear", "Michelin", "Continental", "Bridgestone", "Nokian", "Pirelli", "Dunlop"];
  const OIL = ["Castrol", "Motul", "Mobil", "Shell", "Liqui Moly"];
  let moved = 0;
  for (const r of rows) {
    const sub = TIRE.includes(r.make) ? "gume" : OIL.includes(r.make) ? "ulja-tekucine" : "auto-dijelovi";
    await sql`
      update listings set category = 'dijelovi', subcategory = ${sub} where id = ${r.id}
    `;
    moved++;
  }
  console.log(`\npremješteno u 'dijelovi': ${moved}`);
}

await sql.end();
