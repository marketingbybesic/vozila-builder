import type { Listing, ListingFilters, SortOption } from "@/lib/types";
import { slugify } from "@/lib/utils";

function asArray(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return Array.isArray(v) ? v : v.split(",").filter(Boolean);
}

function asNumber(v: string | string[] | undefined): number | undefined {
  if (!v) return undefined;
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

function asString(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined;
  return Array.isArray(v) ? v[0] : v;
}

export function parseFilters(
  sp: Record<string, string | string[] | undefined>
): ListingFilters {
  return {
    q: asString(sp.q),
    category: asString(sp.category) as ListingFilters["category"],
    subcategory: asString(sp.subcategory),
    make: asString(sp.make),
    model: asString(sp.model),
    priceMin: asNumber(sp.priceMin),
    priceMax: asNumber(sp.priceMax),
    yearMin: asNumber(sp.yearMin),
    yearMax: asNumber(sp.yearMax),
    kmMin: asNumber(sp.kmMin),
    kmMax: asNumber(sp.kmMax),
    powerMin: asNumber(sp.powerMin),
    powerMax: asNumber(sp.powerMax),
    engineMin: asNumber(sp.engineMin),
    engineMax: asNumber(sp.engineMax),
    fuel: asArray(sp.fuel) as ListingFilters["fuel"],
    transmission: asArray(sp.transmission) as ListingFilters["transmission"],
    bodyType: asArray(sp.bodyType) as ListingFilters["bodyType"],
    drive: asArray(sp.drive) as ListingFilters["drive"],
    doors: asArray(sp.doors),
    seats: asArray(sp.seats),
    color: asArray(sp.color) as ListingFilters["color"],
    euroNorm: asArray(sp.euroNorm),
    condition: asArray(sp.condition) as ListingFilters["condition"],
    sellerType: asArray(sp.sellerType) as ListingFilters["sellerType"],
    county: asString(sp.county),
    sort: (asString(sp.sort) as SortOption) ?? "newest",
    page: asNumber(sp.page) ?? 1,
    attrs: parseAttrs(sp),
  };
}

const RESERVED_PARAMS = new Set([
  "q", "category", "subcategory", "make", "model",
  "priceMin", "priceMax", "yearMin", "yearMax", "kmMin", "kmMax",
  "powerMin", "powerMax", "engineMin", "engineMax",
  "fuel", "transmission", "bodyType", "drive", "doors", "seats",
  "color", "euroNorm", "condition",
  "sellerType", "county", "sort", "page",
]);

function parseAttrs(
  sp: Record<string, string | string[] | undefined>
): Record<string, string | number | boolean | string[]> | undefined {
  const out: Record<string, string | number | boolean | string[]> = {};
  let any = false;
  for (const [key, raw] of Object.entries(sp)) {
    if (RESERVED_PARAMS.has(key)) continue;
    if (!key.startsWith("a.")) continue;
    if (raw === undefined) continue;
    const attrKey = key.slice(2);
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === "" || value === undefined) continue;
    // booleans (toggles): "1" / "true"
    if (value === "1" || value === "true") { out[attrKey] = true; any = true; continue; }
    if (value === "0" || value === "false") { out[attrKey] = false; any = true; continue; }
    // numeric ranges encoded as "min..max"
    if (value.includes("..")) { out[attrKey] = value; any = true; continue; }
    // multi-select encoded as comma list
    if (value.includes(",")) { out[attrKey] = value.split(",").filter(Boolean); any = true; continue; }
    const asNum = Number(value);
    out[attrKey] = Number.isFinite(asNum) && !/^0\d/.test(value) && value.trim() !== "" && /^-?\d+(\.\d+)?$/.test(value)
      ? asNum
      : value;
    any = true;
  }
  return any ? out : undefined;
}

function attrMatches(
  attrs: Record<string, unknown> | null | undefined,
  filters: Record<string, string | number | boolean | string[]>
): boolean {
  if (!attrs) attrs = {};
  for (const [key, expected] of Object.entries(filters)) {
    const actual = (attrs as Record<string, unknown>)[key];
    if (typeof expected === "boolean") {
      if (Boolean(actual) !== expected) return false;
      continue;
    }
    if (Array.isArray(expected)) {
      if (expected.length === 0) continue;
      if (typeof actual !== "string") return false;
      if (!expected.includes(actual)) return false;
      continue;
    }
    if (typeof expected === "string" && expected.includes("..")) {
      const [minS, maxS] = expected.split("..");
      const min = minS ? Number(minS) : undefined;
      const max = maxS ? Number(maxS) : undefined;
      const n = typeof actual === "number" ? actual : Number(actual);
      if (!Number.isFinite(n)) return false;
      if (min !== undefined && n < min) return false;
      if (max !== undefined && n > max) return false;
      continue;
    }
    if (typeof expected === "number") {
      const n = typeof actual === "number" ? actual : Number(actual);
      if (n !== expected) return false;
      continue;
    }
    if (String(actual) !== String(expected)) return false;
  }
  return true;
}

