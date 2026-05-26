"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, SlidersHorizontal } from "lucide-react";
import { MAKES as AUTO_MAKES } from "@/data/makes";
import { FUEL_TYPES, TRANSMISSIONS, BODY_TYPES } from "@/lib/types";

const PRICE_STEPS = [1000, 2500, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000, 150000, 200000];
const KM_STEPS = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000, 300000];
const YEAR_NOW = new Date().getFullYear();
const YEARS = Array.from({ length: 26 }, (_, i) => YEAR_NOW - i);

const selectClass =
  "w-full h-10 px-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg)] text-sm focus:border-[var(--color-ink)] outline-none";

export function HeroSearch() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [kmMax, setKmMax] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [transmission, setTransmission] = useState("");
  const [fuel, setFuel] = useState("");

  const selectedMake = AUTO_MAKES.find((m) => m.slug === make);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (priceMin) params.set("priceMin", priceMin);
    if (priceMax) params.set("priceMax", priceMax);
    if (yearMin) params.set("yearMin", yearMin);
    if (yearMax) params.set("yearMax", yearMax);
    if (kmMax) params.set("kmMax", kmMax);
    if (bodyType) params.set("bodyType", bodyType);
    if (transmission) params.set("transmission", transmission);
    if (fuel) params.set("fuel", fuel);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/oglasi?${qs}` : "/oglasi");
    });
  };

  return (
    <form
      onSubmit={submit}
      className="bg-[var(--color-bg)] text-[var(--color-ink)] rounded-[var(--radius-lg)] p-4 md:p-6 shadow-xl border border-white/10"
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

      <div className="grid grid-cols-2 gap-x-3 gap-y-2">
        {/* 1. Marka */}
        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Marka
          </span>
          <select
            value={make}
            onChange={(e) => { setMake(e.target.value); setModel(""); }}
            className={selectClass}
          >
            <option value="">Sve marke</option>
            {AUTO_MAKES.map((m) => (
              <option key={m.slug} value={m.slug}>{m.name}</option>
            ))}
          </select>
        </label>

        {/* 2. Model */}
        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Model
          </span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!selectedMake}
            className={`${selectClass} disabled:opacity-50`}
          >
            <option value="">{selectedMake ? "Svi modeli" : "Odaberi marku"}</option>
            {selectedMake?.models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        {/* 3. Cijena od */}
        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Cijena od
          </span>
          <select value={priceMin} onChange={(e) => setPriceMin(e.target.value)} className={selectClass}>
            <option value="">Bilo koja</option>
            {PRICE_STEPS.map((p) => (
              <option key={p} value={p}>{p.toLocaleString("hr-HR")} &euro;</option>
            ))}
          </select>
        </label>

        {/* 4. Cijena do */}
        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Cijena do
          </span>
          <select value={priceMax} onChange={(e) => setPriceMax(e.target.value)} className={selectClass}>
            <option value="">Bez granice</option>
            {PRICE_STEPS.map((p) => (
              <option key={p} value={p}>do {p.toLocaleString("hr-HR")} &euro;</option>
            ))}
          </select>
        </label>

        {/* 5. Godina od */}
        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Godina od
          </span>
          <select value={yearMin} onChange={(e) => setYearMin(e.target.value)} className={selectClass}>
            <option value="">Sve godine</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>od {y}</option>
            ))}
          </select>
        </label>

        {/* 6. Godina do */}
        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Godina do
          </span>
          <select value={yearMax} onChange={(e) => setYearMax(e.target.value)} className={selectClass}>
            <option value="">Sve godine</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>do {y}</option>
            ))}
          </select>
        </label>

        {/* 7. Kilometraža do */}
        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Kilometraža do
          </span>
          <select value={kmMax} onChange={(e) => setKmMax(e.target.value)} className={selectClass}>
            <option value="">Bez granice</option>
            {KM_STEPS.map((k) => (
              <option key={k} value={k}>do {k.toLocaleString("hr-HR")} km</option>
            ))}
          </select>
        </label>

        {/* 8. Karoserija */}
        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Karoserija
          </span>
          <select value={bodyType} onChange={(e) => setBodyType(e.target.value)} className={selectClass}>
            <option value="">Sve</option>
            {BODY_TYPES.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </label>

        {/* 9. Mjenjač */}
        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Mjenjač
          </span>
          <select value={transmission} onChange={(e) => setTransmission(e.target.value)} className={selectClass}>
            <option value="">Svi</option>
            {TRANSMISSIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </label>

        {/* 10. Gorivo */}
        <label className="block text-xs">
          <span className="block mb-1 font-semibold uppercase tracking-wider text-[var(--color-muted)]">
            Gorivo
          </span>
          <select value={fuel} onChange={(e) => setFuel(e.target.value)} className={selectClass}>
            <option value="">Sve</option>
            {FUEL_TYPES.map((f) => (
              <option key={f} value={f}>{f}</option>
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
          Pregledaj sve oglase &rarr;
        </Link>
        <Link href="/oglasi/najnoviji" className="hover:text-[var(--color-ink)]">
          Najnoviji oglasi &rarr;
        </Link>
      </div>
    </form>
  );
}
