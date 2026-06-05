/**
 * Populates `listings.attributes` jsonb with realistic per-category demo values
 * for all existing rows. Run AFTER the schema migration that adds the column.
 *
 * Strategy:
 *  - For each listing, generate a deterministic attribute object based on
 *    category + a couple of input fields (make/model/year/km/fuel).
 *  - Toggles are sprinkled with seeded randomness so the filter UI has real
 *    yes/no diversity to demo against.
 *  - Idempotent: re-running with the same input yields the same output.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/populate-attributes.mts
 */
import postgres from "postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

// Deterministic PRNG seeded from slug → stable output across re-runs.
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rand(seed: number, salt: string): number {
  const h = hash(seed + ":" + salt);
  return h / 0xffffffff;
}
function pick<T>(seed: number, salt: string, arr: T[]): T {
  return arr[Math.floor(rand(seed, salt) * arr.length)];
}
function flip(seed: number, salt: string, prob = 0.5): boolean {
  return rand(seed, salt) < prob;
}

type Row = {
  id: string;
  slug: string;
  category: string;
  subcategory: string | null;
  make: string;
  model: string;
  year: number;
  km: number;
  fuel: string;
  body_type: string;
  drive: string;
  power_kw: number;
  engine_cc: number;
};

function autoAttrs(r: Row): Record<string, unknown> {
  const seed = hash(r.slug);
  const isEV = r.fuel === "Električni";
  const isHybrid = r.fuel.includes("hibrid") || r.fuel.includes("Hibrid");
  return {
    // Motor/spec
    cylinders: isEV ? 0 : pick(seed, "cyl", [3, 4, 4, 4, 5, 6, 6, 8]),
    emissionStandard: r.year >= 2021 ? "Euro 6d" : r.year >= 2016 ? "Euro 6b" : r.year >= 2011 ? "Euro 5" : "Euro 4",
    co2Combined: isEV ? 0 : Math.round(80 + rand(seed, "co2") * 140),
    consumptionCombined: isEV ? null : Number((4 + rand(seed, "fc") * 6).toFixed(1)),
    // EV stack
    ...(isEV ? {
      evRangeKm: Math.round(280 + rand(seed, "evr") * 320),
      batteryKwh: Math.round(40 + rand(seed, "batt") * 60),
      heatPump: flip(seed, "hp", 0.65),
    } : {}),
    // Karoserija extras
    metallic: flip(seed, "met", 0.55),
    interiorMaterial: pick(seed, "intmat", ["Tkanina", "Koža", "Polukoža", "Alcantara"]),
    // Oprema → Klima
    climate: pick(seed, "clim", ["Manualna", "Auto 1-zone", "Auto 2-zone", "Auto 3-zone"]),
    heatedSeatsFront: flip(seed, "hsf", 0.55),
    heatedSeatsRear: flip(seed, "hsr", 0.18),
    // Oprema → Multimedia
    appleCarPlay: r.year >= 2018 && flip(seed, "acp", 0.7),
    androidAuto: r.year >= 2018 && flip(seed, "aa", 0.7),
    navigation: flip(seed, "nav", 0.55),
    headUpDisplay: flip(seed, "hud", 0.18),
    soundSystem: flip(seed, "snd", 0.22),
    wirelessCharging: r.year >= 2019 && flip(seed, "wc", 0.35),
    // Oprema → Sigurnost
    abs: true,
    esp: r.year >= 2009,
    laneAssist: r.year >= 2017 && flip(seed, "lka", 0.5),
    adaptiveCruise: r.year >= 2017 && flip(seed, "acc", 0.4),
    blindSpot: r.year >= 2017 && flip(seed, "bs", 0.3),
    autoHighBeam: r.year >= 2016 && flip(seed, "ahb", 0.4),
    matrixLed: r.year >= 2019 && flip(seed, "mled", 0.25),
    airbagsCount: pick(seed, "abc", [4, 6, 6, 8, 8, 10]),
    isofix: flip(seed, "iso", 0.9),
    // Oprema → Parking
    parkingSensorsFront: flip(seed, "psf", 0.55),
    parkingSensorsRear: flip(seed, "psr", 0.75),
    rearCamera: flip(seed, "rcam", 0.55),
    cam360: r.year >= 2018 && flip(seed, "c360", 0.18),
    // Oprema → Drugo
    panoramicRoof: flip(seed, "panr", 0.15),
    keylessGo: flip(seed, "klg", 0.35),
    electricTailgate: flip(seed, "etg", 0.2),
    towHook: flip(seed, "tow", 0.25),
    sportPackage: flip(seed, "sport", 0.2),
    // Pravno / Povijest
    firstOwner: flip(seed, "1own", 0.55),
    nonSmoker: flip(seed, "nons", 0.6),
    serviceHistory: flip(seed, "sh", 0.85) ? "Potpuna" : "Djelomična",
    warranty: r.year >= 2022 ? "Tvornička" : flip(seed, "war", 0.2) ? "Produžena" : "Nema",
    inspection: r.year >= 2024 ? "Nije potreban" : flip(seed, "insp", 0.7) ? "Važeći" : "Istekao",
  };
}

