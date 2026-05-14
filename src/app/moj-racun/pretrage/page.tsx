import Link from "next/link";
import type { Metadata } from "next";
import { db } from "@/db";
import { requireUser } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, Trash2 } from "lucide-react";
import { SavedSearchDeleteButton } from "@/components/saved-search-delete-button";
import { buildQueryString } from "@/lib/filter";
import type { ListingFilters } from "@/lib/types";

export const metadata: Metadata = { title: "Spremljene pretrage" };

export default async function SavedSearchesPage() {
  const user = await requireUser();
  const rows = await db().listSavedSearches(user.id);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl tracking-tight">Spremljene pretrage</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Spremi filter kombinaciju i dobivaj obavijesti čim se pojavi novi auto.
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-10 text-center">
          <h2 className="font-display text-xl mb-2">Još nema spremljenih pretraga</h2>
          <p className="text-sm text-[var(--color-ink-soft)] max-w-md mx-auto">
            Otvori /oglasi, postavi filtere koji ti odgovaraju, klikni &quot;Spremi pretragu&quot; — i mi ti javljamo čim se pojavi novi oglas.
          </p>
          <Button asChild variant="primary" className="mt-5">
            <Link href="/oglasi">Otvori oglase</Link>
          </Button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((s) => {
            const qs = buildQueryString(s.filterJson as Partial<ListingFilters>);
            return (
              <li
                key={s.id}
                className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4 bg-[var(--color-surface)] flex flex-wrap items-center gap-3"
              >
                <div className="flex-1 min-w-[220px]">
                  <Link
                    href={`/oglasi${qs}`}
                    className="font-medium hover:text-[var(--color-accent-dark)]"
                  >
                    {s.name}
                  </Link>
                  <div className="mt-1 text-xs text-[var(--color-muted)] truncate">
                    {Object.keys(s.filterJson).length} filtera · spremljeno{" "}
                    {new Date(s.createdAt).toLocaleDateString("hr-HR")}
                  </div>
                </div>
                <span
                  className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)]"
                  title={s.notifyEmail ? "Email obavijesti uključene" : "Bez obavijesti"}
                >
                  {s.notifyEmail ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
                  {s.notifyEmail ? "Obavijesti" : "Bez obavijesti"}
                </span>
                <SavedSearchDeleteButton id={s.id} />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
