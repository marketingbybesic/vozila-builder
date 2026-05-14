"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { User, Car, Heart, MessageSquare, Settings, BookmarkPlus } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/moj-racun", label: "Pregled", icon: User, exact: true },
  { href: "/moj-racun/oglasi", label: "Moji oglasi", icon: Car },
  { href: "/moj-racun/spremljeno", label: "Spremljeno", icon: Heart },
  { href: "/moj-racun/pretrage", label: "Pretrage", icon: BookmarkPlus },
  { href: "/moj-racun/poruke", label: "Poruke", icon: MessageSquare, badgeKey: "unreadMessages" as const },
  { href: "/moj-racun/postavke", label: "Postavke", icon: Settings },
];

export function DashboardNav({
  user,
  unreadMessages,
}: {
  user: { firstName: string; lastName: string; email: string };
  unreadMessages: number;
}) {
  const pathname = usePathname();
  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <aside>
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-full bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] grid place-items-center text-white font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-sm truncate">{user.firstName} {user.lastName}</div>
            <div className="text-xs text-[var(--color-muted)] truncate">{user.email}</div>
          </div>
        </div>
      </div>

      <nav className="lg:sticky lg:top-20">
        <ul className="space-y-0.5">
          {NAV.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            const badge = "badgeKey" in item && item.badgeKey === "unreadMessages" ? unreadMessages : 0;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors relative",
                    active
                      ? "bg-[var(--color-ink)] text-white font-medium"
                      : "text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40 hover:text-[var(--color-ink)]"
                  )}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {badge > 0 && (
                    <span className={cn(
                      "text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[18px] text-center",
                      active ? "bg-[var(--color-accent)] text-[var(--color-ink)]" : "bg-[var(--color-accent)]/20 text-[var(--color-accent-dark)]"
                    )}>
                      {badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
          <li className="pt-2 mt-2 border-t border-[var(--color-line)]">
            <SignOutButton />
          </li>
        </ul>
      </nav>
    </aside>
  );
}
