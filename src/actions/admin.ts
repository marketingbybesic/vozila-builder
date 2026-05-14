"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db";
import { requireAdmin } from "@/lib/session";

const idSchema = z.string().uuid();

export async function adminDeleteListingAction(listingId: string) {
  const actor = await requireAdmin();
  idSchema.parse(listingId);
  await db().adminDeleteListing(listingId, actor.id);
  revalidatePath("/admin/oglasi");
  revalidatePath("/oglasi");
  revalidatePath("/");
  return { ok: true };
}

export async function adminToggleFeaturedAction(listingId: string, featured: boolean) {
  const actor = await requireAdmin();
  idSchema.parse(listingId);
  await db().adminSetFeatured(listingId, actor.id, featured);
  revalidatePath("/admin/oglasi");
  revalidatePath("/");
  return { ok: true };
}

export async function adminSetUserRoleAction(targetId: string, role: "user" | "admin" | "moderator") {
  const actor = await requireAdmin();
  idSchema.parse(targetId);
  if (targetId === actor.id && role !== "admin") {
    throw new Error("Ne možeš si oduzeti admin status");
  }
  await db().adminSetUserRole(targetId, actor.id, role);
  revalidatePath("/admin/korisnici");
  return { ok: true };
}

export async function adminToggleBanAction(targetId: string, banned: boolean) {
  const actor = await requireAdmin();
  idSchema.parse(targetId);
  if (targetId === actor.id) throw new Error("Ne možeš blokirati samog sebe");
  await db().adminBanUser(targetId, actor.id, banned);
  revalidatePath("/admin/korisnici");
  return { ok: true };
}

export async function adminResolveReportAction(reportId: string, action: "resolved" | "dismissed") {
  const actor = await requireAdmin();
  idSchema.parse(reportId);
  await db().resolveReport(reportId, actor.id, action);
  revalidatePath("/admin/prijave");
  return { ok: true };
}