function compare(sort: SortOption, a: Listing, b: Listing): number {
  switch (sort) {
    case "price-asc":
      return a.priceEur - b.priceEur;
    case "price-desc":
      return b.priceEur - a.priceEur;
    case "km-asc":
      return a.km - b.km;
    case "year-desc":
      return b.year - a.year;
    case "newest":
    default:
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }
}

export function applyFilters(
  listings: Listing[],
  f: ListingFilters
): Listing[] {
  let out = listings.filter((l) => {
    if (f.q) {
      const q = f.q.toLowerCase();
      const hay = `${l.title} ${l.make} ${l.model} ${l.variant ?? ""} ${l.description}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (f.category && l.category !== f.category) return false;
    if (f.subcategory && l.subcategory !== f.subcategory) return false;
    if (f.make && slugify(l.make) !== f.make) return false;
    if (f.model && l.model !== f.model) return false;
    if (f.priceMin !== undefined && l.priceEur < f.priceMin) return false;
    if (f.priceMax !== undefined && l.priceEur > f.priceMax) return false;
    if (f.yearMin !== undefined && l.year < f.yearMin) return false;
    if (f.yearMax !== undefined && l.year > f.yearMax) return false;
    if (f.kmMin !== undefined && l.km < f.kmMin) return false;
    if (f.kmMax !== undefined && l.km > f.kmMax) return false;
    if (f.powerMin !== undefined && l.powerKw < f.powerMin) return false;
    if (f.powerMax !== undefined && l.powerKw > f.powerMax) return false;
    if (f.engineMin !== undefined && l.engineCc < f.engineMin) return false;
    if (f.engineMax !== undefined && l.engineCc > f.engineMax) return false;
    if (f.fuel && f.fuel.length > 0 && !f.fuel.includes(l.fuel)) return false;
    if (f.transmission && f.transmission.length > 0 && !f.transmission.includes(l.transmission)) return false;
    if (f.bodyType && f.bodyType.length > 0 && !f.bodyType.includes(l.bodyType)) return false;
    if (f.drive && f.drive.length > 0 && !f.drive.includes(l.drive)) return false;
    // Vrata: avto.net grupira "2/3" i "4/5"
    if (f.doors && f.doors.length > 0) {
      const grp = l.doors <= 3 ? "2/3" : "4/5";
      if (!f.doors.includes(grp)) return false;
    }
    if (f.seats && f.seats.length > 0 && !f.seats.includes(String(l.seats))) return false;
    if (f.color && f.color.length > 0 && !f.color.includes(l.color)) return false;
    if (f.euroNorm && f.euroNorm.length > 0) {
      const ln = (l.attributes?.euroNorm as string) ?? "";
      if (!f.euroNorm.includes(ln)) return false;
    }
    if (f.condition && f.condition.length > 0 && !f.condition.includes(l.condition)) return false;
    if (f.sellerType && f.sellerType.length > 0 && !f.sellerType.includes(l.sellerType)) return false;
    if (f.county && l.county !== f.county) return false;
    if (f.attrs && !attrMatches(l.attributes, f.attrs)) return false;
    return true;
  });

  out = out.sort((a, b) => compare(f.sort ?? "newest", a, b));
  return out;
}

export const PAGE_SIZE = 12;

export function paginate(items: Listing[], page: number) {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const safe = Math.max(1, Math.min(page, totalPages));
  const start = (safe - 1) * PAGE_SIZE;
  return {
    items: items.slice(start, start + PAGE_SIZE),
    page: safe,
    totalPages,
    total: items.length,
  };
}

export function buildQueryString(f: Partial<ListingFilters>): string {
  const sp = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (k === "attrs") return;
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) return;
    if (Array.isArray(v)) sp.set(k, v.join(","));
    else sp.set(k, String(v));
  });
  if (f.attrs) {
    Object.entries(f.attrs).forEach(([k, v]) => {
      if (v === undefined || v === null || v === "") return;
      if (Array.isArray(v)) {
        if (v.length === 0) return;
        sp.set(`a.${k}`, v.join(","));
      } else if (typeof v === "boolean") {
        if (v) sp.set(`a.${k}`, "1");
      } else {
        sp.set(`a.${k}`, String(v));
      }
    });
  }
  const q = sp.toString();
  return q ? `?${q}` : "";
}

export function activeFilterCount(f: ListingFilters): number {
  let n = 0;
  if (f.q) n++;
  if (f.make) n++;
  if (f.model) n++;
  if (f.priceMin !== undefined) n++;
  if (f.priceMax !== undefined) n++;
  if (f.yearMin !== undefined) n++;
  if (f.yearMax !== undefined) n++;
  if (f.kmMin !== undefined) n++;
  if (f.kmMax !== undefined) n++;
  if (f.fuel?.length) n += f.fuel.length;
  if (f.transmission?.length) n += f.transmission.length;
  if (f.bodyType?.length) n += f.bodyType.length;
  if (f.drive?.length) n += f.drive.length;
  if (f.color?.length) n += f.color.length;
  if (f.condition?.length) n += f.condition.length;
  if (f.sellerType?.length) n += f.sellerType.length;
  if (f.county) n++;
  if (f.attrs) n += Object.values(f.attrs).filter((v) => v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0) && v !== false).length;
  return n;
}
