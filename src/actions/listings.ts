"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireUser } from "@/lib/session";
import {
  FUEL_TYPES,
  ALL_TRANSMISSIONS,
  ALL_BODY_TYPES,
  DRIVES,
  COLORS,
  CONDITIONS,
  VEHICLE_CATEGORIES,
} from "@/lib/types";

const CreateListing = z.object({
  // ⚠️ Kategorija/podkategorija/atributi MORAJU biti u shemi.
  // Zod strip-a nepoznate ključeve — dok ih nije bilo, svaki oglas se spremao
  // kao `category: "auto"` bez podkategorije i BEZ ijednog atributa iz koraka
  // 3–4 (oprema, tapacirung, CO2, VIN…). Prodavač ih unese, a oglas ih izgubi.
  category: z.enum(VEHICLE_CATEGORIES).default("auto"),
  subcategory: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  make: z.string().min(1),
  model: z.string().min(1),
  variant: z.string().optional(),
  year: z.coerce.number().int().min(1950).max(2030),
  priceEur: z.coerce.number().int().positive(),
  km: z.coerce.number().int().nonnegative(),
  fuel: z.enum(FUEL_TYPES),
  transmission: z.enum(ALL_TRANSMISSIONS),
  bodyType: z.enum(ALL_BODY_TYPES),
  drive: z.enum(DRIVES),
  color: z.enum(COLORS),
  condition: z.enum(CONDITIONS),
  engineCc: z.coerce.number().int().nonnegative().default(0),
  powerKw: z.coerce.number().int().nonnegative(),
  doors: z.coerce.number().int().min(2).max(5).default(5),
  seats: z.coerce.number().int().min(2).max(9).default(5),
  city: z.string().min(1),
  county: z.string().min(1),
  description: z.string().min(30).max(2000),
  features: z.array(z.string()).default([]),
  images: z.array(z.string()).min(1, "Dodaj barem jednu fotografiju"),
});

export type ListingActionResult =
  | { ok: true; slug: string }
  | { ok: false; error: string };

export async function createListingAction(input: unknown): Promise<ListingActionResult> {
  const user = await requireUser();
  const parsed = CreateListing.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neispravni podaci" };
  }
  const created = await db().createListing(user.id, {
    ...parsed.data,
    variant: parsed.data.variant,
  });
  if (!created?.slug) {
    // Bez sluga bi "Pogledaj oglas" vodio na /oglasi/ → "page couldn't be found".
    return { ok: false, error: "Oglas je spremljen, ali mu nije dodijeljena adresa. Javi nam se." };
  }
  revalidatePath("/oglasi");
  revalidatePath("/oglasi/najnoviji");
  revalidatePath("/moj-racun");
  revalidatePath("/moj-racun/oglasi");
  // ⚠️ Detaljna stranica je SSG (`generateStaticParams`). Novi slug nije bio u
  // buildu, pa je "Pogledaj oglas" znao vratiti prazan/zastario prerender.
  // `dynamicParams` ga servira, ali tek nakon što se putanja poništi.
  revalidatePath(`/oglasi/${created.slug}`);
  return { ok: true, slug: created.slug };
}

/**
 * SKICA (`draft`) — Dino 04.08.2026.
 *
 * Namjerno BLAŽA validacija od objave: prodavač sprema nedovršen oglas da mu se
 * ne izgubi unos kad napusti stranicu. Obavezna je samo kategorija.
 *
 * ⚠️ Nedostajuća polja se popunjavaju SIGURNIM zadanim vrijednostima jer ih
 * `listings` tablica traži kao NOT NULL. Nisu podatak o vozilu nego popuna —
 * prodavač ih ispravlja kad nastavi uređivati.
 * ⚠️ Skica se NE prikazuje kupcima: sve javne rute traže `status = "active"`,
 * a "Moji oglasi" uzima sve osim `deleted` — pa je vlasnik vidi.
 */
const DraftListing = z.object({
  category: z.enum(VEHICLE_CATEGORIES).default("auto"),
  subcategory: z.string().optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  make: z.string().default(""),
  model: z.string().default(""),
  variant: z.string().optional(),
  year: z.coerce.number().int().optional(),
  priceEur: z.coerce.number().int().nonnegative().optional(),
  km: z.coerce.number().int().nonnegative().optional(),
  fuel: z.string().optional(),
  transmission: z.string().optional(),
  bodyType: z.string().optional(),
  drive: z.string().optional(),
  color: z.string().optional(),
  condition: z.string().optional(),
  engineCc: z.coerce.number().int().nonnegative().optional(),
  powerKw: z.coerce.number().int().nonnegative().optional(),
  doors: z.coerce.number().int().optional(),
  seats: z.coerce.number().int().optional(),
  city: z.string().optional(),
  county: z.string().optional(),
  description: z.string().optional(),
  features: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
});

