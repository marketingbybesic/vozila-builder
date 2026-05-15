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
    fuel: asArray(sp.fuel) as ListingFilters["fuel"],
    transmission: asArray(sp.transmission) as ListingFilters["transmission"],
    bodyType: asArray(sp.bodyType) as ListingFilters["bodyType"],
    drive: asArray(sp.drive) as ListingFilters["drive"],
    color: asArray(sp.color) as ListingFilters["color"],
    condition: asArray(sp.condition) as ListingFilters["condition"],
    sellerType: asArray(sp.sellerType) as ListingFilters["sellerType"],
    county: asString(sp.county),
    sort: (asString(sp.sort) as SortOption) ?? "newest",
    page: asNumber(sp.page) ?? 1,
  };
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
    if (f.fuel && f.fuel.length > 0 && !f.fuel.includes(l.fuel)) return false;
    if (f.transmission && f.transmission.length > 0 && !f.transmission.includes(l.transmission)) return false;
    if (f.bodyType && f.bodyType.length > 0 && !f.bodyType.includes(l.bodyType)) return false;
    if (f.drive && f.drive.length > 0 && !f.drive.includes(l.drive)) return false;
    if (f.color && f.color.length > 0 && !f.color.includes(l.color)) return false;
    if (f.condition && f.condition.length > 0 && !f.condition.includes(l.condition)) return false;
    if (f.sellerType && f.sellerType.length > 0 && !f.sellerType.includes(l.sellerType)) return false;
    if (f.county && l.county !== f.county) return false;
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
    if (v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0)) return;
    if (Array.isArray(v)) sp.set(k, v.join(","));
    else sp.set(k, String(v));
  });
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
  return n;
}
