/**
 * Popravlja `body_type` vrijednosti koje nisu u dopuštenom skupu (src/lib/types.ts).
 *
 * Nalaz 30.07.2026: 15 aktivnih oglasa imalo je `Kombi`(9), `Terenac`(5) i `MPV`(1).
 * Ti oglasi se NIKAD nisu prikazivali — `applyFilters`/`rowToListing` rade nad
 * tipiziranim skupom, pa su tiho ispadali iz svakog upita. Zato je /oglasi
 * pokazivao 1151 umjesto 1224 reda iz baze.
 *
 * Mapiranje na postojeće vrijednosti (bez izmjene enuma):
 *   Kombi   → Karavan       (hrv. "kombi" = station wagon)
 *   Terenac → SUV
 *   MPV     → Monovolumen
 *
 * Pokretanje: npx tsx --env-file=.env.local scripts/fix-bodytypes.mts
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

const MAP: Array<[string, string]> = [
  ["Kombi", "Karavan"],
  ["Terenac", "SUV"],
  ["MPV", "Monovolumen"],
];

let total = 0;
for (const [from, to] of MAP) {
  const res = await sql`
    update listings set body_type = ${to} where body_type = ${from}
  `;
  console.log(`  ${from} → ${to}: ${res.count} redova`);
  total += res.count;
}
console.log(`ukupno popravljeno: ${total}`);

const left = await sql`
  select count(*)::int as c from listings
  where body_type not in ('Microcar','Limuzina','Hatchback','Karavan','Coupe','Cabrio','SUV','Monovolumen','Pickup')
`;
console.log("preostalo neispravnih:", (left[0] as { c: number }).c);

await sql.end();
