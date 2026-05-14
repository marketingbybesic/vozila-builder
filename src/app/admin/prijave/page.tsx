import Link from "next/link";
import { db } from "@/db";
import { Badge } from "@/components/ui/badge";
import { AdminReportRowActions } from "@/components/admin-report-row-actions";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const status = (sp.status as "open" | "reviewing" | "resolved" | "dismissed" | undefined) ?? "open";
  const rows = await db().listReports({ status });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Prijave</h2>
          <p className="text-sm text-[var(--color-muted)] mt-0.5">{rows.length} prijava</p>
        </div>
        <nav className="flex gap-1 text-sm">
          {(["open", "reviewing", "resolved", "dismissed"] as const).map((s) => (
            <Link
              key={s}
              href={`/admin/prijave?status=${s}`}
              className={
                s === status
                  ? "px-3 py-1.5 rounded-md bg-[var(--color-ink)] text-white text-xs font-medium"
                  : "px-3 py-1.5 rounded-md text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40 text-xs"
              }
            >
              {s}
            </Link>
          ))}
        </nav>
      </header>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-muted)] italic">
          Nema prijava u statusu &quot;{status}&quot;.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li
              key={r.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4 bg-[var(--color-surface)] flex flex-wrap items-start gap-4"
            >
              <div className="flex-1 min-w-[260px]">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{r.reason}</Badge>
                  <Link
                    href={`/oglasi/${r.listingSlug}`}
                    className="font-medium hover:text-[var(--color-accent-dark)]"
                    target="_blank"
                  >
                    {r.listingTitle}
                  </Link>
                </div>
                <p className="mt-2 text-sm text-[var(--color-ink-soft)] whitespace-pre-wrap">{r.body}</p>
                <div className="mt-2 text-xs text-[var(--color-muted)]">
                  {new Date(r.createdAt).toLocaleString("hr-HR")}
                </div>
              </div>
              {r.status === "open" || r.status === "reviewing" ? (
                <AdminReportRowActions reportId={r.id} />
              ) : (
                <Badge variant="neutral">{r.status}</Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
