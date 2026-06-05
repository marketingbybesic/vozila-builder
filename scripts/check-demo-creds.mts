import postgres from "postgres";
import { compare } from "bcrypt-ts";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false, max: 2 });
const r = await sql`select id, email, substring(password_hash, 1, 7) as prefix, length(password_hash) as len, role, verified_at, banned_at from users where email in ('demo@auti.hr','admin@auti.hr')`;
console.log(r);
const full = await sql`select password_hash from users where email='demo@auti.hr'`;
console.log("demo1234 matches:", await compare("demo1234", full[0]!.password_hash));
const fullA = await sql`select password_hash from users where email='admin@auti.hr'`;
console.log("admin1234 matches:", await compare("admin1234", fullA[0]!.password_hash));
await sql.end();
