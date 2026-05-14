import { db } from "@/db";
import { Badge } from "@/components/ui/badge";
import { AdminUserRowActions } from "@/components/admin-user-row-actions";
import { requireAdmin } from "@/lib/session";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const rows = await db().adminListUsers({ q: sp.q, role: sp.role });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl tracking-tight">Korisnici</h2>
          <p className="text-sm text-[var(--color-muted)] mt-0.5">{rows.length} rezultata</p>
        </div>
        <form className="flex flex-wrap gap-2 text-sm">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Email ili ime..."
            className="h-9 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]"
          />
          <select
            name="role"
            defaultValue={sp.role ?? ""}
            className="h-9 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-surface)]"
          >
            <option value="">Sve uloge</option>
            <option value="user">Korisnik</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
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
              <th className="px-5 py-2.5 font-semibold">Korisnik</th>
              <th className="px-3 py-2.5 font-semibold">Tip</th>
              <th className="px-3 py-2.5 font-semibold">Uloga</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">Registriran</th>
              <th className="px-5 py-2.5 font-semibold text-right">Akcije</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr
                key={u.id}
                className="border-b border-[var(--color-line)] last:border-0 hover:bg-[var(--color-surface)]/50"
              >
                <td className="px-5 py-3 min-w-[240px]">
                  <div className="font-medium">{u.firstName} {u.lastName}</div>
                  <div className="text-xs text-[var(--color-muted)] mt-0.5">{u.email}</div>
                </td>
                <td className="px-3 py-3 text-xs">{u.sellerType}</td>
                <td className="px-3 py-3">
                  <Badge variant={u.role === "admin" ? "accent" : "neutral"}>{u.role}</Badge>
                </td>
                <td className="px-3 py-3">
                  {u.bannedAt ? (
                    <Badge variant="outline">Blokiran</Badge>
                  ) : (
                    <Badge variant="neutral">Aktivan</Badge>
                  )}
                </td>
                <td className="px-3 py-3 text-xs text-[var(--color-muted)]">
                  {new Date(u.createdAt).toLocaleDateString("hr-HR")}
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <AdminUserRowActions
                    userId={u.id}
                    role={u.role}
                    banned={!!u.bannedAt}
                    isSelf={u.id === me.id}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
