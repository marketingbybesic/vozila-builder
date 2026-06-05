/**
 * One-shot: give Supabase demo + admin users a real password hash + role.
 * Idempotent. Run with: npx tsx --env-file=.env.local scripts/setup-demo-creds.mts
 */
import postgres from "postgres";
import { hash } from "bcrypt-ts";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const DEMO_ID = "00000000-0000-0000-0000-000000000001";
const ADMIN_ID = "00000000-0000-0000-0000-0000000000ad";

const DEMO_PASS = "demo1234";
const ADMIN_PASS = "admin1234";

async function main() {
  const sql = postgres(DATABASE_URL!, { prepare: false, max: 2, idle_timeout: 5 });

  const demoHash = await hash(DEMO_PASS, 10);
  const adminHash = await hash(ADMIN_PASS, 10);

  await sql`
    insert into users (id, email, password_hash, first_name, last_name, phone, county, city, seller_type, role, tier, verified_at)
    values (${DEMO_ID}, 'demo@auti.hr', ${demoHash}, 'Ivan', 'Horvat', '+385 91 234 5678', 'Grad Zagreb', 'Zagreb', 'Privatni', 'user', 'free', now())
    on conflict (id) do update set password_hash = excluded.password_hash, verified_at = excluded.verified_at
  `;
  console.log("[creds] demo@auti.hr → demo1234");

  await sql`
    insert into users (id, email, password_hash, first_name, last_name, phone, county, city, seller_type, role, tier, verified_at)
    values (${ADMIN_ID}, 'admin@auti.hr', ${adminHash}, 'Admin', 'Auti', null, null, null, 'Privatni', 'admin', 'free', now())
    on conflict (id) do update set password_hash = excluded.password_hash, role = excluded.role, verified_at = excluded.verified_at
  `;
  console.log("[creds] admin@auti.hr → admin1234 (role=admin)");

  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
