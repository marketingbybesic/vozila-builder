import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Plus, Eye, MessageSquare, MoreHorizontal, Pencil, Pause, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LISTINGS } from "@/data/listings";
import { formatPrice, formatKm, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Moji oglasi" };

const myStatus = ["Aktivan", "Aktivan", "Pauza", "Prodano", "Aktivan"] as const;

export default function MyListingsPage() {
  const items = LISTINGS.slice(0, 5).map((l, i) => ({ ...l, status: myStatus[i] }));

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">Moji oglasi</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {items.length} ukupno · {items.filter((i) => i.status === "Aktivan").length} aktivnih
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/objavi">
            <Plus className="size-4" />
            Objavi novi oglas
          </Link>
        </Button>
      </header>

      <div className="space-y-3">
        {items.map((l) => (
          <article
            key={l.id}
            className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] overflow-hidden hover:border-[var(--color-ink-soft)] transition-colors"
          >
            <div className="grid sm:grid-cols-[200px_1fr_auto] gap-4 p-4">
              <div className="relative aspect-[4/3] sm:aspect-auto sm:h-32 rounded-md overflow-hidden bg-[var(--color-line)]">
                <Image src={l.images[0]} alt={l.title} fill sizes="200px" className="object-cover" />
              </div>

              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={l.status} />
                  <span className="text-xs text-[var(--color-muted)]">Objavljeno {timeAgo(l.createdAt)}</span>
                </div>
                <h3 className="font-display text-lg leading-tight">
                  {l.make} {l.model} <span className="italic font-normal text-[var(--color-ink-soft)]">{l.variant}</span>
                </h3>
                <div className="text-xs text-[var(--color-muted)]">
                  {l.year}. · {formatKm(l.km)} · {l.fuel} · {l.city}
                </div>
                <div className="flex items-center gap-4 text-xs text-[var(--color-ink-soft)] pt-1">
                  <span className="inline-flex items-center gap-1">
                    <Eye className="size-3" /> {l.views} pregleda
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare className="size-3" /> {Math.floor(Math.random() * 12)} poruka
                  </span>
                </div>
              </div>

              <div className="sm:flex sm:flex-col sm:items-end gap-3 flex justify-between items-center">
                <div className="text-right">
                  <div className="font-display text-xl">{formatPrice(l.priceEur)}</div>
                </div>
                <div className="flex gap-1.5">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/oglasi/${l.slug}`}>Pogledaj</Link>
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Akcije">
                    <MoreHorizontal className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="border-t border-[var(--color-line)] px-4 py-2.5 flex flex-wrap gap-1 bg-[var(--color-bg)]/50">
              <ActionButton icon={<Pencil className="size-3.5" />} label="Uredi" />
              <ActionButton icon={<Pause className="size-3.5" />} label={l.status === "Pauza" ? "Aktiviraj" : "Pauziraj"} />
              <ActionButton icon={<Trash2 className="size-3.5" />} label="Obriši" danger />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "outline" | "neutral"; label: string }> = {
    Aktivan: { variant: "success", label: "Aktivan" },
    Pauza: { variant: "outline", label: "Pauziran" },
    Prodano: { variant: "neutral", label: "Prodano" },
  };
  const m = map[status] ?? map.Aktivan;
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

function ActionButton({ icon, label, danger }: { icon: React.ReactNode; label: string; danger?: boolean }) {
  return (
    <button
      type="button"
      className={
        "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors " +
        (danger
          ? "text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/50 hover:text-[var(--color-ink)]")
      }
    >
      {icon}
      {label}
    </button>
  );
}
