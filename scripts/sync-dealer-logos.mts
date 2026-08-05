/**
 * Prepiše `logoUrl` u `src/data/dealers.ts` logotipima iz baze.
 *
 * Logotipe generira `scripts/seed-avatars.mts` i sprema ih u `users.avatar_url`.
 * Showcase na naslovnici čita STATIČNI `dealers.ts`, pa bi bez ove sinkronizacije
 * prikazivao prazan `logoUrl` (samo inicijale) dok profil trgovca pokazuje pravi
 * znak — dva različita lica istog trgovca.
 *
 * Usage: npx tsx --env-file=.env.local scripts/sync-dealer-logos.mts
 */
import postgres from "postgres";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("[logos] DATABASE_URL nije postavljen.");
  process.exit(1);
}
const sql = postgres(DATABASE_URL, { max: 1, prepare: false });

const rows = await sql<{ email: string; avatar_url: string | null }[]>`
  select email, avatar_url from users where seller_type = 'Trgovac'
`;
await sql.end();

// email je `<slug>@vozila.hr` → mapiraj na slug
const poSlugu = new Map<string, string>();
for (const r of rows) {
  const slug = r.email.replace("@vozila.hr", "");
  if (r.avatar_url) poSlugu.set(slug, r.avatar_url);
}

const file = path.resolve(import.meta.dirname, "../src/data/dealers.ts");
let src = readFileSync(file, "utf8");
let zamijenjeno = 0;

for (const [slug, logo] of poSlugu) {
  // Nađi blok tog trgovca i u njemu prazan logoUrl.
  const i = src.indexOf(`slug: "${slug}"`);
  if (i === -1) continue;
  // logoUrl stoji NEPOSREDNO iza sluga u istom objektu.
  const rezStart = src.indexOf('logoUrl: "', i);
  if (rezStart === -1) continue;
  const rezEnd = src.indexOf('"', rezStart + 'logoUrl: "'.length);
  const prije = src.slice(rezStart, rezEnd + 1);
  // Escapeaj navodnike u data-URI (SVG ih ima nakon encodeURIComponent — nema ih,
  // ali čuvamo se za slučaj promjene generatora).
  const novi = `logoUrl: "${logo.replace(/"/g, '\\"')}"`;
  src = src.slice(0, rezStart) + novi + src.slice(rezEnd + 1);
  if (prije !== novi) zamijenjeno++;
}

writeFileSync(file, src, "utf8");
console.log(`[logos] Upisano logotipa u dealers.ts: ${zamijenjeno}`);
