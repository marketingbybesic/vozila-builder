import { getFilterDefs, groupFields, type FilterField } from "@/data/category-filters";
import type { Listing } from "@/lib/types";

/**
 * JEDAN izvor istine: koja su polja SMISLENA za pojedini oglas.
 *
 * Karlo 31.07: oglas "John Deere Filter kit" (kategorija: dijelovi) prikazivao je
 * "Kilometraža 0 km · Gorivo Benzin · Mjenjač Automatski · Karoserija Limuzina ·
 * Vrata 4". Ništa od toga nema veze s filterom za traktor.
 *
 * Uzrok je dvostruk:
 *  1. `Listing` tip traži svih 10 auto-kolona kao OBAVEZNE, pa objava i seed
 *     upisuju lažne fallbackove (`fuel: "Benzin"`, `bodyType: "Microcar"`,
 *     `doors: 5`…) i za kategorije koje ta polja uopće nemaju.
 *  2. Prikaz je te kolone čitao BEZ IKAKVE PROVJERE — detaljna stranica,
 *     kartica oglasa, usporedba, moji oglasi, admin i feed novih oglasa.
 *
 * Umjesto da svako od tih šest mjesta ima vlastitu logiku (i da se opet raziđu),
 * ovdje se pita SHEMA: ako `category-filters.ts` za tu (kategoriju, podkategoriju)
 * ne definira polje, ono se ne prikazuje. Shema je ionako već izvor istine za
 * pretragu i objavu — sad je i za prikaz.
 */

/** Ima li oglas smisleno polje s tim ključem (poštuje `scope` podkategorije)? */
export function listingHasField(listing: Pick<Listing, "category" | "subcategory">, key: string): boolean {
  const def = getFilterDefs(listing.category);
  return def.fields.some((f) => {
    if (f.key !== key) return false;
    if (f.scope && f.scope.length > 0) {
      return listing.subcategory ? f.scope.includes(listing.subcategory) : false;
    }
    return true;
  });
}

/** Sva polja sheme relevantna za ovaj oglas (bez onih koja su samo filter pretrage). */
export function relevantFields(listing: Pick<Listing, "category" | "subcategory">): FilterField[] {
  const def = getFilterDefs(listing.category);
  return def.fields.filter((f) => {
    if (f.searchOnly) return false;
    if (f.scope && f.scope.length > 0) {
      return listing.subcategory ? f.scope.includes(listing.subcategory) : false;
    }
    return true;
  });
}

