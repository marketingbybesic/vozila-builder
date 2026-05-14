import Link from "next/link";
import { db } from "@/db";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatKm } from "@/lib/utils";
import { AdminListingRowActions } from "@/components/admin-listing-row-actions";

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const rows = await db().adminListListings({ status: sp.status, q: sp.q });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Oglasi</h2>
          <p className="text-sm text-[var(--color-muted)] mt-0.5">{rows.length} rezultata</p>
        </div>
        <form className="flex flex-wrap gap-2 text-sm">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Pretraga..."
            className="h-9 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]"
          />
          <select
            name="status"
            defaultValue={sp.status ?? ""}
            className="h-9 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]"
          >
            <option value="">Sve statuse</option>
            <option value="active">Aktivno</option>
            <option value="paused">Pauzirano</option>
            <option value="sold">Prodano</option>
            <option value="pending-review">Na reviziji</option>
            <option value="deleted">Obrisano</option>
          </select>
          <button
            type="submit"
            className="h-9 px-3 rounded-md bg-[var(--color-ink)] text-white text-xs font-medium"
          >
            Filtriraj
          </button>
        </form>
      </header>

      <div className="overflow-x-auto -mx-5 md:mx-0">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase tracking-wider text-[var(--color-muted)] text-left">
            <tr className="border-b border-[var(--color-line)]">
              <th className="px-5 py-2.5 font-semibold">Oglas</th>
              <th className="px-3 py-2.5 font-semibold">Vlasnik</th>
              <th className="px-3 py-2.5 font-semibold text-right">Cijena</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold text-right">Pregledi</th>
              <th className="px-5 py-2.5 font-semibold text-right">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[var(--color-muted)] italic">
                  Nema oglasa.
                </td>
              </tr>
            ) : (
              rows.map((l) => (
                <tr
                  key={l.id}
                  className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-surface)]/50"
                >
                  <td className="px-5 py-3 min-w-[260px]">
                    <Link
                      href={`/oglasi/${l.slug}`}
                      className="font-medium hover:text-[var(--color-accent-dark)]"
                      target="_blank"
                    >
                      {l.title}
                    </Link>
                    <div className="text-xs text-[var(--color-muted)] mt-0.5">
                      {l.city} · {formatKm(l.km)} · {l.year}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs text-[var(--color-ink-soft)] min-w-[180px]">
                    {l.sellerName}
                    <div className="text-[var(--color-muted)] mt-0.5">{l.ownerEmail}</div>
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap font-medium">
                    {formatPrice(l.priceEur)}
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      variant={
                        l.status === "active"
                          ? "accent"
                          : l.status === "deleted"
                          ? "outline"
                          : "neutral"
                      }
                    >
                      {l.status}
                    </Badge>
                    {l.featured && (
                      <span className="ml-1 text-[10px] uppercase tracking-wider text-[var(--color-accent-dark)]">
                        ★
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right text-xs text-[var(--color-ink-soft)]">
                    {l.views}
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    <AdminListingRowActions
                      listingId={l.id}
                      featured={l.featured}
                      status={l.status}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
