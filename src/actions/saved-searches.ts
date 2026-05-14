"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { requireUser } from "@/lib/session";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  filterJson: z.record(z.string(), z.unknown()),
  notifyEmail: z.boolean().optional(),
});

export async function createSavedSearchAction(input: {
  name: string;
  filterJson: Record<string, unknown>;
  notifyEmail?: boolean;
}) {
  const user = await requireUser();
  const data = createSchema.parse(input);
  await db().createSavedSearch(user.id, data);
  revalidatePath("/moj-racun/pretrage");
  return { ok: true };
}

export async function deleteSavedSearchAction(id: string) {
  const user = await requireUser();
  await db().deleteSavedSearch(user.id, id);
  revalidatePath("/moj-racun/pretrage");
  return { ok: true };
}

export async function saveSearchFromFormAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim() || "Moja pretraga";
  const filterJsonRaw = String(formData.get("filterJson") ?? "{}");
  let filterJson: Record<string, unknown> = {};
  try {
    filterJson = JSON.parse(filterJsonRaw);
  } catch {
    filterJson = {};
  }
  const notifyEmail = formData.get("notifyEmail") === "on";
  await db().createSavedSearch(user.id, { name, filterJson, notifyEmail });
  redirect("/moj-racun/pretrage?saved=1");
}
