"use client";

import { useState } from "react";
import Image from "next/image";
import { Send, ArrowLeft, Phone, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LISTINGS } from "@/data/listings";
import { formatPrice, timeAgo, cn } from "@/lib/utils";

type Message = {
  id: string;
  fromMe: boolean;
  body: string;
  at: string;
  read?: boolean;
};

type Thread = {
  id: string;
  listingId: string;
  with: string;
  initials: string;
  unread: number;
  lastAt: string;
  messages: Message[];
};

const NOW = Date.now();
const ago = (mins: number) => new Date(NOW - mins * 60_000).toISOString();

const THREADS: Thread[] = [
  {
    id: "t1",
    listingId: LISTINGS[2].id,
    with: "Marko Kovačević",
    initials: "MK",
    unread: 2,
    lastAt: ago(8),
    messages: [
      { id: "m1", fromMe: false, body: "Bok, je li auto još uvijek dostupan?", at: ago(45) },
      { id: "m2", fromMe: true, body: "Pozdrav, da, slobodan je. Možete doći pogledati u Rijeku.", at: ago(40), read: true },
      { id: "m3", fromMe: false, body: "Super, zanima me prvo - je li bio u nekoj nesreći?", at: ago(15) },
      { id: "m4", fromMe: false, body: "I imate li servisnu knjižicu?", at: ago(8) },
    ],
  },
  {
    id: "t2",
    listingId: LISTINGS[5].id,
    with: "Ivana Horvat",
    initials: "IH",
    unread: 1,
    lastAt: ago(120),
    messages: [
      { id: "m1", fromMe: true, body: "Bok, koja je najniža cijena?", at: ago(180), read: true },
      { id: "m2", fromMe: false, body: "Mogu spustiti na 11.500 €. To je definitivno donja granica.", at: ago(120) },
    ],
  },
  {
    id: "t3",
    listingId: LISTINGS[8].id,
    with: "Filip Jurić",
    initials: "FJ",
    unread: 0,
    lastAt: ago(60 * 24),
    messages: [
      { id: "m1", fromMe: true, body: "Hvala na informacijama, javit ću vam se sutra.", at: ago(60 * 24), read: true },
    ],
  },
];

export function Inbox() {
  const [activeId, setActiveId] = useState<string>(THREADS[0].id);
  const [draft, setDraft] = useState("");
  const [showList, setShowList] = useState(true);

  const active = THREADS.find((t) => t.id === activeId)!;
  const listing = LISTINGS.find((l) => l.id === active.listingId)!;

  const openThread = (id: string) => {
    setActiveId(id);
    setShowList(false);
  };

  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] overflow-hidden h-[calc(100vh-14rem)] min-h-[520px]">
      <div className="grid h-full md:grid-cols-[280px_1fr]">
        <aside className={cn(
          "border-r border-[var(--color-line)] flex flex-col",
          !showList && "hidden md:flex"
        )}>
          <div className="p-3 border-b border-[var(--color-line)]">
            <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] px-2">
              Razgovori
            </div>
          </div>
          <ul className="flex-1 overflow-y-auto scrollbar-thin">
            {THREADS.map((t) => {
              const tListing = LISTINGS.find((l) => l.id === t.listingId)!;
              const isActive = t.id === activeId;
              const lastMsg = t.messages[t.messages.length - 1];
              return (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => openThread(t.id)}
                    className={cn(
                      "w-full text-left p-3 flex gap-3 hover:bg-[var(--color-line)]/30 transition-colors border-l-2",
                      isActive
                        ? "bg-[var(--color-line)]/30 border-l-[var(--color-accent)]"
                        : "border-l-transparent"
                    )}
                  >
                    <div className="size-10 shrink-0 rounded-full bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] grid place-items-center text-white text-xs font-semibold">
                      {t.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{t.with}</span>
                        <span className="text-[10px] text-[var(--color-muted)] shrink-0">{timeAgo(t.lastAt)}</span>
                      </div>
                      <div className="text-xs text-[var(--color-muted)] truncate">
                        {tListing.make} {tListing.model}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className={cn(
                          "text-xs truncate",
                          t.unread > 0 ? "font-medium text-[var(--color-ink)]" : "text-[var(--color-muted)]"
                        )}>
                          {lastMsg.fromMe ? "Ti: " : ""}{lastMsg.body}
                        </span>
                        {t.unread > 0 && (
                          <span className="size-5 shrink-0 rounded-full bg-[var(--color-accent)] text-[10px] font-semibold text-[var(--color-ink)] grid place-items-center">
                            {t.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section className={cn(
          "flex flex-col min-h-0",
          showList && "hidden md:flex"
        )}>
          <header className="px-4 py-3 border-b border-[var(--color-line)] flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowList(true)}
              className="md:hidden size-9 rounded-md hover:bg-[var(--color-line)]/40 grid place-items-center"
              aria-label="Natrag"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="size-10 rounded-full bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] grid place-items-center text-white text-xs font-semibold">
              {active.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{active.with}</div>
              <div className="text-xs text-[var(--color-muted)] truncate">
                {listing.make} {listing.model} · {formatPrice(listing.priceEur)}
              </div>
            </div>
            <Button variant="outline" size="icon" aria-label="Pozovi">
              <Phone className="size-4" />
            </Button>
          </header>

          <div className="px-4 py-3 border-b border-[var(--color-line)] bg-[var(--color-bg)]/60 flex items-center gap-3">
            <div className="relative size-14 rounded-md overflow-hidden bg-[var(--color-line)] shrink-0">
              <Image src={listing.images[0]} alt="" fill sizes="56px" className="object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-[var(--color-muted)]">Razgovor o oglasu</div>
              <div className="font-medium text-sm truncate">{listing.make} {listing.model}</div>
              <div className="font-display text-sm">{formatPrice(listing.priceEur)}</div>
            </div>
            <Button asChild variant="ghost" size="sm">
              <a href={`/oglasi/${listing.slug}`}>Oglas →</a>
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
            {active.messages.map((m) => (
              <div key={m.id} className={cn("flex", m.fromMe ? "justify-end" : "justify-start")}>
                <div className="max-w-[80%] space-y-1">
                  <div className={cn(
                    "rounded-[var(--radius-md)] px-3.5 py-2.5 text-sm leading-snug",
                    m.fromMe
                      ? "bg-[var(--color-ink)] text-white rounded-br-sm"
                      : "bg-[var(--color-line)]/50 text-[var(--color-ink)] rounded-bl-sm"
                  )}>
                    {m.body}
                  </div>
                  <div className={cn(
                    "text-[10px] text-[var(--color-muted)] inline-flex items-center gap-1",
                    m.fromMe ? "justify-end w-full" : ""
                  )}>
                    {timeAgo(m.at)}
                    {m.fromMe && (m.read ? <CheckCheck className="size-3 text-[var(--color-success)]" /> : <Check className="size-3" />)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <form
            className="p-3 border-t border-[var(--color-line)] flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draft.trim()) return;
              setDraft("");
            }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Napiši poruku..."
              className="flex-1 h-11 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 text-sm focus:border-[var(--color-ink)] outline-none"
            />
            <Button type="submit" variant="primary" disabled={!draft.trim()}>
              <Send className="size-4" />
              <span className="hidden sm:inline">Pošalji</span>
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}

export function _suppressUnused() {
  return Badge;
}
