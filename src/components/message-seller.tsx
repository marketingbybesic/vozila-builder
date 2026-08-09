"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { sendMessageAction } from "@/actions/messages";

/**
 * Karlo 09.08. (st. 14): "Pošalji poruku" nije radio — gumb na detaljnoj
 * stranici nije imao nikakav handler, iako backend poruka (threads/sendMessage,
 * Inbox u Moj račun → Poruke) postoji i radi od 30.07.
 *
 * Klik otvara polje za poruku; slanje ide kroz `sendMessageAction` koji sam
 * razrješava nizanku po oglasu. Neprijavljenog korisnika server preusmjeri na
 * /prijava (requireUser).
 */
export function MessageSeller({ listingId }: { listingId: string }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const send = () => {
    setErr(null);
    start(async () => {
      const res = await sendMessageAction({ listingId, body: body.trim() });
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setSent(true);
    });
  };

  if (sent) {
    return (
      <div className="rounded-md bg-[var(--color-success)]/10 text-[var(--color-success)] px-4 py-3 text-sm flex items-center gap-2">
        <Check className="size-4 shrink-0" />
        <span>
          Poruka poslana.{" "}
          <Link href="/moj-racun/poruke" className="underline font-medium">
            Otvori poruke
          </Link>
        </span>
      </div>
    );
  }

  if (!open) {
    return (
      <Button variant="primary" size="lg" className="w-full" onClick={() => setOpen(true)}>
        <MessageSquare className="size-4" />
        Pošalji poruku
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <Textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Pozdrav, zanima me ovaj oglas…"
        autoFocus
      />
      {err && <p className="text-xs text-[var(--color-danger)]">{err}</p>}
      <div className="flex gap-2">
        <Button
          variant="primary"
          className="flex-1"
          onClick={send}
          disabled={pending || body.trim().length === 0}
        >
          {pending ? "Šaljem..." : "Pošalji"}
        </Button>
        <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
          Odustani
        </Button>
      </div>
    </div>
  );
}
