/**
 * Brza provjera stanja tablice `listings` u Supabaseu.
 * Pokretanje: npx tsx --env-file=.env.local scripts/db-audit.mts
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

const [tot] = await sql`select count(*)::int as c from listings`;
console.log("ukupno redova:", tot.c);

const byStatus = await sql`
  select status, count(*)::int as c from listings group by status order by c desc
`;
console.log("po statusu:", byStatus.map((r) => `${r.status}=${r.c}`).join("  "));

const [nullCat] = await sql`select count(*)::int as c from listings where category is null`;
console.log("bez category:", nullCat.c);

const [nullImg] = await sql`
  select count(*)::int as c from listings
  where images is null or jsonb_array_length(images) = 0
`;
console.log("bez slike:", nullImg.c);

const byCat = await sql`
  select category, count(*)::int as c from listings
  where status = 'active' group by category order by c desc
`;
console.log("aktivni po kategoriji:", byCat.map((r) => `${r.category}=${r.c}`).join("  "));

await sql.end();