/** Čitljiva vrijednost atributa (šifra → naziv iz sheme). */
function attrLabel(field: FilterField, raw: unknown): string | null {
  if (raw === undefined || raw === null || raw === "" || raw === false) return null;
  // Kataloški broj od 2-3 znamenke nije kataloški broj nego zaostatak lošeg
  // parsiranja naslova (širina gume "225" završila je kao OEM). Ne prikazuj.
  if (field.key === "oem" && /^\d{1,3}$/.test(String(raw))) return null;
  if (Array.isArray(raw)) {
    /**
     * ⚠️ Vrijednosti koje shema više NE nudi ne smiju procuriti kao sirovi ključ.
     * "prvi-vlasnik" je 04.08.2026. maknut iz `ownership` (zamijenio ga
     * `numOwners` = 1), ali postojeći oglasi ga i dalje imaju u bazi — bez ovog
     * filtra na oglasu je pisalo doslovno "prvi-vlasnik".
     * Vrijednosti bez oznake u shemi preskačemo; poznate prikazujemo normalno.
     */
    const names = raw
      .map((v) => {
        const hit = field.options?.find((o) => o.value === v)?.label;
        if (hit) return hit;
        // Polje BEZ popisa opcija (slobodan unos) — vrijednost je jedini podatak
        // koji imamo, pa je zadržavamo. Polje S popisom: nepoznata vrijednost je
        // zaostatak ukinute opcije → preskoči (inače sirovi ključ na oglasu).
        return field.options?.length ? null : String(v);
      })
      .filter((l): l is string => l !== null);
    if (names.length === 0) return null;
    return names.join(", ");
  }
  if (raw === true) return "Da";
  const s = String(raw);
  /**
   * "Broj vlasnika" (Dino 04.08.2026) → "1. vlasnik" / "2. vlasnik" /
   * "Više od 4 vlasnika". Prije je pisala gola brojka ("2").
   *
   * ⚠️ STARE VRIJEDNOSTI IZ BAZE: prije 04.08. opcija je bila `"4"` s oznakom
   * "4+", a oglasi su mogli spremiti i goli broj. Podnosimo sve oblike:
   *   "5plus" | "4+" | "5"+ → "Više od 4 vlasnika"
   *   "1".."4"             → "N. vlasnik"
   *   bilo što drugo       → vraća se neizmijenjeno (nikad prazan prikaz)
   */
  if (field.key === "numOwners") {
    if (s === "5plus" || s === "4+" || s === "5+") return "Više od 4 vlasnika";
    const n = Number(s);
    if (Number.isFinite(n) && n > 0) {
      return n > 4 ? "Više od 4 vlasnika" : `${n}. vlasnik`;
    }
    return s;
  }
  // "YYYY-MM" (prva registracija, tehnički vrijedi do) → "7/2019".
  // Bez ovoga bi prikaz oglasa pokazivao sirovi "2019-07".
  if (field.type === "monthyear") {
    const m = /^(\d{4})-(\d{2})$/.exec(s);
    return m ? `${Number(m[2])}/${m[1]}` : null;
  }
  // Raspon "min..max" (npr. nosivost) → čitljivo
  if (s.includes("..")) {
    const [lo, hi] = s.split("..");
    const u = field.unit ? ` ${field.unit}` : "";
    if (lo && hi) return `${lo}–${hi}${u}`;
    if (hi) return `do ${hi}${u}`;
    if (lo) return `od ${lo}${u}`;
    return null;
  }
  const opt = field.options?.find((o) => o.value === s);
  if (opt) return opt.label;
  return field.unit ? `${s} ${field.unit}` : s;
}

export type SpecGroup = { name: string; items: Array<{ label: string; value: string }> };

/**
 * Grupe specifikacija za PRIKAZ oglasa — samo popunjena, smislena polja.
 *
 * Vraća i tipizirane kolone (km, gorivo…) i `attributes` (širina gume, nosivost
 * viličara, broj ležišta kampera) — dosad se `attributes` nisu prikazivali NIGDJE,
 * pa oglas za gumu nije pokazivao ni širinu ni profil ni sezonu.
 */
export function specGroupsFor(listing: Listing): SpecGroup[] {
  const fields = relevantFields(listing);

  // Vrijednost tipizirane kolone; `null` ako je očito fallback smeće.
  const columnValue = (key: string): string | null => {
    switch (key) {
      case "km":
        return listing.km > 0 ? `${listing.km.toLocaleString("hr-HR")} km` : null;
      case "fuel":
        return listing.fuel || null;
      case "transmission":
        return listing.transmission || null;
      case "bodyType":
        return listing.bodyType || null;
      case "drive":
        return listing.drive || null;
      case "color":
        return listing.color || null;
      case "engineCc":
        return listing.engineCc > 0 ? `${listing.engineCc} cm³` : null;
      case "powerKw":
        return listing.powerKw > 0
          ? `${listing.powerKw} kW (${Math.round(listing.powerKw * 1.36)} KS)`
          : null;
      case "doors":
        return listing.doors > 0 ? String(listing.doors) : null;
      case "seats":
        return listing.seats > 0 ? String(listing.seats) : null;
      default:
        return null;
    }
  };

  const out: SpecGroup[] = [];
  for (const g of groupFields(fields)) {
    const items: Array<{ label: string; value: string }> = [];
    for (const f of g.fields) {
      const value =
        f.storage === "column"
          ? columnValue(f.key)
          : attrLabel(f, (listing.attributes as Record<string, unknown> | undefined)?.[f.key]);
      if (value) items.push({ label: f.label, value });
    }
    if (items.length) out.push({ name: g.name, items });
  }
  return out;
}

/**
 * Kratki sažetak za KARTICU oglasa (max 3 podatka).
 *
 * Auto/moto dobiju godina · km · gorivo; dijelovi dobiju stanje i količinu
 * umjesto izmišljenog "0 km · Benzin".
 */