function motoAttrs(r: Row): Record<string, unknown> {
  const seed = hash(r.slug);
  const isEV = r.fuel === "Električni";
  return {
    motoCategory: pick(seed, "moc", ["Sport", "Naked", "Tourer", "Chopper", "Enduro", "Supermoto"]),
    stroke: isEV ? "ev" : pick(seed, "str", ["2T", "4T", "4T", "4T"]),
    cylinders: isEV ? 0 : pick(seed, "cyl", [1, 1, 2, 2, 3, 4]),
    drivetrain: pick(seed, "dt", ["Lanac", "Lanac", "Remen", "Kardan"]),
    licenceClass: r.engine_cc <= 50 ? "AM" : r.engine_cc <= 125 ? "A1" : r.engine_cc <= 400 ? "A2" : "A",
    abs: r.year >= 2016,
    tractionControl: r.year >= 2017 && flip(seed, "tc", 0.55),
    quickshifter: flip(seed, "qs", 0.25),
    ridingModes: r.year >= 2018 && flip(seed, "rm", 0.5),
    heatedGrips: flip(seed, "hg", 0.25),
    cruiseControl: flip(seed, "cc", 0.15),
    crashBars: flip(seed, "cb", 0.3),
    topCase: flip(seed, "tc2", 0.3),
    sideBags: flip(seed, "sb", 0.2),
    serviceHistory: flip(seed, "sh", 0.85) ? "Potpuna" : "Djelomična",
    warranty: r.year >= 2023 ? "Tvornička" : "Nema",
  };
}

function gospodarskaAttrs(r: Row): Record<string, unknown> {
  const seed = hash(r.slug);
  const isTruck = (r.subcategory ?? "").toLowerCase().includes("kamion");
  return {
    priceVat: flip(seed, "vat", 0.9) ? "S PDV" : "Bez PDV",
    gvwKg: isTruck ? Math.round(18000 + rand(seed, "gvw") * 22000) : Math.round(3500 + rand(seed, "gvw") * 4500),
    payloadKg: isTruck ? Math.round(8000 + rand(seed, "pay") * 12000) : Math.round(900 + rand(seed, "pay") * 2200),
    axles: isTruck ? pick(seed, "ax", [2, 2, 3, 4]) : 2,
    euroNorm: r.year >= 2021 ? "Euro VI" : r.year >= 2014 ? "Euro V" : "Euro IV",
    wheelbaseMm: Math.round(3200 + rand(seed, "wb") * 2400),
    rearDoors: flip(seed, "rd", 0.7),
    sideDoors: flip(seed, "sd", 0.4) ? 1 : 0,
    abs: true,
    esp: r.year >= 2014,
    retarder: isTruck && flip(seed, "ret", 0.4),
    tachograph: isTruck,
    refrigeration: flip(seed, "ref", 0.18),
    lifgate: flip(seed, "lift", 0.15),
    sleeperCab: isTruck && flip(seed, "sl", 0.45),
    cruiseControl: r.year >= 2014,
    airSuspension: flip(seed, "as", 0.35),
    navigation: flip(seed, "nav", 0.3),
    serviceHistory: flip(seed, "sh", 0.85) ? "Potpuna" : "Djelomična",
    warranty: r.year >= 2023 ? "Tvornička" : "Nema",
    inspection: r.year >= 2024 ? "Nije potreban" : flip(seed, "insp", 0.7) ? "Važeći" : "Istekao",
  };
}

