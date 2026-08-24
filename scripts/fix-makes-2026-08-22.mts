/**
 * Popravak marki u bazi — 22.08.2026 (Dino odobrio: "popravi sve").
 *
 * DB audit je našao oglase NEDOHVATLJIVE kroz filtar marke jer se
 * `slugify(l.make)` ne poklapa ni s jednim slugom u popisu te (pod)kategorije:
 *  - CFMoto (10, atv-utv)      → "CF Moto"   (popis ima cf-moto)
 *  - Mercedes (2, auto)        → "Mercedes-Benz"
 *  - VW (2, auto)              → "Volkswagen"
 *  - Schmitz (13, prikolice)   → "Schmitz Cargobull"
 *  - Rotax (10, gokart)        → "Ostalo"    (Rotax nije na avto.net gokart popisu)
 *  - Brenderup u auto kategoriji → gospodarska/prikolice (zalutala prikolica)
 * Citroën/Giant/Cube/Segway/Ski-Doo su riješeni u kodu (slugify + popisi), ne ovdje.
 *
 * Pokretanje:  npx tsx scripts/fix-makes-2026-08-22.mts
 */
import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(join(root, ".env.local"), "utf8");
const dsn = env.match(/^DATABASE_URL="?([^"\n]+)"?/m)?.[1]?.trim();
if (!dsn) throw new Error("DATABASE_URL nije u .env.local");
const sql = postgres(dsn, { max: 1, ssl: "require", prepare: false });

const log = (label: string, rows: { length: number }) => console.log(`${label}: ${rows.length} redaka`);

log("CFMoto→CF Moto", await sql`update listings set make='CF Moto' where make='CFMoto' and subcategory='atv-utv' returning id`);
log("Mercedes→Mercedes-Benz", await sql`update listings set make='Mercedes-Benz' where make='Mercedes' and category='auto' returning id`);
log("VW→Volkswagen", await sql`update listings set make='Volkswagen' where make='VW' and category='auto' returning id`);
log("Schmitz→Schmitz Cargobull", await sql`update listings set make='Schmitz Cargobull' where make='Schmitz' and subcategory='prikolice' returning id`);
log("Rotax→Ostalo (gokart)", await sql`update listings set make='Ostalo' where make='Rotax' and subcategory='gokart' returning id`);
log("Brenderup auto→prikolice", await sql`update listings set category='gospodarska', subcategory='prikolice' where make='Brenderup' and category='auto' returning id`);

// Minimoto: Karlov popis od 12 marki NEMA Malaguti/KTM — na avto.netu bi takav
// oglas išao pod "- znamke ni na seznamu -" = kod nas "Ostalo". Naslov kartice
// ostaje ("Malaguti Minicross…"), mijenja se samo filtarska marka.
log("minimoto Malaguti/KTM→Ostalo", await sql`update listings set make='Ostalo' where subcategory='minimoto' and make in ('Malaguti','KTM') returning id`);

// Kartica renderira "marka model" — nakon prebacivanja na "Ostalo" brend mora
// u MODEL (kako bi i pravi prodavač napisao), inače kartica piše samo "Ostalo Max".
log("gokart model +Rotax", await sql`update listings set model='Rotax Max' where subcategory='gokart' and make='Ostalo' and model='Max' returning id`);
log("minimoto model +Malaguti", await sql`update listings set model='Malaguti Minicross' where subcategory='minimoto' and make='Ostalo' and model='Minicross' returning id`);
log("minimoto model +KTM", await sql`update listings set model='KTM SX' where subcategory='minimoto' and make='Ostalo' and model='SX' returning id`);

// Legacy podkategorije mehanizacije koje NE POSTOJE u shemi (bageri/traktori/
// utovarivaci/viljuskari) → normalizacija na stvarne podkategorije, po
// pripadnosti marke odgovarajućem popisu.
log("bageri→gradevinski", await sql`update listings set subcategory='gradevinski-strojevi' where category='mehanizacija' and subcategory='bageri' returning id`);
log("utovarivaci→gradevinski", await sql`update listings set subcategory='gradevinski-strojevi' where category='mehanizacija' and subcategory='utovarivaci' returning id`);
log("traktori→poljoprivredni", await sql`update listings set subcategory='poljoprivredni-strojevi' where category='mehanizacija' and subcategory='traktori' returning id`);
log("viljuskari→poljoprivredni (Kubota traktori)", await sql`update listings set subcategory='poljoprivredni-strojevi' where category='mehanizacija' and subcategory='viljuskari' returning id`);

const b = await sql`select id, category, subcategory from listings where make='Brenderup' and subcategory is null`;
for (const row of b) {
  await sql`update listings set category='gospodarska', subcategory='prikolice' where id=${row.id}`;
  console.log(`Brenderup NULL-subcategory popravljen: ${row.id}`);
}
await sql.end();
console.log("GOTOVO.");