export function cardSummary(listing: Listing): string[] {
  const out: string[] = [];
  const has = (k: string) => listingHasField(listing, k);
  const attrs = (listing.attributes ?? {}) as Record<string, unknown>;

  if (listing.year > 0) out.push(`${listing.year}.`);
  if (has("km") && listing.km > 0) out.push(`${listing.km.toLocaleString("hr-HR")} km`);
  if (has("fuel") && listing.fuel) out.push(listing.fuel);

  // Nevozila: popuni smislenim podatkom umjesto praznine.
  if (out.length < 3) {
    const partState = attrs.condition2 ?? attrs.partCondition;
    if (typeof partState === "string" && partState) out.push(partState === "novo" ? "Novo" : "Rabljeno");
    else if (listing.condition) out.push(listing.condition);
  }
  if (out.length < 3 && has("operatingHours")) {
    const h = attrs.operatingHours;
    if (h) out.push(`${String(h).replace("..", "–")} h`);
  }
  return out.slice(0, 3);
}

/** Je li oglas vozilo? (kredit-kalkulator, VIN provjera i sl. nemaju smisla za dijelove.) */
export function isVehicle(listing: Pick<Listing, "category">): boolean {
  return listing.category !== "dijelovi";
}

/**
 * Oprema oglasa grupirana po rubrikama IZ SHEME.
 *
 * ⚠️⚠️ Dino 02.08.: "na prikazu oglasa moraju biti svi podaci s pregleda".
 * Detaljna je opremu filtrirala kroz ručni `FEATURE_CATEGORIES` (57 stavki),
 * a runda 19 je uvela 129 novih opcija iz sheme → **153 od 166 opcija
 * prodavač označi, vidi ih na pregledu, a na oglasu NESTANU**.
 * Shema je izvor istine za pretragu, objavu i prikaz — pa i za opremu.
 * Guard: `scripts/check-features-visible.mts`.
 */
export function featureGroupsFor(listing: Listing): SpecGroup[] {
  const selected = new Set(listing.features ?? []);
  if (selected.size === 0) return [];

  const out: SpecGroup[] = [];
  const seen = new Set<string>();

  for (const f of relevantFields(listing)) {
    if (!f.options || f.type !== "multi") continue;
    const hits: string[] = [];
    for (const o of f.options) {
      /**
       * ⚠️⚠️ Uspoređujemo i VRIJEDNOST i OZNAKU (Dino 03.08.).
       * Objava sprema `features` kao VRIJEDNOSTI (`"bi-ksenon"`), a prva verzija
       * ove funkcije tražila je samo OZNAKE (`"Bi-ksenonska svjetla"`) → sva
       * oprema padala je u "Ostala oprema" kao sirovi ključevi, umjesto u
       * rubrike Sigurnost / Multimedija / Udobnost…
       * Prihvaćamo oboje: novi oglasi šalju vrijednosti, stariji oznake.
       */
      const value = typeof o === "string" ? o : o.value;
      const label = typeof o === "string" ? o : o.label;
      const key = selected.has(value) ? value : selected.has(label) ? label : null;
      if (key && !seen.has(key)) {
        hits.push(label); // uvijek prikazujemo ČITLJIVU oznaku
        seen.add(key);
      }
    }
    if (!hits.length) continue;
    /**
     * ⚠️ Rubrika opreme je u `label`, NE u `group`. Svih 33 polja opreme dijele
     * `group: "Dodatne opcije"`, a prava podjela (Sigurnost / Podvozje i ovjes /
     * Unutrašnjost / Multimedija / Udobnost / Praktičnost) stoji u `label`.
     * Po `group` bi svih 184 stavki palo u jednu hrpu.
     */
    const name = f.label || f.group || "Oprema";
    const existing = out.find((g) => g.name === name);
    if (existing) existing.items.push(...hits.map((v) => ({ label: v, value: "" })));
    else out.push({ name, items: hits.map((v) => ({ label: v, value: "" })) });
  }

  // Sve što shema ne prepoznaje (stari oglasi, ručni unosi) — da ništa ne nestane.
  const ostalo = [...selected].filter((f) => !seen.has(f));
  if (ostalo.length) out.push({ name: "Ostala oprema", items: ostalo.map((v) => ({ label: v, value: "" })) });

  return out;
}
