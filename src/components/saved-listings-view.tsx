"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { LISTINGS } from "@/data/listings";

export function SavedListingsView() {
  const [savedIds, setSavedIds] = useState<string[] | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("auti.saved");
      setSavedIds(raw ? JSON.parse(raw) : []);
    } catch {
      setSavedIds([]);
    }
  }, []);

  if (savedIds === null) {
    return (
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] animate-pulse" />
        ))}
      </div>
    );
  }

  const saved = LISTINGS.filter((l) => savedIds.includes(l.id));

  if (saved.length === 0) {
    return (
      <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-12 text-center">
        <div className="size-14 mx-auto rounded-full bg-[var(--color-line)] grid place-items-center text-[var(--color-muted)]">
          <Heart className="size-6" />
        </div>
        <h2 className="font-display text-xl mt-5">Još nemaš spremljenih oglasa</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-md mx-auto">
          Klikni srce na oglasu koji ti se sviđa - vraćamo ti se s njim ovdje. Pratimo i promjene cijene.
        </p>
        <Button asChild variant="primary" className="mt-6">
          <Link href="/oglasi">Pretraži oglase</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {saved.map((l) => (
        <ListingCard key={l.id} listing={l} />
      ))}
    </div>
  );
}
