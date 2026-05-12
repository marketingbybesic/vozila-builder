"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

export async function toggleSavedAction(listingId: string): Promise<{ saved: boolean; authed: boolean }> {
  const user = await getCurrentUser();
  if (!user) return { saved: false, authed: false };
  const res = await db().toggleSaved(user.id, listingId);
  revalidatePath("/moj-racun/spremljeno");
  return { ...res, authed: true };
}
