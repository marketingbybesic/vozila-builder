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

/**
 * Dohvati poruke jedne nizanke (za Inbox kad korisnik prebaci razgovor).
 * Karlo 30.07: Inbox je do sada imao hardkodirane poruke i "Pošalji" je samo
 * čistio polje — backend (`listThreads`/`getThreadMessages`/`sendMessage`) je
 * već postojao i radio, samo UI nije bio spojen.
 */
export async function getThreadMessagesAction(threadId: string) {
  const user = await requireUser();
  const messages = await db().getThreadMessages(threadId, user.id);
  await db().markThreadRead(threadId, user.id);
  return messages.map((m) => ({
    id: m.id,
    body: m.body,
    createdAt: m.createdAt,
    fromMe: m.fromUserId === user.id,
    read: Boolean(m.readAt),
  }));
}

/** Odgovor unutar postojeće nizanke — `sendMessage` sam razrješava thread po oglasu. */
export async function replyToThreadAction(input: { listingId: string; body: string }) {
  return sendMessageAction(input);
}
