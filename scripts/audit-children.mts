/**
 * Koje podkategorije 2. NIVOA nemaju nijedan oglas?
 * Drill-down radi preko `attributes.vrsta` (vidi subChildHref).
 * Pokretanje: npx tsx --env-file=.env.local scripts/audit-children.mts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const src = readFileSync(
  path.resolve(import.meta.dirname, "../src/data/categories.ts"),
  "utf8"
);

// Parent → djeca, iz teksta (izbjegava `@/` alias problem u tsx-u).
type Parent = { parent: string; children: string[] };
const parents: Parent[] = [];
const re = /slug: "([a-z0-9-]+)",\s*\n\s*name: "[^"]+",\s*\n\s*children: \[([\s\S]*?)\n\s{4}\],/g;
let m: RegExpExecArray | null;
while ((m = re.exec(src))) {
  const kids = [...m[2].matchAll(/slug: "([a-z0-9-]+)"/g)].map((k) => k[1]);
  parents.push({ parent: m[1], children: kids });
}

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });
const rows = await sql<{ subcategory: string | null; vrsta: string | null; c: number }[]>`
  select subcategory, attributes->>'vrsta' as vrsta, count(*)::int as c
  from listings where status = 'active'
  group by subcategory, attributes->>'vrsta'
`;

const have = new Map<string, number>();
for (const r of rows) {
  if (r.vrsta) have.set(`${r.subcategory}/${r.vrsta}`, r.c);
}

let empty = 0;
let total = 0;
console.log("PRAZNE podkategorije 2. nivoa:\n");
for (const p of parents) {
  const miss = p.children.filter((c) => !have.has(`${p.parent}/${c}`));
  total += p.children.length;
  empty += miss.length;
  if (miss.length) {
    console.log(`  ${p.parent}  (${miss.length}/${p.children.length} prazno)`);
    console.log(`     ${miss.join(", ")}`);
  }
}
console.log(`\nukupno djece: ${total} | praznih: ${empty} | popunjenih: ${total - empty}`);
await sql.end();
