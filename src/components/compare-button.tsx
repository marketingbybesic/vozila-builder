"use client";

import { useEffect, useState, useCallback } from "react";
import { GitCompare } from "lucide-react";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "auti.compare";
const MAX = 4;

function readSet(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeSet(slugs: string[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
    window.dispatchEvent(new Event("auti.compare.changed"));
  } catch {}
}

export function CompareButton({ slug, variant = "card" }: { slug: string; variant?: "card" | "detail" }) {
  const [active, setActive] = useState(false);

  const refresh = useCallback(() => {
    setActive(readSet().includes(slug));
  }, [slug]);

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("auti.compare.changed", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("auti.compare.changed", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, [refresh]);

  const toggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const cur = readSet();
    if (cur.includes(slug)) {
      writeSet(cur.filter((s) => s !== slug));
    } else {
      if (cur.length >= MAX) {
        alert(`Maksimalno ${MAX} vozila u usporedbi. Ukloni jedno prije dodavanja.`);
        return;
      }
      writeSet([...cur, slug]);
    }
  };

  if (variant === "detail") {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "h-11 px-4 rounded-md border text-sm font-medium inline-flex items-center justify-center gap-1.5 transition-colors",
          active
            ? "border-[var(--color-accent)] bg-[var(--color-accent)]/15 text-[var(--color-accent-dark)]"
            : "border-[var(--color-line)] hover:bg-[var(--color-line)]/40"
        )}
      >
        <GitCompare className="size-4" />
        {active ? "U usporedbi" : "Usporedi"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={active ? "Ukloni iz usporedbe" : "Dodaj u usporedbu"}
      className={cn(
        "absolute top-3 right-14 z-10 size-9 grid place-items-center rounded-full transition-colors backdrop-blur-sm",
        active
          ? "bg-[var(--color-accent)] text-[var(--color-ink)]"
          : "bg-[var(--color-bg)]/80 text-[var(--color-ink-soft)] hover:bg-[var(--color-bg)] hover:text-[var(--color-ink)]"
      )}
    >
      <GitCompare className="size-4" />
    </button>
  );
}

export function CompareBar() {
  const [slugs, setSlugs] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setSlugs(readSet());
    refresh();
    window.addEventListener("auti.compare.changed", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("auti.compare.changed", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  if (slugs.length < 2) return null;

  const params = new URLSearchParams();
  slugs.forEach((s, i) => params.set(["a", "b", "c", "d"][i], s));

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-[var(--color-ink)] text-white rounded-full shadow-xl pl-4 pr-1 py-1 flex items-center gap-3 text-sm">
      <GitCompare className="size-4" />
      <span>{slugs.length} u usporedbi</span>
      <a
        href={`/usporedi?${params.toString()}`}
        className="h-9 px-4 rounded-full bg-[var(--color-accent)] text-[var(--color-ink)] font-medium hover:brightness-95"
      >
        Usporedi sad
      </a>
      <button
        type="button"
        onClick={() => writeSet([])}
        className="size-9 rounded-full hover:bg-white/10 grid place-items-center"
        title="Ukloni sve"
      >
        ×
      </button>
    </div>
  );
}
