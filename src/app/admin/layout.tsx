import Link from "next/link";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/session";
import { LayoutDashboard, ListChecks, Users, Flag, ScrollText } from "lucide-react";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Pregled", icon: LayoutDashboard },
  { href: "/admin/oglasi", label: "Oglasi", icon: ListChecks },
  { href: "/admin/korisnici", label: "Korisnici", icon: Users },
  { href: "/admin/prijave", label: "Prijave", icon: Flag },
  { href: "/admin/dnevnik", label: "Dnevnik", icon: ScrollText },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[var(--color-surface)]">
      <Container className="py-8 md:py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl tracking-tight">Admin</h1>
            <p className="text-sm text-[var(--color-muted)] mt-1">
              Prijavljen kao {user.firstName} {user.lastName} · {user.email}
            </p>
          </div>
          <nav className="flex flex-wrap gap-1 text-sm">
            {NAV.map((n) => {
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-bg)] border border-transparent hover:border-[var(--color-line)] transition-colors"
                >
                  <Icon className="size-3.5" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5 md:p-8 min-w-0">
          {children}
        </div>
      </Container>
    </div>
  );
}
