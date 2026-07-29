import type { Metadata } from "next";
import { Inbox, type InboxThread } from "@/components/inbox";
import { db } from "@/db";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Poruke" };

function initials(first?: string | null, last?: string | null): string {
  const a = (first ?? "").trim()[0] ?? "";
  const b = (last ?? "").trim()[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

export default async function PorukePage() {
  const user = await requireUser();

  // Karlo 30.07: prije je Inbox imao hardkodirane razgovore. Sada dolaze iz baze
  // (`listThreads` je postojao i radio — koristio se za brojač nepročitanih u
  // layout.tsx — samo ga stranica nije pozivala).
  let threads: InboxThread[] = [];
  try {
    const rows = await db().listThreads(user.id);
    threads = rows.map((t) => ({
      id: t.id,
      listingId: t.listing.id,
      listingSlug: t.listing.slug,
      listingTitle: `${t.listing.make} ${t.listing.model}`,
      listingPrice: t.listing.priceEur,
      listingImage: t.listing.images?.[0],
      with: [t.other.firstName, t.other.lastName].filter(Boolean).join(" ") || "Korisnik",
      initials: initials(t.other.firstName, t.other.lastName),
      unread: t.unreadCount,
      lastAt: t.lastMessage?.createdAt ?? t.lastMessageAt ?? t.createdAt,
      lastBody: t.lastMessage?.body ?? "",
      lastFromMe: t.lastMessage?.fromUserId === user.id,
      // Puni razgovor se dohvaća lijeno na klik; lista prikazuje zadnju poruku.
      messages: t.lastMessage
        ? [{
            id: t.lastMessage.id,
            fromMe: t.lastMessage.fromUserId === user.id,
            body: t.lastMessage.body,
            at: t.lastMessage.createdAt,
            read: Boolean(t.lastMessage.readAt),
          }]
        : [],
    }));
  } catch (err) {
    console.warn("[poruke] listThreads failed:", err);
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Poruke</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Razgovori s prodavačima i kupcima.
        </p>
      </header>

      <Inbox threads={threads} />
    </div>
  );
}
