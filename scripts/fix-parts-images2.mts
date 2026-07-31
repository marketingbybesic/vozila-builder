/**
 * Dopuna `fix-parts-images.mts`: ondje se odlučivalo po LISTI ID-eva slika auta,
 * pa su oglasi s bilo kojom drugom auto-fotografijom prolazili nezapaženo
 * (Castrol i Brembo na naslovnici i dalje pokazivali automobil / sat).
 *
 * Ovdje je pravilo obrnuto i sigurnije: oglas kategorije `dijelovi` smije imati
 * SAMO dvije dopuštene fotografije (servis / motor). Sve ostalo se zamjenjuje —
 * bez obzira koji je ID, pa nova kriva slika ne može proći.
 *
 * Pokretanje: npx tsx --env-file=.env.local scripts/fix-parts-images2.mts
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

const SERVIS = "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=1600&q=80&auto=format&fit=crop";
const MOTOR = "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=80&auto=format&fit=crop";
const ALLOWED = ["1530046339160", "1486262715619"];
const MOTOR_SUBS = ["auto-dijelovi", "moto-dijelovi", "kocnice"];

const rows = await sql<{ id: string; subcategory: string | null; images: unknown }[]>`
  select id, subcategory, images from listings where category = 'dijelovi'
`;

let fixed = 0;
for (const r of rows) {
  const imgs = Array.isArray(r.images) ? (r.images as string[]) : [];
  const first = String(imgs[0] ?? "");
  const ok = ALLOWED.some((id) => first.includes(id));
  if (ok) continue;
  const replacement = MOTOR_SUBS.includes(r.subcategory ?? "") ? MOTOR : SERVIS;
  await sql`update listings set images = ${sql.json([replacement])} where id = ${r.id}`;
  fixed++;
}

console.log(`pregledano: ${rows.length}`);
console.log(`popravljeno (nedopuštena slika): ${fixed}`);

const left = await sql<{ c: number }[]>`
  select count(*)::int as c from listings
  where category = 'dijelovi'
    and images->>0 not like '%1530046339160%'
    and images->>0 not like '%1486262715619%'
`;
console.log("preostalo s nedopuštenom slikom:", left[0].c);

await sql.end();
