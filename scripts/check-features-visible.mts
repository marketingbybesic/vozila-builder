/**
 * Guard: svaka opcija opreme koju OBJAVA nudi mora biti VIDLJIVA na detaljnoj.
 *
 * Detaljna je nekad filtrirala kroz ručni `FEATURE_CATEGORIES` (57 stavki) →
 * 153 od 166 opcija iz rundе 19 prodavač označi, a kupac ih NIKAD ne vidi
 * (Dino 02.08.). Sad prikaz ide preko `featureGroupsFor()` = shema + "Ostala
 * oprema" za neprepoznato. Ovaj guard to i dokazuje: simulira oglas sa SVIM
 * opcijama i traži da se svaka pojavi u izlazu funkcije prikaza.
 */
import { FILTER_DEFS } from "../src/data/category-filters";
import { featureGroupsFor } from "../src/lib/listing-fields";
import type { Listing } from "../src/lib/types";

// Sve opcije opreme koje objava nudi, po kategoriji.
const poKategoriji = new Map<string, Set<string>>();
for (const [cat, def] of Object.entries(FILTER_DEFS)) {
  const set = new Set<string>();
  for (const f of (def.fields ?? []) as Array<Record<string, unknown>>) {
    if (f.type !== "multi") continue;
    const opts = f.options as Array<{ value: string; label: string }> | undefined;
    if (!opts) continue;
    for (const o of opts) {
      const label = typeof o === "string" ? o : o.label;
      if (label) set.add(label);
    }
  }
  if (set.size) poKategoriji.set(cat, set);
}

let ukupno = 0;
let nevidljivo = 0;

for (const [cat, opcije] of poKategoriji) {
  const listing = {
    category: cat,
    subcategory: undefined,
    features: [...opcije],
    attributes: {},
  } as unknown as Listing;

  const prikazane = new Set<string>();
  for (const g of featureGroupsFor(listing)) for (const i of g.items) prikazane.add(i.label);

  const fale = [...opcije].filter((o) => !prikazane.has(o));
  ukupno += opcije.size;
  nevidljivo += fale.length;

  console.log(`${fale.length === 0 ? "✅" : "❌"} ${cat}: ${opcije.size} opcija → prikazano ${prikazane.size}`);
  for (const f of fale.slice(0, 5)) console.log(`     ❌ "${f}"`);
  if (fale.length > 5) console.log(`     … i još ${fale.length - 5}`);
}

console.log(
  nevidljivo === 0
    ? `\n✅ svih ${ukupno} opcija opreme vidljivo je na detaljnoj stranici`
    : `\n❌ ${nevidljivo}/${ukupno} opcija prodavač označi, a kupac NE VIDI`
);
process.exit(nevidljivo === 0 ? 0 : 1);
