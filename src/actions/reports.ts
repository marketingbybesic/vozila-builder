"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { getCurrentUser } from "@/lib/session";

const reportSchema = z.object({
  listingId: z.string().uuid(),
  reason: z.enum(["fraud", "duplicate", "wrong-data", "inappropriate", "other"]),
  body: z.string().min(20, "Opis mora imati najmanje 20 znakova").max(2000),
});

export async function reportListingAction(formData: FormData) {
  const data = reportSchema.parse({
    listingId: formData.get("listingId"),
    reason: formData.get("reason"),
    body: formData.get("body"),
  });
  const user = await getCurrentUser();
  await db().createReport({
    listingId: data.listingId,
    reporterId: user?.id ?? null,
    reason: data.reason,
    body: data.body,
  });
  redirect(`/oglasi/${formData.get("slug")}?reported=1`);
}
