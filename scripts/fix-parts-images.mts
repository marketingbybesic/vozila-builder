/**
 * Dijelovi/gume/oprema NIKAD ne smiju prikazivati fotografiju automobila.
 *
 * Nalaz 30.07.2026: na `/oglasi?category=dijelovi&subcategory=gume` oglasi za
 * Michelin/Nokian/Continental gume prikazivali su BMW sedan. Zapisi u kodu su
 * ispravni (0 pogodaka) — problem su STARIJI redovi u bazi, seedani prije nego
 * su skupine slika popravljene.
 *
 * Zamjena: neutralne, ali TOČNE kontekstualne fotografije
 *   servis     = auto na dizalici u servisu  (oprema, alat, gume)
 *   motorBay   = motor / remenje             (mehanički dijelovi)
 * Ne tvrdimo model — samo da je riječ o dijelovima, što je istina.
 *
 * Pokretanje: npx tsx --env-file=.env.local scripts/fix-parts-images.mts
 * Idempotentno.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

// Fotografije koje prikazuju CIJELI AUTOMOBIL — nedopuštene za kategoriju dijelovi.
const CAR_IDS = [
  "1606664515524", "1541899481282", "1623869675781", "1619767886558",
  "1555215695", "1617531653332", "1621007947382", "1590362891991",
  "1609521263047", "1606611013016", "1533473359331", "1551830820",
  "1552519507", "1605559424843", "1618843479313", "1583121274602",
  "1503376780353", "1612825173281", "1560958089", "1536700503339",
  "1494976388531", "1542362567", "1568844293986", "1603584173870",
  // ⚠️ Stara skupina "tires" — ime laže: fotografija prikazuje SIVI BMW SEDAN,
  // ne gumu. Zato su oglasi za Michelin/Nokian/Continental gume prikazivali auto.
  "1580273916550",
];

const SERVIS = "https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?w=1600&q=80&auto=format&fit=crop";
const MOTOR = "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=80&auto=format&fit=crop";

// Mehanički dijelovi → motor; sve ostalo (gume, oprema, alat, ulja) → servis.
const MOTOR_SUBS = ["auto-dijelovi", "moto-dijelovi", "kocnice"];

const rows = await sql<{ id: string; subcategory: string | null; images: string[] }[]>`
  select id, subcategory, images from listings where category = 'dijelovi'
`;

let fixed = 0;
for (const r of rows) {
  const imgs = Array.isArray(r.images) ? r.images : [];
  const hasCar = imgs.some((u) => CAR_IDS.some((id) => String(u).includes(id)));
  if (!hasCar) continue;
  const replacement = MOTOR_SUBS.includes(r.subcategory ?? "") ? MOTOR : SERVIS;
  await sql`update listings set images = ${sql.json([replacement])} where id = ${r.id}`;
  fixed++;
}

console.log(`pregledano: ${rows.length} dijelovi oglasa`);
console.log(`popravljeno (imali sliku auta): ${fixed}`);

const left = await sql<{ c: number }[]>`
  select count(*)::int as c from listings
  where category = 'dijelovi'
    and exists (
      select 1 from unnest(
        case when jsonb_typeof(images) = 'array'
             then array(select jsonb_array_elements_text(images))
             else array[]::text[] end
      ) as u where ${sql.unsafe(CAR_IDS.map((id) => `u like '%${id}%'`).join(" or "))}
    )
`;
console.log("preostalo sa slikom auta:", left[0].c);

await sql.end();
