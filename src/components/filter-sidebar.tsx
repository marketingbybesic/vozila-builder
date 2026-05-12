"use client";

import { useCallback, useMemo, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  FUEL_TYPES,
  TRANSMISSIONS,
  BODY_TYPES,
  DRIVES,
  COLORS,
  CONDITIONS,
  SELLER_TYPES,
} from "@/lib/types";
import { MAKES, getMake } from "@/data/makes";
import { COUNTIES } from "@/data/locations";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type Props = { mobile?: boolean; onClose?: () => void };

export function FilterSidebar({ mobile, onClose }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const current = useMemo(() => Object.fromEntries(params.entries()), [params]);

  const update = useCallback(
    (patch: Record<string, string | string[] | null | undefined>) => {
      const next = new URLSearchParams(params.toString());
      Object.entries(patch).forEach(([k, v]) => {
        if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) {
          next.delete(k);
        } else if (Array.isArray(v)) {
          next.set(k, v.join(","));
        } else {
          next.set(k, v);
        }
      });
      next.delete("page");
      startTransition(() => {
        router.push(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router]
  );

  const toggleMulti = useCallback(
    (key: string, value: string) => {
      const raw = current[key];
      const arr = raw ? raw.split(",").filter(Boolean) : [];
      const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
      update({ [key]: next });
    },
    [current, update]
  );

  const isChecked = (key: string, value: string) =>
    (current[key]?.split(",").filter(Boolean) ?? []).includes(value);

  const selectedMake = current.make;
  const make = selectedMake ? getMake(selectedMake) : undefined;

  const reset = () => {
    startTransition(() => router.push(pathname));
  };

  const hasFilters = Object.keys(current).some(
    (k) => k !== "sort" && k !== "page" && current[k]
  );

  return (
    <aside
      className={
        mobile
          ? "h-full overflow-y-auto scrollbar-thin"
          : "sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto scrollbar-thin pr-2"
      }
    >
      {mobile && (
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-[var(--color-bg)] z-10 pb-3 border-b border-[var(--color-line)]">
          <h2 className="font-display text-xl">Filtri</h2>
          <button
            onClick={onClose}
            className="size-9 rounded-md hover:bg-[var(--color-line)] grid place-items-center"
            aria-label="Zatvori"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {hasFilters && (
          <button
            onClick={reset}
            className="text-sm text-[var(--color-accent-dark)] hover:underline"
          >
            Poništi sve filtre
          </button>
        )}

        <FilterBlock title="Pretraga">
          <Input
            placeholder="Marka, model, ključna riječ..."
            defaultValue={current.q ?? ""}
            onBlur={(e) => update({ q: e.target.value || null })}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                update({ q: (e.target as HTMLInputElement).value || null });
              }
            }}
          />
        </FilterBlock>

        <FilterBlock title="Marka i model">
          <Select
            value={selectedMake ?? ""}
            onChange={(e) => update({ make: e.target.value || null, model: null })}
          >
            <option value="">Sve marke</option>
            {MAKES.map((m) => (
              <option key={m.slug} value={m.slug}>{m.name}</option>
            ))}
          </Select>
          {make && (
            <Select
              className="mt-2"
              value={current.model ?? ""}
              onChange={(e) => update({ model: e.target.value || null })}
            >
              <option value="">Svi modeli</option>
              {make.models.map((mod) => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </Select>
          )}
        </FilterBlock>

        <FilterBlock title="Cijena (€)">
          <RangePair
            minName="priceMin"
            maxName="priceMax"
            minVal={current.priceMin}
            maxVal={current.priceMax}
            onChange={(v) => update(v)}
            placeholderMin="0"
            placeholderMax="100.000"
          />
        </FilterBlock>

        <FilterBlock title="Godina">
          <RangePair
            minName="yearMin"
            maxName="yearMax"
            minVal={current.yearMin}
            maxVal={current.yearMax}
            onChange={(v) => update(v)}
            placeholderMin="1990"
            placeholderMax="2026"
          />
        </FilterBlock>

        <FilterBlock title="Kilometraža">
          <RangePair
            minName="kmMin"
            maxName="kmMax"
            minVal={current.kmMin}
            maxVal={current.kmMax}
            onChange={(v) => update(v)}
            placeholderMin="0"
            placeholderMax="300.000"
          />
        </FilterBlock>

        <CheckGroup
          title="Gorivo"
          options={FUEL_TYPES}
          isChecked={(v) => isChecked("fuel", v)}
          onToggle={(v) => toggleMulti("fuel", v)}
        />

        <CheckGroup
          title="Mjenjač"
          options={TRANSMISSIONS}
          isChecked={(v) => isChecked("transmission", v)}
          onToggle={(v) => toggleMulti("transmission", v)}
        />

        <CheckGroup
          title="Karoserija"
          options={BODY_TYPES}
          isChecked={(v) => isChecked("bodyType", v)}
          onToggle={(v) => toggleMulti("bodyType", v)}
        />

        <CheckGroup
          title="Pogon"
          options={DRIVES}
          isChecked={(v) => isChecked("drive", v)}
          onToggle={(v) => toggleMulti("drive", v)}
        />

        <CheckGroup
          title="Stanje"
          options={CONDITIONS}
          isChecked={(v) => isChecked("condition", v)}
          onToggle={(v) => toggleMulti("condition", v)}
        />

        <CheckGroup
          title="Tip prodavača"
          options={SELLER_TYPES}
          isChecked={(v) => isChecked("sellerType", v)}
          onToggle={(v) => toggleMulti("sellerType", v)}
        />

        <CheckGroup
          title="Boja"
          options={COLORS}
          isChecked={(v) => isChecked("color", v)}
          onToggle={(v) => toggleMulti("color", v)}
        />

        <FilterBlock title="Županija">
          <Select
            value={current.county ?? ""}
            onChange={(e) => update({ county: e.target.value || null })}
          >
            <option value="">Sve županije</option>
            {COUNTIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </FilterBlock>

        {mobile && (
          <div className="sticky bottom-0 bg-[var(--color-bg)] pt-4 -mx-4 px-4 border-t border-[var(--color-line)] mt-6">
            <Button variant="primary" className="w-full" onClick={onClose}>
              Prikaži rezultate
            </Button>
          </div>
        )}

        {pending && (
          <Badge variant="outline" className="animate-pulse">Učitavanje...</Badge>
        )}
      </div>
    </aside>
  );
}

function FilterBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-2.5">
        {title}
      </h3>
      {children}
    </div>
  );
}

function RangePair({
  minName,
  maxName,
  minVal,
  maxVal,
  onChange,
  placeholderMin,
  placeholderMax,
}: {
  minName: string;
  maxName: string;
  minVal?: string;
  maxVal?: string;
  onChange: (v: Record<string, string | null>) => void;
  placeholderMin: string;
  placeholderMax: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Input
        type="number"
        defaultValue={minVal ?? ""}
        placeholder={placeholderMin}
        onBlur={(e) => onChange({ [minName]: e.target.value || null })}
        inputMode="numeric"
      />
      <Input
        type="number"
        defaultValue={maxVal ?? ""}
        placeholder={placeholderMax}
        onBlur={(e) => onChange({ [maxName]: e.target.value || null })}
        inputMode="numeric"
      />
    </div>
  );
}

function CheckGroup<T extends string>({
  title,
  options,
  isChecked,
  onToggle,
}: {
  title: string;
  options: readonly T[];
  isChecked: (v: T) => boolean;
  onToggle: (v: T) => void;
}) {
  return (
    <FilterBlock title={title}>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt) => {
          const active = isChecked(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={
                "text-xs px-2.5 py-1.5 rounded-full border transition-all " +
                (active
                  ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                  : "bg-transparent text-[var(--color-ink-soft)] border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")
              }
            >
              {opt}
            </button>
          );
        })}
      </div>
    </FilterBlock>
  );
}
