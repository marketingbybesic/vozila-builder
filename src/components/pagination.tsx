import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams: Record<string, string | string[] | undefined>;
};

function buildHref(
  basePath: string,
  searchParams: Record<string, string | string[] | undefined>,
  page: number
): string {
  const sp = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v === undefined || v === "") return;
    if (Array.isArray(v)) sp.set(k, v.join(","));
    else sp.set(k, String(v));
  });
  if (page > 1) sp.set("page", String(page));
  else sp.delete("page");
  const q = sp.toString();
  return q ? `${basePath}?${q}` : basePath;
}

export function Pagination({ page, totalPages, basePath, searchParams }: Props) {
  if (totalPages <= 1) return null;

  const pages: (number | "...")[] = [];
  const push = (n: number | "...") => {
    if (pages[pages.length - 1] !== n) pages.push(n);
  };
  push(1);
  if (page > 3) push("...");
  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
    push(i);
  }
  if (page < totalPages - 2) push("...");
  if (totalPages > 1) push(totalPages);

  return (
    <nav className="flex items-center justify-center gap-1.5 mt-12" aria-label="Paginacija">
      <PageLink
        href={buildHref(basePath, searchParams, Math.max(1, page - 1))}
        disabled={page === 1}
        ariaLabel="Prethodna stranica"
      >
        <ChevronLeft className="size-4" />
      </PageLink>
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`dot-${i}`} className="size-10 grid place-items-center text-[var(--color-muted)]">
            …
          </span>
        ) : (
          <PageLink
            key={p}
            href={buildHref(basePath, searchParams, p)}
            active={p === page}
            ariaLabel={`Stranica ${p}`}
          >
            {p}
          </PageLink>
        )
      )}
      <PageLink
        href={buildHref(basePath, searchParams, Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        ariaLabel="Sljedeća stranica"
      >
        <ChevronRight className="size-4" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  href,
  children,
  active,
  disabled,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled
        aria-label={ariaLabel}
        className="size-10 grid place-items-center rounded-md text-[var(--color-muted)] opacity-50"
      >
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={cn(
        "size-10 grid place-items-center rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-[var(--color-ink)] text-white"
          : "text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40"
      )}
    >
      {children}
    </Link>
  );
}
