import { db } from "@/db";

export default async function AdminOverviewPage() {
  const kpis = await db().adminGetKpis();
  const recentAudit = await db().adminListAudit(8);

  const tiles = [
    { label: "Aktivni oglasi", value: kpis.activeListings, hint: `od ${kpis.totalListings} ukupno` },
    { label: "Registrirani", value: kpis.totalUsers, hint: `${kpis.bannedUsers} blokiranih` },
    { label: "Izdvojeno", value: kpis.featuredListings, hint: "ručno boostani" },
    { label: "Otvorene prijave", value: kpis.pendingReports, hint: "treba reviju" },
  ];

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-3">
          Pregled
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {tiles.map((t) => (
            <div
              key={t.label}
              className="rounded-[var(--radius-md)] border border-[var(--color-line)] p-4 bg-[var(--color-surface)]"
            >
              <div className="text-xs text-[var(--color-muted)]">{t.label}</div>
              <div className="font-display text-3xl mt-1 tracking-tight">{t.value}</div>
              <div className="text-[11px] text-[var(--color-muted)] mt-1">{t.hint}</div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-3">
          Posljednje akcije
        </h2>
        {recentAudit.length === 0 ? (
          <div className="text-sm text-[var(--color-muted)] italic">Nema admin akcija još.</div>
        ) : (
          <ul className="space-y-1 text-sm">
            {recentAudit.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 py-2 border-b border-[var(--color-line)] last:border-0"
              >
                <span className="inline-block size-1.5 rounded-full bg-[var(--color-accent)]" />
                <span className="font-mono text-xs text-[var(--color-muted)]">
                  {new Date(a.createdAt).toLocaleString("hr-HR")}
                </span>
                <span className="font-medium text-[var(--color-ink)]">{a.action}</span>
                {a.targetType && (
                  <span className="text-xs text-[var(--color-muted)]">
                    {a.targetType}:{a.targetId?.slice(0, 8)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
