"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Send, ArrowLeft, Phone, Check, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, timeAgo, cn } from "@/lib/utils";
import { getThreadMessagesAction, replyToThreadAction } from "@/actions/messages";

/**
 * Karlo 30.07: Inbox je bio 100% lažan — hardkodirane `THREADS`, a "Pošalji" je samo
 * pozvao preventDefault() i očistio polje. Backend je cijelo vrijeme postojao
 * (`db().listThreads` / `getThreadMessages` / `sendMessage`, tablica `message_threads`,
 * čak se koristio za brojač nepročitanih u moj-racun/layout.tsx), samo UI nije bio spojen.
 *
 * Sada podaci dolaze kao props iz server komponente (poruke/page.tsx), a slanje ide
 * kroz server akciju. Uz to je uklonjen `import { LISTINGS } from "@/data/listings"` —
 * ta klijentska komponenta je u bundle uvlačila cijeli 2400-linijski modul oglasa.
 *
 * Oblik markupa je NAMJERNO nepromijenjen (Dinovo ograničenje: mijenja se izvor
 * podataka, ne izgled).
 */

export type InboxMessage = {
  id: string;
  fromMe: boolean;
  body: string;
  at: string;
  read?: boolean;
};

export type InboxThread = {
  id: string;
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  listingPrice: number;
  listingImage?: string;
  with: string;
  initials: string;
  unread: number;
  lastAt: string;
  lastBody: string;
  lastFromMe: boolean;
  messages: InboxMessage[];
};

export function Inbox({ threads }: { threads: InboxThread[] }) {
  const [activeId, setActiveId] = useState<string>(threads[0]?.id ?? "");
  const [draft, setDraft] = useState("");
  const [showList, setShowList] = useState(true);
  const [msgs, setMsgs] = useState<Record<string, InboxMessage[]>>(
    () => Object.fromEntries(threads.map((t) => [t.id, t.messages]))
  );
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const active = threads.find((t) => t.id === activeId);

  const openThread = (id: string) => {
    setActiveId(id);
    setShowList(false);
    // Poruke dohvaćamo lijeno: lista dolazi s zadnjom porukom, puni razgovor na klik.
    startTransition(async () => {
      try {
        const fresh = await getThreadMessagesAction(id);
        setMsgs((m) => ({
          ...m,
          [id]: fresh.map((f) => ({ id: f.id, fromMe: f.fromMe, body: f.body, at: f.createdAt, read: f.read })),
        }));
      } catch {
        /* zadrži ono što već imamo */
      }
    });
  };

  const onSend = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !active) return;
    setError(null);
    setDraft("");
    startTransition(async () => {
      const res = await replyToThreadAction({ listingId: active.listingId, body });
      if (!res.ok) {
        setError(res.error);
        setDraft(body); // vrati tekst da se ne izgubi
        return;
      }
      const fresh = await getThreadMessagesAction(active.id);
      setMsgs((m) => ({
        ...m,
        [active.id]: fresh.map((f) => ({ id: f.id, fromMe: f.fromMe, body: f.body, at: f.createdAt, read: f.read })),
      }));
    });
  };

  // Prazno stanje — prije se nikad nije moglo dogoditi jer su podaci bili lažni.
  if (!threads.length) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-10 text-center">
        <div className="font-display text-xl">Još nema poruka</div>
        <p className="text-sm text-[var(--color-muted)] mt-2">
          Kad kontaktiraš prodavača ili netko pošalje upit na tvoj oglas, razgovor će se pojaviti ovdje.
        </p>
        <Button asChild variant="primary" className="mt-5">
          <a href="/oglasi">Pregledaj oglase</a>
        </Button>
      </div>
    );
  }

  const activeMsgs = active ? (msgs[active.id] ?? []) : [];

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
            {threads.map((t) => {
              const isActive = t.id === activeId;
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
                        {t.listingTitle}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <span className={cn(
                          "text-xs truncate",
                          t.unread > 0 ? "font-medium text-[var(--color-ink)]" : "text-[var(--color-muted)]"
                        )}>
                          {t.lastFromMe ? "Ti: " : ""}{t.lastBody}
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
          {active && (
            <>
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
                    {active.listingTitle} · {formatPrice(active.listingPrice)}
                  </div>
                </div>
                <Button variant="outline" size="icon" aria-label="Pozovi">
                  <Phone className="size-4" />
                </Button>
              </header>

              <div className="px-4 py-3 border-b border-[var(--color-line)] bg-[var(--color-bg)]/60 flex items-center gap-3">
                <div className="relative size-14 rounded-md overflow-hidden bg-[var(--color-line)] shrink-0">
                  {active.listingImage && (
                    <Image src={active.listingImage} alt="" fill sizes="56px" className="object-cover" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--color-muted)]">Razgovor o oglasu</div>
                  <div className="font-medium text-sm truncate">{active.listingTitle}</div>
                  <div className="font-display text-sm">{formatPrice(active.listingPrice)}</div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <a href={`/oglasi/${active.listingSlug}`}>Oglas →</a>
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
                {activeMsgs.map((m) => (
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

              {error && (
                <div className="px-4 py-2 text-xs text-[var(--color-danger)] border-t border-[var(--color-line)]">
                  {error}
                </div>
              )}

              <form className="p-3 border-t border-[var(--color-line)] flex gap-2" onSubmit={onSend}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Napiši poruku..."
                  className="flex-1 h-11 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 text-sm focus:border-[var(--color-ink)] outline-none"
                />
                <Button type="submit" variant="primary" disabled={!draft.trim() || pending}>
                  <Send className="size-4" />
                  <span className="hidden sm:inline">{pending ? "Šaljem…" : "Pošalji"}</span>
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
