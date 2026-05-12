"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  listingId: string;
  variant?: "card" | "detail";
  className?: string;
};

export function SaveButton({ listingId, variant = "card", className }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window === "undefined") return;
        try {
          const raw = window.localStorage.getItem("auti.saved");
          const set = new Set<string>(raw ? JSON.parse(raw) : []);
          if (set.has(listingId)) set.delete(listingId);
          else set.add(listingId);
          window.localStorage.setItem("auti.saved", JSON.stringify([...set]));
        } catch {}
      }}
      aria-label="Spremi oglas"
      className={cn(
        variant === "card"
          ? "absolute top-3 right-3 size-9 rounded-full bg-white/90 backdrop-blur text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] hover:bg-white grid place-items-center transition-colors shadow-sm"
          : "inline-flex items-center justify-center gap-2 h-9 px-3 rounded-md border border-[var(--color-line)] text-sm hover:border-[var(--color-ink)] transition-colors",
        className
      )}
    >
      <Heart className="size-4" />
      {variant === "detail" && "Spremi"}
    </button>
  );
}
