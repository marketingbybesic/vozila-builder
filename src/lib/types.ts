import { z } from "zod";

export const FUEL_TYPES = [
  "Benzin",
  "Dizel",
  "Hibrid",
  "Plug-in hibrid",
  "Električni",
  "Plin",
] as const;
export type FuelType = (typeof FUEL_TYPES)[number];

export const TRANSMISSIONS = ["Ručni", "Automatski", "Poluautomatski"] as const;
export type Transmission = (typeof TRANSMISSIONS)[number];

export const BODY_TYPES = [
  "Limuzina",
  "Hatchback",
  "Karavan",
  "Coupe",
  "Cabrio",
  "SUV",
  "Terenac",
  "Kombi",
  "Pickup",
  "MPV",
] as const;
export type BodyType = (typeof BODY_TYPES)[number];

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
  transmission: z.enum(TRANSMISSIONS),
  bodyType: z.enum(BODY_TYPES),
  drive: z.enum(DRIVES),
  color: z.enum(COLORS),
  condition: z.enum(CONDITIONS),
  engineCc: z.number().int().nonnegative(),
  powerKw: z.number().int().nonnegative(),
  doors: z.number().int().min(2).max(5),
  seats: z.number().int().min(2).max(9),
  vinMasked: z.string().optional(),
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
  fuel?: FuelType[];
  transmission?: Transmission[];
  bodyType?: BodyType[];
  drive?: Drive[];
  color?: Color[];
  condition?: Condition[];
  sellerType?: SellerType[];
  county?: string;
  sort?: SortOption;
  page?: number;
};
