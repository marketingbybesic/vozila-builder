import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Plus, Eye, MessageSquare, Pencil, Pause, Play, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListingRowActions } from "@/components/listing-row-actions";
import { RestoreListingButton } from "@/components/restore-listing-button";
import { Pagination } from "@/components/pagination";
import { PAGE_SIZE } from "@/lib/filter";
import { requireUser } from "@/lib/session";
import { db } from "@/db";
import { cardSummary } from "@/lib/listing-fields";
import { formatPrice, formatKm, timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Moji oglasi" };

/**
 * ⚠️ Karlo 05.08.2026 (stavka 10): pauzirani I obrisani oglasi moraju se moći
 * pregledati. Pauzirani su i prije bili u popisu, ali ih se nije dalo izdvojiti;
 * obrisani se uopće nisu dohvaćali (`status <> 'deleted'` u adapteru).
 *
 * Filtar ide preko URL parametra (`?status=`) — stranica ostaje server
 * komponenta, stanje preživi osvježavanje i može se podijeliti linkom.
 */
const STATUS_TABS = [
  { key: "sve", label: "Sve" },
  { key: "active", label: "Aktivni" },
  { key: "paused", label: "Pauzirani" },
  { key: "draft", label: "Skice" },
  { key: "sold", label: "Prodani" },
  { key: "deleted", label: "Obrisani" },
] as const;

export default async function MyListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status, page: pageParam } = await searchParams;
  const user = await requireUser();
  // Obrisane dohvaćamo uvijek — treba nam broj za karticu "Obrisani".
  const all = await db().getListingsByUser(user.id, true);

  const aktivan = STATUS_TABS.some((t) => t.key === status) ? status! : "sve";
  const filtrirani =
    aktivan === "sve"
      // "Sve" namjerno NE uključuje obrisane — oni su zaseban, namjeran odabir.
      ? all.filter((i) => i.status !== "deleted")
      : all.filter((i) => i.status === aktivan);

  /**
   * ⚠️ Dino 05.08.2026: "Moji oglasi dugo se učitavaju i čine se neresponzivnima."
   * Izmjereno: stranica je renderirala SVIH 1240 oglasa odjednom — 1240 kartica
   * i isto toliko `next/image` zahtjeva. Skeleton pokriva čekanje, ali uzrok je
   * bio nedostatak paginacije.
   */
  const totalPages = Math.max(1, Math.ceil(filtrirani.length / PAGE_SIZE));
  const page = Math.min(Math.max(1, Number(pageParam) || 1), totalPages);
  const items = filtrirani.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const count = (k: string) =>
    k === "sve" ? all.filter((i) => i.status !== "deleted").length : all.filter((i) => i.status === k).length;
  const activeCount = count("active");

  return (
    <div>
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">Moji oglasi</h1>
          <p className="text-sm text-[var(--color-muted)] mt-1">
            {count("sve")} ukupno · {activeCount} aktivnih
          </p>
        </div>
        <Button asChild variant="accent">
          <Link href="/objavi">
            <Plus className="size-4" />
            Objavi novi oglas
          </Link>
        </Button>
      </header>

      {/* Kartice po statusu — prikazuju se samo one koje imaju oglasa,
          uz "Sve" i trenutno odabranu (da se odabir ne izgubi kad ostane prazan). */}
      <div className="flex flex-wrap gap-2 mb-8">
        {STATUS_TABS.filter((t) => t.key === "sve" || count(t.key) > 0 || t.key === aktivan).map((t) => {
          const odabran = t.key === aktivan;
          return (
            <Link
              key={t.key}
              href={t.key === "sve" ? "/moj-racun/oglasi" : `/moj-racun/oglasi?status=${t.key}`}
              className={
                "inline-flex items-center gap-1.5 h-9 px-3 rounded-[var(--radius-md)] text-sm font-medium border transition-colors " +
                (odabran
                  ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                  : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)] hover:text-[var(--color-ink)]")
              }
            >
              {t.label}
              <span className={odabran ? "text-white/60" : "text-[var(--color-muted)]"}>{count(t.key)}</span>
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-12 text-center">
          {/* Prazan FILTAR nije isto što i prazan račun — poruka mora odgovarati. */}
          {aktivan !== "sve" ? (
            <>
              <h2 className="font-display text-xl">
                Nema oglasa u kategoriji „{STATUS_TABS.find((t) => t.key === aktivan)?.label}"
              </h2>
              <Button asChild variant="outline" className="mt-6">
                <Link href="/moj-racun/oglasi">Prikaži sve oglase</Link>
              </Button>
            </>
          ) : (
            <>
              <h2 className="font-display text-xl">Još nemaš oglasa</h2>
              <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-md mx-auto">
                Tvoji oglasi će se prikazati ovdje. Besplatno za privatne korisnike.
              </p>
              <Button asChild variant="primary" className="mt-6">
                <Link href="/objavi">Objavi prvi oglas</Link>
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((l) => (
            <article
              key={l.id}
              className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] overflow-hidden hover:border-[var(--color-ink-soft)] transition-colors"
            >
              <div className="grid sm:grid-cols-[200px_1fr_auto] gap-4 p-4">
                <div className="relative aspect-[4/3] sm:aspect-auto sm:h-32 rounded-md overflow-hidden bg-[var(--color-line)]">
                  {l.images[0] && (
                    <Image src={l.images[0]} alt={l.title} fill sizes="200px" className="object-cover" />
                  )}
                </div>

                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={l.status} />
                    <span className="text-xs text-[var(--color-muted)]">Objavljeno {timeAgo(l.createdAt)}</span>
                  </div>
                  <h3 className="font-display text-lg leading-tight">
                    {l.make} {l.model}{" "}
                    {l.variant && <span className="italic font-normal text-[var(--color-ink-soft)]">{l.variant}</span>}
                  </h3>
                  <div className="text-xs text-[var(--color-muted)]">
                    {[...cardSummary(l), l.city].join(" · ")}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--color-ink-soft)] pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Eye className="size-3" /> {l.views} pregleda
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MessageSquare className="size-3" /> 0 poruka
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
                  </div>
                </div>
              </div>
              <div className="border-t border-[var(--color-line)] px-4 py-2.5 flex flex-wrap gap-1 bg-[var(--color-bg)]/50">
                {/* Na obrisanom oglasu "Uredi/Pauziraj/Obriši" nemaju smisla —
                    brisanje je MEKO, pa nudimo povrat. */}
                {l.status === "deleted" ? (
                  <RestoreListingButton id={l.id} />
                ) : (
                  <ListingRowActions id={l.id} status={l.status as "active" | "paused" | "sold"} />
                )}
              </div>
            </article>
          ))}

          <Pagination
            page={page}
            totalPages={totalPages}
            basePath="/moj-racun/oglasi"
            searchParams={aktivan === "sve" ? {} : { status: aktivan }}
          />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: "success" | "outline" | "neutral"; label: string }> = {
    active: { variant: "success", label: "Aktivan" },
    paused: { variant: "outline", label: "Pauziran" },
    sold: { variant: "neutral", label: "Prodano" },
    // ⚠️ Bez ovog unosa skica je padala na `active` i prikazivala se kao
    // "Aktivan" — vlasnik ju nije mogao razlikovati od objavljenih oglasa.
    draft: { variant: "outline", label: "Skica" },
    // Isti razlog: bez ovog unosa obrisani oglas piše "Aktivan".
    deleted: { variant: "neutral", label: "Obrisan" },
  };
  const m = map[status] ?? map.active;
  return <Badge variant={m.variant}>{m.label}</Badge>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _icons = { Pencil, Pause, Play, Trash2 };
