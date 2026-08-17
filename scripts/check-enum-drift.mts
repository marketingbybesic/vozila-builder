/**
 * Guard: vrijednosti koje OBJAVA nudi vs ENUM koji baza/zod prihvaća.
 * Razilaženje = "Objavi oglas" tiho padne na validaciji (Karlo 01.08.).
 */
// ⚠️ Bez `"type": "module"` u package.json tsx ucitava .ts kao CJS, pa imenovani
// ESM import padne ("does not provide an export named …") — a default-import
// zadovolji tsx ali srusi `tsc` (modul nema pravi default). `createRequire`
// prolazi OBA. Ne vracaj na `import { … } from "…"`.
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { FUEL_TYPES, ALL_TRANSMISSIONS, ALL_BODY_TYPES, DRIVES, COLORS, CONDITIONS } =
  require("../src/lib/types") as typeof import("../src/lib/types");
const { FILTER_DEFS } =
  require("../src/data/category-filters") as typeof import("../src/data/category-filters");

// Iste liste koje `createListingAction` koristi za validaciju.
const ENUMS: Record<string, readonly string[]> = {
  fuel: FUEL_TYPES,
  transmission: ALL_TRANSMISSIONS,
  bodyType: ALL_BODY_TYPES,
  drive: DRIVES,
  color: COLORS,
  condition: CONDITIONS,
};

let bad = 0;
const seen = new Set<string>();

for (const [cat, def] of Object.entries(FILTER_DEFS)) {
  for (const f of (def.fields ?? []) as Array<Record<string, unknown>>) {
    const key = String(f.key);
    const en = ENUMS[key];
    if (!en) continue;
    const opts = f.options as Array<{ value: string; label: string }> | undefined;
    if (!opts) continue;
    for (const o of opts) {
      const v = typeof o === "string" ? o : o.value;
      const id = `${key}|${v}`;
      if (seen.has(id)) continue;
      seen.add(id);
      if (!en.includes(v)) {
        console.log(`❌ ${cat} · ${key} nudi "${v}" — NIJE u enumu [${en.join(" | ")}]`);
        bad++;
      }
    }
  }
}

console.log(bad === 0
  ? "\n✅ sve vrijednosti objave postoje u enumima baze"
  : `\n❌ ${bad} vrijednosti bi srušilo "Objavi oglas" (zod odbija → oglas se ne stvori)`);
process.exit(bad === 0 ? 0 : 1);
