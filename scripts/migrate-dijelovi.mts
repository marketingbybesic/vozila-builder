/**
 * Migracija taksonomije DIJELOVI I OPREMA (Karlo 30.07.2026).
 *
 * "Gume" i "Felge" su spojene u JEDNU kategoriju "Gume i felge" (slug ostaje
 * `gume`). Oglasi koji su u bazi na `subcategory = 'felge'` moraju prijeći na
 * `gume`, inače ostaju u bazi ali NIKAD se ne pojave u UI-u — slug više ne
 * postoji u taksonomiji, pa nijedan filter ni izbornik ne vodi do njih.
 * (Ista klasa greške kao body_type izvan enuma — vidi scripts/fix-bodytypes.mts.)
 *
 * Pokretanje: npx tsx --env-file=.env.local scripts/migrate-dijelovi.mts
 * Idempotentno — drugi put ne mijenja ništa.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

const [before] = await sql`
  select count(*)::int as c from listings where subcategory = 'felge'
`;
console.log("oglasa na 'felge' prije:", before.c);

if (before.c > 0) {
  const res = await sql`
    update listings set subcategory = 'gume' where subcategory = 'felge'
  `;
  console.log(`premješteno u 'gume': ${res.count}`);
} else {
  console.log("nema što migrirati (već odrađeno)");
}

const after = await sql`
  select subcategory, count(*)::int as c from listings
  where category = 'dijelovi' and status = 'active'
  group by subcategory order by c desc
`;
console.log("\ndijelovi po podkategoriji:");
for (const r of after) console.log(`  ${String(r.subcategory).padEnd(30)} ${r.c}`);

await sql.end();
