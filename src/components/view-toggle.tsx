"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";

/** Prekidač načina prikaza oglasa: kartice (grid) ili lista. URL: ?view=list */
export function ViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const current = params.get("view") === "list" ? "list" : "grid";

  const setView = (v: "grid" | "list") => {
    const next = new URLSearchParams(params.toString());
    if (v === "grid") next.delete("view");
    else next.set("view", "list");
    router.push(`${pathname}?${next.toString()}`, { scroll: false });
  };

  const btn = (v: "grid" | "list", Icon: typeof LayoutGrid, label: string) => {
    const active = current === v;
    return (
      <button
        type="button"
        onClick={() => setView(v)}
        aria-pressed={active}
        aria-label={label}
        title={label}
        className={
          "h-9 w-9 grid place-items-center rounded-lg transition-colors " +
          (active
            ? "bg-[var(--color-ink)] text-white"
            : "text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/50")
        }
      >
        <Icon className="size-4" />
      </button>
    );
  };

  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
      {btn("grid", LayoutGrid, "Prikaz u karticama")}
      {btn("list", List, "Prikaz u listi")}
    </div>
  );
}
