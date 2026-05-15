"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, SlidersHorizontal } from "lucide-react";
import { MAKES } from "@/data/makes";

const PRICE_STEPS = [1000, 2500, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];
const YEAR_NOW = new Date().getFullYear();
const YEARS = Array.from({ length: 26 }, (_, i) => YEAR_NOW - i);

export function HeroSearch() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yearMin, setYearMin] = useState("");

  const selectedMake = MAKES.find((m) => m.slug === make);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (priceMax) params.set("priceMax", priceMax);
    if (yearMin) params.set("yearMin", yearMin);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/oglasi?${qs}` : "/oglasi");
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-[var(--color-bg)] text-[var(--color-ink)] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-xl border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg md:text-xl tracking-tight inline-flex items-center gap-2">
          <Search className="size-4 text-[var(--color-accent-dark)]" />
          Brza pretraga
        </h2>
        <Link
          href="/oglasi/napredno"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent-dark)] hover:underline"
        >
          <SlidersHorizontal className="size-3.5" />
          Napredno
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Marka
          </span>
          <select
            value={make}
            onChange={(e) => {
              setMake(e.target.value);
              setModel("");
            }}
            className="w-full h-11 px-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg)] text-sm focus:border-[var(--color-ink)] outline-none"
          >
            <option value="">Sve marke</option>
            {MAKES.map((m) => (
              <option key={m.slug} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Model
          </span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!selectedMake}
            className="w-full h-11 px-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg)] text-sm focus:border-[var(--color-ink)] outline-none disabled:opacity-50"
          >
            <option value="">{selectedMake ? "Svi modeli" : "Odaberi marku prvo"}</option>
            {selectedMake?.models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Cijena do
          </span>
          <select
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full h-11 px-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg)] text-sm focus:border-[var(--color-ink)] outline-none"
          >
            <option value="">Bez granice</option>
            {PRICE_STEPS.map((p) => (
              <option key={p} value={p}>
                do {p.toLocaleString("hr-HR")} €
              </option>
            ))}
          </select>
        </label>

        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Godina od
          </span>
          <select
            value={yearMin}
            onChange={(e) => setYearMin(e.target.value)}
            className="w-full h-11 px-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg)] text-sm focus:border-[var(--color-ink)] outline-none"
          >
            <option value="">Sve godine</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                od {y}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full h-12 rounded-[var(--radius-md)] bg-[var(--color-ink)] text-white text-sm font-semibold uppercase tracking-widest inline-flex items-center justify-center gap-2 hover:bg-[var(--color-ink-soft)] disabled:opacity-60 transition-colors"
      >
        {pending ? "Tražim..." : "Pretraži"}
        <ArrowRight className="size-4" />
      </button>

      <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--color-muted)]">
        <Link href="/oglasi" className="hover:text-[var(--color-ink)]">
          Pregledaj sve oglase →
        </Link>
        <Link href="/oglasi/najnoviji" className="hover:text-[var(--color-ink)]">
          Najnoviji oglasi →
        </Link>
      </div>
    </form>
  );
}