function mehanizacijaAttrs(r: Row): Record<string, unknown> {
  const seed = hash(r.slug);
  return {
    operatingHours: Math.round(500 + rand(seed, "oh") * 8000),
    weightKg: Math.round(2000 + rand(seed, "w") * 18000),
    bucketCapacity: Number((0.4 + rand(seed, "bc") * 1.6).toFixed(1)),
    drive4x4: flip(seed, "4x4", 0.7),
    cabin: flip(seed, "cab", 0.85),
    airConditioning: flip(seed, "ac", 0.6),
    frontLoader: flip(seed, "fl", 0.4),
    rearLoader: flip(seed, "rl", 0.3),
    gps: flip(seed, "gps", 0.35),
    rubberTracks: flip(seed, "rt", 0.5),
    quickCoupler: flip(seed, "qc", 0.6),
    hydraulicHammer: flip(seed, "hh", 0.2),
    serviceHistory: flip(seed, "sh", 0.85) ? "Potpuna" : "Djelomična",
    warranty: r.year >= 2023 ? "Tvornička" : "Nema",
  };
}

function prostiCasAttrs(r: Row): Record<string, unknown> {
  const seed = hash(r.slug);
  const isBoat = (r.subcategory ?? "").toLowerCase().includes("plov") || (r.subcategory ?? "").toLowerCase().includes("brod");
  return {
    sleeps: isBoat ? pick(seed, "sl", [2, 4, 4, 6, 8]) : pick(seed, "sl", [2, 4, 4, 5, 6]),
    lengthM: Number((4 + rand(seed, "lm") * 5).toFixed(1)),
    widthM: Number((1.8 + rand(seed, "wm") * 1.2).toFixed(2)),
    heightM: Number((2.4 + rand(seed, "hm") * 0.6).toFixed(2)),
    engineHp: Math.round(40 + rand(seed, "ehp") * 220),
    engineHours: isBoat ? Math.round(200 + rand(seed, "eh") * 1800) : null,
    hullMaterial: isBoat ? pick(seed, "hull", ["GRP", "Aluminij", "PVC"]) : null,
    wc: flip(seed, "wc", 0.85),
    kitchen: flip(seed, "kit", 0.9),
    shower: flip(seed, "sh", 0.75),
    ac: flip(seed, "ac", 0.6),
    solar: flip(seed, "sol", 0.45),
    awning: flip(seed, "aw", 0.7),
    tv: flip(seed, "tv", 0.5),
    heating: flip(seed, "ht", 0.65),
    bikeRack: flip(seed, "br", 0.3),
    serviceHistory: flip(seed, "shx", 0.85) ? "Potpuna" : "Djelomična",
  };
}

function dijeloviAttrs(r: Row): Record<string, unknown> {
  const seed = hash(r.slug);
  return {
    partType: pick(seed, "pt", ["OEM", "Aftermarket", "Tuning", "Polovni"]),
    compatibleWith: `${r.make} ${r.model}`,
    warranty: flip(seed, "war", 0.6) ? "12 mjeseci" : "Bez garancije",
    shipping: flip(seed, "ship", 0.85),
    condition: pick(seed, "cond", ["Novo", "Rabljeno", "Obnovljeno"]),
  };
}

async function main() {
  const sql = postgres(DATABASE_URL!, { prepare: false, max: 4, idle_timeout: 5 });
  console.log("[populate-attrs] Loading listings...");
  const rows = await sql<Row[]>`
    select id, slug, category, subcategory, make, model, year, km, fuel,
           body_type, drive, power_kw, engine_cc
    from listings
    where status <> 'deleted'
  `;
  console.log(`[populate-attrs] ${rows.length} rows.`);

  let updated = 0;
  for (const r of rows) {
    let attrs: Record<string, unknown> = {};
    switch (r.category) {
      case "auto": attrs = autoAttrs(r); break;
      case "moto": attrs = motoAttrs(r); break;
      case "gospodarska": attrs = gospodarskaAttrs(r); break;
      case "mehanizacija": attrs = mehanizacijaAttrs(r); break;
      case "prosti-cas": attrs = prostiCasAttrs(r); break;
      case "dijelovi": attrs = dijeloviAttrs(r); break;
      default: attrs = autoAttrs(r);
    }
    await sql`update listings set attributes = ${sql.json(attrs as Record<string, never>)}, updated_at = now() where id = ${r.id}`;
    updated++;
  }

  console.log(`[populate-attrs] ${updated} updated.`);
  const stats = await sql`
    select category, count(*)::int as n,
           avg(jsonb_array_length(coalesce(jsonb_object_keys(attributes), '[]'::jsonb)))::int as not_used
    from listings group by category order by category
  `.catch(() => null);
  if (stats) console.log("[populate-attrs] Per-category:", stats);
  await sql.end({ timeout: 5 });
}

main().catch((e) => {
  console.error("[populate-attrs] FAILED", e);
  process.exit(1);
});
