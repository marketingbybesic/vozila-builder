/**
 * Seed the Supabase Postgres DB with:
 *   - demo user (00000000-0000-0000-0000-000000000001)
 *   - 52 seed listings from src/data/listings.ts
 *
 * Run after `npx drizzle-kit push` so the schema exists.
 * Usage:
 *   npx tsx --env-file=.env.local scripts/seed-supabase.mts
 *   (or) DATABASE_URL=... npx tsx scripts/seed-supabase.mts
 * Re-running is idempotent (ON CONFLICT DO NOTHING via existence checks).
 */
import postgres from "postgres";
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

// listings.ts uses @/ path aliases, which tsx doesn't resolve.
// Bundle it on-the-fly with esbuild (already a dep) before importing.
const bundlePath = "/tmp/auti-listings-bundled.mjs";
const listingsSrc = path.resolve(import.meta.dirname, "../src/data/listings.ts");
const tsconfig = path.resolve(import.meta.dirname, "../tsconfig.json");
console.log("[seed] Bundling listings.ts via esbuild…");
execSync(
  `npx esbuild ${listingsSrc} --bundle --platform=node --format=esm --target=es2020 --tsconfig=${tsconfig} --outfile=${bundlePath}`,
  { stdio: "ignore" }
);
const { LISTINGS } = (await import(bundlePath)) as typeof import("../src/data/listings");

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. Put it in .env.local or export it.");
  process.exit(1);
}

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  const sql = postgres(DATABASE_URL!, { prepare: false, max: 4, idle_timeout: 5 });

  console.log("[seed] Connecting to Supabase Postgres…");
  await sql`select 1 as ok`;
  console.log("[seed] Connected.");

  // 1) Demo user (idempotent)
  const existing = await sql`select id from users where id = ${DEMO_USER_ID}`;
  if (existing.length === 0) {
    await sql`
      insert into users (id, email, password_hash, first_name, last_name, phone, county, city, avatar_url, seller_type, verified_at)
      values (
        ${DEMO_USER_ID},
        'demo@auti.hr',
        null,
        'Ivan',
        'Horvat',
        '+385 91 234 5678',
        'Grad Zagreb',
        'Zagreb',
        null,
        'Privatni',
        null
      )
      on conflict (id) do nothing
    `;
    console.log("[seed] Demo user inserted.");
  } else {
    console.log("[seed] Demo user already exists, skipping.");
  }

  // 2) 52 listings (idempotent on slug)
  let inserted = 0;
  let skipped = 0;
  for (const l of LISTINGS) {
    const exists = await sql`select 1 from listings where slug = ${l.slug} limit 1`;
    if (exists.length > 0) {
      // Postojeći redovi: ažuriraj category/subcategory/attributes (ranije seed
      // nije mapirao te stupce → bili null). Idempotentno.
      await sql`
        update listings set
          category = ${l.category ?? "auto"},
          subcategory = ${l.subcategory ?? null},
          attributes = ${l.attributes ? sql.json(l.attributes as Record<string, never>) : sql.json({})}
        where slug = ${l.slug}
      `;
      skipped++;
      continue;
    }
    await sql`
      insert into listings (
        slug, user_id, title, category, subcategory, make, model, variant, year, price_eur, original_price_eur, km,
        fuel, transmission, body_type, drive, color, condition,
        engine_cc, power_kw, doors, seats, attributes,
        vin_masked, accident_history, service_history, imported_from,
        first_registered, registration_until,
        city, county, description, features, images,
        status, featured, views, phone_reveals, created_at, updated_at
      ) values (
        ${l.slug}, ${DEMO_USER_ID}, ${l.title}, ${l.category ?? "auto"}, ${l.subcategory ?? null}, ${l.make}, ${l.model}, ${l.variant ?? null},
        ${l.year}, ${l.priceEur}, ${l.originalPriceEur ?? null}, ${l.km},
        ${l.fuel}, ${l.transmission}, ${l.bodyType}, ${l.drive}, ${l.color}, ${l.condition},
        ${l.engineCc}, ${l.powerKw}, ${l.doors}, ${l.seats}, ${l.attributes ? sql.json(l.attributes as Record<string, never>) : sql.json({})},
        ${l.vinMasked ?? null}, ${l.accidentHistory ?? null}, ${l.serviceHistory ?? null}, ${l.importedFrom ?? null},
        ${l.firstRegistered ?? null}, ${l.registrationUntil ?? null},
        ${l.city}, ${l.county}, ${l.description},
        ${sql.json(l.features)}, ${sql.json(l.images)},
        'active', ${l.featured}, ${l.views}, ${l.phoneReveals ?? 0},
        ${l.createdAt}, ${l.createdAt}
      )
    `;
    inserted++;
  }
  console.log(`[seed] Listings: ${inserted} inserted, ${skipped} skipped (already present).`);

  const counts = await sql`select
    (select count(*)::int from users) as users,
    (select count(*)::int from listings) as listings,
    (select count(*)::int from listings where status = 'active') as active`;
  console.log("[seed] Final counts:", counts[0]);

  await sql.end();
  console.log("[seed] Done.");
}

main().catch((err) => {
  console.error("[seed] FAILED:", err);
  process.exit(1);
});
