/**
 * Provjera seed podataka BEZ pokretanja aplikacije.
 * 1) broj oglasa po (category, subcategory) — traži se 20+
 * 2) kolizije naslovnih slika — ista naslovna na dva različita modela = bug
 * 3) subcategory typo — svaki slug mora postojati u categories.ts
 * Pokretanje: npx tsx scripts/check-seed.mts
 */
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import path from "node:path";

// listings.ts/categories.ts koriste `@/` alias koji tsx NE razrješava — direktan
// import padne s "does not provide an export named LISTINGS". Isti zaobilazak kao
// scripts/seed-supabase.mts: bundlaj esbuildom (već je dependency) pa importaj.
const bundlePath = "/tmp/auti-listings-check.mjs";
const listingsSrc = path.resolve(import.meta.dirname, "../src/data/listings.ts");
const tsconfig = path.resolve(import.meta.dirname, "../tsconfig.json");
execSync(
  `npx esbuild ${listingsSrc} --bundle --platform=node --format=esm --target=es2020 --tsconfig=${tsconfig} --outfile=${bundlePath}`,
  { stdio: "ignore" }
);
const { LISTINGS } = (await import(bundlePath)) as typeof import("../src/data/listings");

// Slugove čitamo iz teksta (izbjegava drugi alias-import).
const CATEGORIES_SRC = readFileSync(
  path.resolve(import.meta.dirname, "../src/data/categories.ts"),
  "utf8"
);

// ── 1) brojanje po rubrici ────────────────────────────────────────────────
const counts = new Map<string, number>();
for (const l of LISTINGS) {
  const key = `${l.category}/${l.subcategory ?? "(bez)"}`;
  counts.set(key, (counts.get(key) ?? 0) + 1);
}
const under = [...counts.entries()].filter(([, n]) => n < 20).sort();
console.log(`UKUPNO oglasa: ${LISTINGS.length}`);
console.log(`rubrika: ${counts.size}`);
console.log(under.length ? `⚠️ rubrika s <20:` : `✅ sve rubrike imaju 20+`);
for (const [k, n] of under) console.log(`   ${k}: ${n}`);

// ── 2) kolizije naslovnih slika ───────────────────────────────────────────
const lead = new Map<string, Set<string>>();
for (const l of LISTINGS) {
  const first = l.images[0];
  if (!first) continue;
  const id = first.split("/").pop()?.split("?")[0] ?? first;
  const model = `${l.make} ${l.model}`;
  if (!lead.has(id)) lead.set(id, new Set());
  lead.get(id)!.add(model);
}
const collisions = [...lead.entries()].filter(([, m]) => m.size > 1);
console.log(collisions.length ? `\n⚠️ KOLIZIJE naslovne slike:` : `\n✅ 0 kolizija naslovne slike`);
for (const [id, models] of collisions) {
  console.log(`   ${id} → ${[...models].join(", ")}`);
}

// ── 3) subcategory typo guard ─────────────────────────────────────────────
const valid = new Set<string>(
  [...CATEGORIES_SRC.matchAll(/slug:\s*"([a-z0-9-]+)"/g)].map((m) => m[1])
);
const bad = [...new Set(LISTINGS.map((l) => l.subcategory).filter(Boolean))]
  .filter((s) => !valid.has(s as string));
console.log(bad.length ? `\n⚠️ NEPOSTOJEĆI subcategory slug: ${bad.join(", ")}` : `\n✅ 0 subcategory typo`);

// ── 4) slike bez fallbacka ────────────────────────────────────────────────
const noImg = LISTINGS.filter((l) => !l.images?.length).length;
console.log(noImg ? `\n⚠️ oglasa bez slike: ${noImg}` : `✅ svi oglasi imaju sliku`);

if (under.length || collisions.length || bad.length || noImg) process.exit(1);
