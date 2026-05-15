"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireUser } from "@/lib/session";
import {
  FUEL_TYPES,
  TRANSMISSIONS,
  BODY_TYPES,
  DRIVES,
  COLORS,
  CONDITIONS,
} from "@/lib/types";

const CreateListing = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  variant: z.string().optional(),
  year: z.coerce.number().int().min(1950).max(2030),
  priceEur: z.coerce.number().int().positive(),
  km: z.coerce.number().int().nonnegative(),
  fuel: z.enum(FUEL_TYPES),
  transmission: z.enum(TRANSMISSIONS),
  bodyType: z.enum(BODY_TYPES),
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
    category: "auto",
  });
  revalidatePath("/oglasi");
  revalidatePath("/moj-racun");
  revalidatePath("/moj-racun/oglasi");
  return { ok: true, slug: created.slug };
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
