/**
 * Seed 6 "Premium trgovaca" kao PRAVE korisnike + njihove oglase.
 *
 * ⚠️ Dino/Karlo 05.08.2026: "kad se klikne na auto centar izlistaju se oglasi,
 * ali ne može se ući u pojedinačni oglas". Uzrok: trgovci su bili STATIČNI demo
 * (`src/data/dealers.ts`) — slugovi tipa `lst-d001` nikad nisu postojali u bazi,
 * pa klik nije imao kamo voditi. Zato je showcase bio preusmjeren na profil.
 *
 * Ova skripta ih pretvara u prave korisnike (`sellerType: "Trgovac"`) s pravim
 * oglasima, pa sve postaje klikabilno kao kod bilo kojeg drugog prodavača.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-dealers.mts
 * Idempotentno — ponovno pokretanje ne duplicira (provjera po slugu/emailu).
 */
import postgres from "postgres";
import { execSync } from "node:child_process";
import path from "node:path";

const bundlePath = "/tmp/auti-dealers-bundled.mjs";
const src = path.resolve(import.meta.dirname, "../src/data/dealers.ts");
const tsconfig = path.resolve(import.meta.dirname, "../tsconfig.json");
console.log("[seed-dealers] Bundlam dealers.ts…");
execSync(
  `npx esbuild ${src} --bundle --platform=node --format=esm --target=es2020 --tsconfig=${tsconfig} --outfile=${bundlePath}`,
  { stdio: "ignore" },
);
const { FEATURED_DEALERS } = (await import(bundlePath)) as typeof import("../src/data/dealers");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[seed-dealers] DATABASE_URL nije postavljen.");
  process.exit(1);
}
const sql = postgres(DATABASE_URL, { max: 1, prepare: false });

/** Izvuče godinu i grad iz sluga: "...-2023-zagreb-lst-d001" → 2023 */
function yearFromSlug(slug: string, fallback = 2022): number {
  const m = slug.match(/-(\d{4})-/);
  const y = m ? Number(m[1]) : NaN;
  return Number.isFinite(y) && y > 1980 && y < 2030 ? y : fallback;
}

/** "Volkswagen Golf 8 1.5 TSI" → { make: "Volkswagen", model: "Golf 8 1.5 TSI" } */
function splitTitle(title: string): { make: string; model: string } {
  const dvorjecne = ["Mercedes Benz", "Alfa Romeo", "Land Rover"];
  for (const d of dvorjecne) {
    if (title.startsWith(d)) return { make: d, model: title.slice(d.length).trim() || "—" };
  }
  const [prva, ...ost] = title.split(" ");
  return { make: prva, model: ost.join(" ") || "—" };
}

// Vrijednosti moraju odgovarati enumima koje forma/prikaz očekuju.
const FUELS = ["Dizel", "Benzin", "Hibrid", "Električni"];
const TRANSMISSIONS = ["Automatski", "Ručni"];
const BODY = ["Limuzina", "Karavan", "SUV", "Hatchback"];

let noviKorisnici = 0;
let noviOglasi = 0;
let preskoceni = 0;

for (const [di, dealer] of FEATURED_DEALERS.entries()) {
  const email = `${dealer.slug}@vozila.hr`;

  // 1) korisnik — postoji li već?
  const [postoji] = await sql`select id from users where email = ${email} limit 1`;
  let userId: string;
  if (postoji) {
    userId = postoji.id as string;
  } else {
    const [novi] = await sql`
      insert into users (email, password_hash, first_name, last_name, phone, county, city, seller_type, tier, verified_at)
      values (
        ${email},
        ${"!seed-no-login"},
        ${dealer.name},
        ${""},
        ${"+385 1 2345 678"},
        ${dealer.county},
        ${dealer.city},
        ${"Trgovac"},
        ${"premium-dealer"},
        now()
      )
      returning id
    `;
    userId = novi.id as string;
    noviKorisnici++;
  }

  // 2) oglasi
  for (const [li, l] of dealer.listings.entries()) {
    const [imaOglas] = await sql`select id from listings where slug = ${l.slug} limit 1`;
    if (imaOglas) { preskoceni++; continue; }

    const { make, model } = splitTitle(l.title);
    const year = yearFromSlug(l.slug);
    const idx = di * 6 + li;

    await sql`
      insert into listings (
        slug, user_id, title, category, subcategory, make, model, year, price_eur,
        km, fuel, transmission, body_type, drive, color, condition, engine_cc, power_kw,
        doors, seats, city, county, description, features, images, status, attributes
      ) values (
        ${l.slug}, ${userId}, ${l.title}, ${"auto"}, ${"auto-oglasi"},
        ${make}, ${model}, ${year}, ${l.price},
        ${20000 + idx * 7000},
        ${FUELS[idx % FUELS.length]},
        ${TRANSMISSIONS[idx % TRANSMISSIONS.length]},
        ${BODY[idx % BODY.length]},
        ${"Prednji"},
        ${"Siva"},
        ${"Rabljeno"},
        ${1600 + (idx % 5) * 200},
        ${85 + (idx % 6) * 15},
        ${5}, ${5},
        ${dealer.city}, ${dealer.county},
        ${`${l.title} — vozilo iz ponude ${dealer.name}. Servisna knjižica, prvi vlasnik, redovito održavano u ovlaštenom servisu. Moguć servisni pregled prije kupnje.`},
        ${sql.json([])},
        ${sql.json([l.image])},
        ${"active"},
        ${sql.json({ soldWhole: true, roadworthy: true, undamaged: true, numOwners: "1", serviceHistory: "potpuna" })}
      )
    `;
    noviOglasi++;
  }
}

console.log(`[seed-dealers] Gotovo. Novi trgovci: ${noviKorisnici}, novi oglasi: ${noviOglasi}, preskočeno (već postoji): ${preskoceni}`);
await sql.end();
