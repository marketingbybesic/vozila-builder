"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeaderSearch() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (!term) {
      router.push("/oglasi");
      return;
    }
    router.push(`/oglasi?q=${encodeURIComponent(term)}`);
  };

  return (
    <form onSubmit={submit} className="relative" role="search">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-[var(--color-muted)] pointer-events-none" />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Pretraži marku, model, ključnu riječ..."
        aria-label="Globalna pretraga"
        className="w-full h-10 pl-9 pr-3 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-sm focus:border-[var(--color-ink)] focus:bg-[var(--color-bg)] outline-none transition-colors"
      />
    </form>
  );
}
