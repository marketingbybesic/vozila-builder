import { db } from "@/db";

export default async function AdminAuditPage() {
  const audit = await db().adminListAudit(200);

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-2xl tracking-tight">Dnevnik</h2>
        <p className="text-sm text-[var(--color-muted)] mt-0.5">
          Posljednjih {audit.length} admin akcija
        </p>
      </header>

      {audit.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-muted)] italic">
          Nema zapisa.
        </div>
      ) : (
        <ol className="space-y-1 text-sm font-mono">
          {audit.map((a) => (
            <li
              key={a.id}
              className="grid grid-cols-[120px_140px_1fr] gap-3 py-1.5 border-b border-[var(--color-line)] last:border-0 items-center"
            >
              <span className="text-xs text-[var(--color-muted)] truncate">
                {new Date(a.createdAt).toLocaleString("hr-HR")}
              </span>
              <span className="text-xs font-semibold text-[var(--color-ink)] truncate">
                {a.action}
              </span>
              <span className="text-xs text-[var(--color-ink-soft)] truncate">
                {a.targetType && `${a.targetType}:${a.targetId?.slice(0, 8)}`}
                {a.metadata && ` · ${JSON.stringify(a.metadata)}`}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