export async function saveDraftListingAction(input: unknown): Promise<ListingActionResult> {
  const user = await requireUser();
  const parsed = DraftListing.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Skicu nije moguće spremiti" };
  }
  const d = parsed.data;
  const created = await db().createListing(user.id, {
    ...d,
    status: "draft",
    make: d.make || "Nedovršeno",
    model: d.model || "—",
    year: d.year ?? new Date().getFullYear(),
    priceEur: d.priceEur ?? 0,
    km: d.km ?? 0,
    fuel: (d.fuel || FUEL_TYPES[0]) as (typeof FUEL_TYPES)[number],
    transmission: (d.transmission || ALL_TRANSMISSIONS[0]) as (typeof ALL_TRANSMISSIONS)[number],
    bodyType: (d.bodyType || ALL_BODY_TYPES[0]) as (typeof ALL_BODY_TYPES)[number],
    drive: (d.drive || DRIVES[0]) as (typeof DRIVES)[number],
    color: (d.color || COLORS[0]) as (typeof COLORS)[number],
    condition: (d.condition || CONDITIONS[0]) as (typeof CONDITIONS)[number],
    engineCc: d.engineCc ?? 0,
    powerKw: d.powerKw ?? 0,
    doors: d.doors ?? 5,
    seats: d.seats ?? 5,
    city: d.city || "—",
    county: d.county || "—",
    description: d.description || "",
  });
  revalidatePath("/moj-racun");
  revalidatePath("/moj-racun/oglasi");
  return { ok: true, slug: created?.slug ?? "" };
}

/**
 * UREĐIVANJE OGLASA — Dino 05.08.2026: "Uredi ne radi u prikazu mojih oglasa".
 *
 * ⚠️ Gumb nije bio "mrtav" — akcija i stranica NIKAD nisu postojale. U bazi je
 * `updateListing` bio spreman (provjerava vlasništvo, whitelista polja), ali ga
 * ništa nije zvalo.
 *
 * Sva polja su OPCIONALNA (patch): forma šalje samo ono što mijenja, a adapter
 * izbacuje `undefined` ključeve prije upisa.
 */
const UpdateListing = z.object({
  id: z.string().uuid(),
  make: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  variant: z.string().optional(),
  year: z.coerce.number().int().min(1950).max(2030).optional(),
  priceEur: z.coerce.number().int().positive().optional(),
  km: z.coerce.number().int().nonnegative().optional(),
  fuel: z.enum(FUEL_TYPES).optional(),
  transmission: z.enum(ALL_TRANSMISSIONS).optional(),
  bodyType: z.enum(ALL_BODY_TYPES).optional(),
  drive: z.enum(DRIVES).optional(),
  color: z.enum(COLORS).optional(),
  condition: z.enum(CONDITIONS).optional(),
  engineCc: z.coerce.number().int().nonnegative().optional(),
  powerKw: z.coerce.number().int().nonnegative().optional(),
  doors: z.coerce.number().int().min(2).max(5).optional(),
  seats: z.coerce.number().int().min(2).max(9).optional(),
  city: z.string().min(1).optional(),
  county: z.string().min(1).optional(),
  description: z.string().min(30).max(2000).optional(),
  attributes: z.record(z.string(), z.unknown()).optional(),
  features: z.array(z.string()).optional(),
  images: z.array(z.string()).min(1, "Dodaj barem jednu fotografiju").optional(),
});

export async function updateListingAction(input: unknown): Promise<ListingActionResult> {
  const user = await requireUser();
  const parsed = UpdateListing.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Neispravni podaci" };
  }
  const { id, ...patch } = parsed.data;
  try {
    // `updateListing` sam provjerava da oglas pripada ovom korisniku.
    const updated = await db().updateListing(id, user.id, patch as Parameters<
      ReturnType<typeof db>["updateListing"]
    >[2]);
    revalidatePath("/oglasi");
    revalidatePath("/moj-racun/oglasi");
    if (updated?.slug) revalidatePath(`/oglasi/${updated.slug}`);
    return { ok: true, slug: updated?.slug ?? "" };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error && /nije pronađen/i.test(e.message)
        ? "Oglas nije pronađen ili nije tvoj."
        : "Spremanje nije uspjelo. Pokušaj ponovno.",
    };
  }
}

const StatusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["active", "paused", "sold", "deleted"]),
});

export async function setListingStatusAction(input: unknown): Promise<ListingActionResult> {
  const user = await requireUser();
  const parsed = StatusInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Neispravna akcija" };
  await db().setListingStatus(parsed.data.id, user.id, parsed.data.status);
  revalidatePath("/moj-racun/oglasi");
  revalidatePath("/oglasi");
  return { ok: true, slug: "" };
}

export async function deleteListingAction(id: string) {
  const user = await requireUser();
  await db().setListingStatus(id, user.id, "deleted");
  revalidatePath("/moj-racun/oglasi");
  redirect("/moj-racun/oglasi");
}
