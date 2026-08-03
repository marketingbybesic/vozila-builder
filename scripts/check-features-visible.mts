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

/**
 * ⚠️⚠️ Testiramo OBA OBLIKA (Dino 03.08.).
 * Objava sprema `features` kao VRIJEDNOSTI (`"bi-ksenon"`), a stariji oglasi
 * imaju OZNAKE (`"Bi-ksenonska svjetla"`). Prva verzija ovog guarda slala je
 * samo oznake — pa je javljala 556/556 dok je u stvarnosti SVA oprema iz
 * objave padala u "Ostala oprema" kao sirovi ključ.
 */
type Slucaj = { cat: string; sub?: string; vrijednosti: string[]; oznake: string[] };
const slucajevi: Slucaj[] = [];

for (const [cat, def] of Object.entries(FILTER_DEFS)) {
  /**
   * ⚠️ Grupiramo po PODKATEGORIJI iz `scope`. Gospodarska oprema ima
   * `scope: ["autobusi"]` — bez podkategorije `relevantFields()` je izbaci,
   * pa je guard testirao nemoguć slučaj i lažno javljao 32 nevidljive opcije.
   */
  const poSub = new Map<string | undefined, { vrijednosti: string[]; oznake: string[] }>();

  for (const f of (def.fields ?? []) as Array<Record<string, unknown>>) {
    if (f.type !== "multi") continue;
    // Samo OPREMA (`storage: "attr"`). `doors`/`seats` su tipizirane KOLONE —
    // prikazuju se kroz specifikacije (`specGroupsFor`), ne kroz `features`.
    if (f.storage !== "attr") continue;
    /**
     * OPREMA = isključivo `group: "Dodatne opcije"`.
     * Ostala `multi` polja su SVOJSTVA ARTIKLA i idu kroz `specGroupsFor`:
     *   "Vrsta" (podkategorija 2. nivoa → `attributes.vrsta`),
     *   "Gume"/"Felge" (sezona, namjena), "Povijest", "Ostalo", "Detalji".
     */
    if (f.group !== "Dodatne opcije") continue;
    const opts = f.options as Array<{ value: string; label: string }> | undefined;
    if (!opts) continue;

    const scope = f.scope as string[] | undefined;
    const sub = scope?.length ? scope[0] : undefined;
    const bucket = poSub.get(sub) ?? { vrijednosti: [], oznake: [] };
    for (const o of opts) {
      const value = typeof o === "string" ? o : o.value;
      const label = typeof o === "string" ? o : o.label;
      if (value) bucket.vrijednosti.push(value);
      if (label) bucket.oznake.push(label);
    }
    poSub.set(sub, bucket);
  }

  for (const [sub, b] of poSub) {
    if (b.oznake.length) slucajevi.push({ cat, sub, ...b });
  }
}

let ukupno = 0;
let nevidljivo = 0;

for (const { cat, sub, vrijednosti, oznake } of slucajevi) {
  for (const [oblik, features] of [
    ["vrijednosti (kako sprema objava)", vrijednosti],
    ["oznake (stariji oglasi)", oznake],
  ] as const) {
    const listing = {
      category: cat,
      subcategory: sub,
      features,
      attributes: {},
    } as unknown as Listing;

    const grupe = featureGroupsFor(listing);
    const prikazane = new Set<string>();
    for (const g of grupe) for (const i of g.items) prikazane.add(i.label);
    // Sve što je završilo u "Ostala oprema" = shema ga NIJE prepoznala.
    const uOstalo = grupe.find((g) => g.name === "Ostala oprema")?.items.map((i) => i.label) ?? [];

    ukupno += features.length;
    nevidljivo += uOstalo.length;

    const ok = uOstalo.length === 0;
    console.log(
      `${ok ? "✅" : "❌"} ${cat}${sub ? "/" + sub : ""} · ${oblik}: ${features.length} → ${prikazane.size} u rubrikama` +
        (ok ? "" : `, ${uOstalo.length} u "Ostala oprema"`)
    );
    for (const f of uOstalo.slice(0, 5)) console.log(`     ❌ "${f}"`);
    if (uOstalo.length > 5) console.log(`     … i još ${uOstalo.length - 5}`);
  }
}

console.log(
  nevidljivo === 0
    ? `\n✅ svih ${ukupno} opcija opreme vidljivo je na detaljnoj stranici`
    : `\n❌ ${nevidljivo}/${ukupno} opcija prodavač označi, a kupac NE VIDI`
);
process.exit(nevidljivo === 0 ? 0 : 1);
