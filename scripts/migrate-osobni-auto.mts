/**
 * Karlo 31.07: "Auto oglasi - Napredno" → "Osobni auto".
 *
 * Prije je `auto-oglasi` bila ULAZNA TOČKA za naprednu pretragu — izuzimala se
 * iz svih izbornika i filtera, i nijedan oglas je nije imao. Sad je prava
 * podkategorija, pa auto oglasi BEZ podkategorije (obični osobni automobili)
 * moraju u nju. Bez toga bi nova rubrika bila prazna, a ti oglasi dostupni samo
 * preko "Auto" bez filtera.
 *
 * Pokretanje: npx tsx --env-file=.env.local scripts/migrate-osobni-auto.mts
 * Idempotentno.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

const [before] = await sql<{ c: number }[]>`
  select count(*)::int as c from listings
  where category = 'auto' and (subcategory is null or subcategory = '')
`;
console.log("auto oglasa bez podkategorije:", before.c);

if (before.c > 0) {
  const res = await sql`
    update listings set subcategory = 'auto-oglasi'
    where category = 'auto' and (subcategory is null or subcategory = '')
  `;
  console.log(`premješteno u 'auto-oglasi' (Osobni auto): ${res.count}`);
} else {
  console.log("nema što migrirati (već odrađeno)");
}

const after = await sql<{ subcategory: string | null; c: number }[]>`
  select subcategory, count(*)::int as c from listings
  where category = 'auto' and status = 'active'
  group by subcategory order by c desc
`;
console.log("\nAUTO po podkategoriji:");
for (const r of after) {
  console.log(`  ${String(r.subcategory ?? "(bez)").padEnd(20)} ${r.c}`);
}

await sql.end();
