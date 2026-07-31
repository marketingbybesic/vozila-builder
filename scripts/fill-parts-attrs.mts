/**
 * Popunjava `attributes` za oglase kategorije DIJELOVI.
 *
 * Karlo 31.07: oglas za gumu nije prikazivao ni širinu ni profil ni sezonu —
 * detaljna stranica je (nakon popravka) schema-driven, ali su `attributes` u
 * bazi bili PRAZNI za svih 300 oglasa dijelova. Prikaz je bio ispravan, samo
 * nije imao što prikazati.
 *
 * Podaci se izvode iz NASLOVA oglasa (npr. "Michelin Pilot Sport 5 · 225/45 R17"
 * → širina 225, profil 45, promjer R17), pa su dosljedni s onim što piše u oglasu.
 * Gdje se iz naslova ne da izvesti, koristi se razumna vrijednost po podkategoriji.
 *
 * Pokretanje: npx tsx --env-file=.env.local scripts/fill-parts-attrs.mts
 * Idempotentno — preskače oglase koji već imaju atribute.
 */
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

type Row = { id: string; title: string; make: string; model: string; subcategory: string | null; attributes: unknown };

const rows = await sql<Row[]>`
  select id, title, make, model, subcategory, attributes
  from listings where category = 'dijelovi'
`;

const SEASON = [
  [/zimsk|blizzak|hakkapeliitta|winter|wintercontact/i, "zimska"],
  [/4season|all\s*season|vector|cjelogodi/i, "cjelogodisnja"],
] as const;

function tireAttrs(title: string): Record<string, string> | null {
  // "225/45 R17" ili "205/55 R16"
  const m = title.match(/(\d{3})\s*\/\s*(\d{2})\s*R\s*(\d{2})/i);
  if (!m) return null;
  const season = SEASON.find(([re]) => re.test(title))?.[1] ?? "ljetna";
  return {
    tireWidth: m[1],
    tireProfile: m[2],
    tireDiameter: `R${m[3]}`,
    tireSeason: season,
    tireType: "osobna",
  };
}

/**
 * Kataloški broj iz naslova (npr. "0124525", "AC574").
 * ⚠️ Za gume NE vrijedi — "225/45 R17" bi dalo "OEM 225", što je širina gume,
 * ne kataloški broj. Zato se poziva samo za ne-gume, i traži se oznaka koja
 * sadrži barem jedno slovo ili je duža od 5 znamenki.
 */
function oemFrom(title: string): string | undefined {
  const m = title.match(/\b([A-Z]{1,3}\d{3,7}[A-Z]?|\d{6,9})\b/);
  return m ? m[1] : undefined;
}

const COMPAT: Record<string, string> = {
  "za-poljoprivredne-strojeve": "Traktori i kombajni",
  "za-gradevinske-strojeve": "Građevinski strojevi",
  "za-gospodarska": "Kamioni i dostavna vozila",
  "za-vilicare": "Viličari",
  "moto-dijelovi": "Motocikli i skuteri",
  "auto-dijelovi": "Osobna vozila",
  "auto-dodatna-oprema": "Osobna vozila",
  multimedija: "Osobna vozila",
  "servisna-oprema": "Univerzalno",
  "ulja-tekucine": "Univerzalno",
};

let filled = 0;
let skipped = 0;

for (const r of rows) {
  const existing = (r.attributes ?? {}) as Record<string, unknown>;
  if (Object.keys(existing).length > 0) {
    skipped++;
    continue;
  }

  const a: Record<string, string> = {
    partType: "zamjenski",
    condition2: "novo",
    brandPart: r.make,
    quantity: "1",
  };

  const compat = COMPAT[r.subcategory ?? ""];
  if (compat) a.compatibleWith = compat;

  // Gume i felge nemaju OEM broj u naslovu — dimenzija nije kataloški broj.
  if (r.subcategory !== "gume") {
    const oem = oemFrom(`${r.model} ${r.title}`);
    if (oem) a.oem = oem;
  }

  if (r.subcategory === "gume") {
    const t = tireAttrs(r.title);
    if (t) Object.assign(a, t);
  }
  if (r.subcategory === "ulja-tekucine") {
    const visc = r.title.match(/(\d{1,2}W-\d{2})/i);
    if (visc) a.viscosity = visc[1].toUpperCase();
    a.fluidType = "motorno-ulje";
    a.oilSynthetic = "sinteticko";
  }

  await sql`update listings set attributes = ${sql.json(a)} where id = ${r.id}`;
  filled++;
}

console.log(`pregledano: ${rows.length}`);
console.log(`popunjeno:  ${filled}`);
console.log(`preskočeno (već imali): ${skipped}`);

const sample = await sql<{ title: string; attributes: unknown }[]>`
  select title, attributes from listings
  where category = 'dijelovi' and subcategory = 'gume' limit 3
`;
console.log("\nprimjer (gume):");
for (const s of sample) {
  console.log(`  ${s.title.slice(0, 42).padEnd(44)} ${JSON.stringify(s.attributes).slice(0, 120)}`);
}

await sql.end();
