"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CircleParking } from "lucide-react";
import { toggleSavedAction } from "@/actions/saved";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  variant?: "card" | "detail";
  className?: string;
};

export function SaveButton({ listingId, variant = "card", className }: Props) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("auti.saved");
      const arr: string[] = raw ? JSON.parse(raw) : [];
      setSaved(arr.includes(listingId));
    } catch {}
  }, [listingId]);

  const onToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !saved;
    setSaved(next);
    // Mirror to localStorage for guests
    try {
      const raw = window.localStorage.getItem("auti.saved");
      const set = new Set<string>(raw ? JSON.parse(raw) : []);
      if (next) set.add(listingId);
      else set.delete(listingId);
      window.localStorage.setItem("auti.saved", JSON.stringify([...set]));
    } catch {}
    // Try to persist server-side; if not authed, the localStorage state is the source of truth
    start(async () => {
      const res = await toggleSavedAction(listingId);
      if (res.authed) router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={pending}
      aria-pressed={saved}
      aria-label={saved ? "Ukloni iz parkinga" : "Parkiraj oglas"}
      className={cn(
        variant === "card"
          ? "absolute top-3 right-3 size-9 rounded-full bg-white/90 backdrop-blur grid place-items-center transition-colors shadow-sm "
            + (saved ? "text-[var(--color-danger)] hover:bg-white" : "text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] hover:bg-white")
          : "inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md border border-[var(--color-line)] text-sm transition-colors "
            + (saved ? "border-[var(--color-danger)] text-[var(--color-danger)]" : "hover:border-[var(--color-ink)]"),
        className
      )}
    >
      {/* Bez `fill-current` — ispunjen CircleParking postane pun krug bez
          čitljivog "P"; stanje ionako nosi boja (danger). */}
      <CircleParking className="size-4" />
      {variant === "detail" && (saved ? "Moj parking" : "Parkiraj")}
    </button>
  );
}
