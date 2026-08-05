import { z } from "zod";

export const FUEL_TYPES = [
  "Benzin",
  "Dizel",
  "Hibrid",
  "Električni",
  "Plin",
] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const TRANSMISSIONS = ["Ručni", "Automatski"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

/**
 * ⚠️ BODY_TYPES / TRANSMISSIONS su liste za PRIKAZ (naslovnica, filter osobnih
 * auta). Gospodarska i mehanizacija nude vlastite tipove iz `category-filters.ts`
 * ("Furgon", "sasija-kabina", "hidrostatski"…). Za VALIDACIJU pri spremanju
 * koristi `ALL_BODY_TYPES` / `ALL_TRANSMISSIONS` — inače zod odbije oglas koji
 * je forma sama ponudila, oglas se ne stvori i prodavač dobije 404.
 * Guard: `scripts/check-enum-drift.mts`.
 */
export const BODY_TYPES = [
  "Microcar",
  "Limuzina",
  "Hatchback",
  "Karavan",
  "Coupe",
  "Cabrio",
  "SUV",
  "Monovolumen",
  "Pickup",
] as const;
export type BodyType = (typeof BODY_TYPES)[number];

/** Oblici karoserije gospodarskih vozila — samo za validaciju, ne za prikaz na naslovnici. */
export const COMMERCIAL_BODY_TYPES = [
  "Furgon",
  "Kombi",
  "kamionet",
  "sasija-kabina",
  "sasija-nadgradnja",
  "pickup",
] as const;

/** Sve vrijednosti koje spremanje smije prihvatiti (prikaz + gospodarska). */
export const ALL_BODY_TYPES = [...BODY_TYPES, ...COMMERCIAL_BODY_TYPES] as const;
export type AnyBodyType = (typeof ALL_BODY_TYPES)[number];

/** Mjenjači izvan osobnih auta (mehanizacija). */
export const ALL_TRANSMISSIONS = [...TRANSMISSIONS, "hidrostatski"] as const;
export type AnyTransmission = (typeof ALL_TRANSMISSIONS)[number];

export const DRIVES = ["Prednji", "Stražnji", "4x4"] as const;
export type Drive = (typeof DRIVES)[number];

export const COLORS = [
  "Crna",
  "Bijela",
  "Siva",
  "Srebrna",
  "Plava",
  "Crvena",
  "Zelena",
  "Smeđa",
  "Žuta",
  "Narančasta",
] as const;
export type Color = (typeof COLORS)[number];

export const CONDITIONS = ["Rabljeno", "Novo", "Oldtimer"] as const;
export type Condition = (typeof CONDITIONS)[number];

export const SELLER_TYPES = ["Privatni", "Trgovac"] as const;
export type SellerType = (typeof SELLER_TYPES)[number];

export const VEHICLE_CATEGORIES = [
  "auto",
  "moto",
  "gospodarska",
  "mehanizacija",
  "prosti-cas",
  "dijelovi",
] as const;
export type VehicleCategory = (typeof VEHICLE_CATEGORIES)[number];

export const Listing = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  category: z.enum(VEHICLE_CATEGORIES).default("auto"),
  subcategory: z.string().optional(),
  make: z.string(),
  model: z.string(),
  variant: z.string().optional(),
  year: z.number().int().min(1950).max(2030),
  priceEur: z.number().int().positive(),
  originalPriceEur: z.number().int().positive().optional(),
  km: z.number().int().nonnegative(),
  fuel: z.enum(FUEL_TYPES),
  // Šire liste: gospodarska i mehanizacija imaju vlastite oblike karoserije i
  // mjenjač ("Furgon", "hidrostatski"…). Uske liste ostaju za PRIKAZ.
  transmission: z.enum(ALL_TRANSMISSIONS),
  bodyType: z.enum(ALL_BODY_TYPES),
  drive: z.enum(DRIVES),
  color: z.enum(COLORS),
  condition: z.enum(CONDITIONS),
  engineCc: z.number().int().nonnegative(),
  powerKw: z.number().int().nonnegative(),
  doors: z.number().int().min(2).max(5),
  seats: z.number().int().min(2).max(9),
  vinMasked: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  accidentHistory: z.string().optional(),
  serviceHistory: z.string().optional(),
  importedFrom: z.string().optional(),
  registrationUntil: z.string().optional(),
  firstRegistered: z.string().optional(),
  city: z.string(),
  county: z.string(),
  description: z.string(),
  features: z.array(z.string()),
  images: z.array(z.string()),
  sellerName: z.string(),
  sellerType: z.enum(SELLER_TYPES),
  sellerPhone: z.string(),
  /**
   * ID prodavača — potreban da se s oglasa može otvoriti popis SVIH njegovih
   * oglasa (`/trgovci/<id>`). Dino 05.08.2026: "klik na ime prodavača ne radi".
   * Opcionalan jer ga statični demo-dealeri i pregled objave nemaju.
   */
  sellerId: z.string().optional(),
  /** Logotip trgovca / profilna privatnog prodavača (Dino 05.08.2026). */
  sellerAvatar: z.string().optional(),
  sellerEmail: z.string().email().optional(),
  views: z.number().int().nonnegative(),
  phoneReveals: z.number().int().nonnegative().optional(),
  featured: z.boolean(),
  boostedUntil: z.string().optional(),
  createdAt: z.string(),
});
export type Listing = z.infer<typeof Listing>;

export const CarMake = z.object({
  slug: z.string(),
  name: z.string(),
  country: z.string(),
  models: z.array(z.string()),
});
export type CarMake = z.infer<typeof CarMake>;

export type SortOption =
  | "newest"
  | "price-asc"
  | "price-desc"
  | "km-asc"
  | "year-desc";

export type ListingFilters = {
  q?: string;
  category?: VehicleCategory;
  subcategory?: string;
  make?: string;
  model?: string;
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  kmMin?: number;
  kmMax?: number;
  powerMin?: number;
  powerMax?: number;
  engineMin?: number;
  engineMax?: number;
  fuel?: FuelType[];
  transmission?: AnyTransmission[];
  bodyType?: AnyBodyType[];
  drive?: Drive[];
  doors?: string[];
  seats?: string[];
  color?: Color[];
  euroNorm?: string[];
  condition?: Condition[];
  sellerType?: SellerType[];
  county?: string;
  sort?: SortOption;
  page?: number;
  /** Sakrij oglase bez cijene (priceEur = 0). URL: `hidePriceless=1`. */
  hidePriceless?: boolean;
  attrs?: Record<string, string | number | boolean | string[]>;
};
