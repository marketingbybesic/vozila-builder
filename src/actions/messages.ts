"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireUser } from "@/lib/session";

const SendMessage = z.object({
  listingId: z.string().min(1),
  body: z.string().min(1, "Poruka ne može biti prazna").max(2000),
});

export type MessageActionResult =
  | { ok: true; threadId: string }
  | { ok: false; error: string };

export async function sendMessageAction(input: unknown): Promise<MessageActionResult> {
  const user = await requireUser();
  const parsed = SendMessage.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Neispravni podaci" };
  const msg = await db().sendMessage({
    fromUserId: user.id,
    listingId: parsed.data.listingId,
    body: parsed.data.body,
  });
  revalidatePath("/moj-racun/poruke");
  return { ok: true, threadId: msg.threadId };
}

export async function markThreadReadAction(threadId: string) {
  const user = await requireUser();
  await db().markThreadRead(threadId, user.id);
  revalidatePath("/moj-racun/poruke");
}
