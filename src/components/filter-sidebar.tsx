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
import { CATEGORIES, getCategory } from "@/data/categories";
import { COUNTIES } from "@/data/locations";
import { getFilterDefs, groupFields, type FilterField } from "@/data/category-filters";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

// Column-stored keys are handled by the static blocks below.
// Attr-stored keys render dynamically per category.
const STATIC_KEYS = new Set([
  "priceEur", "year", "km", "fuel", "transmission", "bodyType", "drive",
  "color", "condition", "sellerType", "county", "make", "model",
]);

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
  const category = current.category ?? "";
  const categoryDef = category ? getCategory(category) : undefined;
  // Make list depends on category. For "" (all) we show car makes (largest known set).
  const makeOptions = useMemo(() => {
    if (!category) return MAKES.map((m) => ({ slug: m.slug, name: m.name }));
    return categoryDef?.makes ?? [];
  }, [category, categoryDef]);
  const make = selectedMake && (!category || category === "auto") ? getMake(selectedMake) : undefined;
  const filterDef = useMemo(() => getFilterDefs(category || "auto"), [category]);
  const attrFields = useMemo(
    () => filterDef.fields.filter((f) => f.storage === "attr" && !STATIC_KEYS.has(f.key)),
    [filterDef]
  );
  const attrGroups = useMemo(() => groupFields(attrFields), [attrFields]);
  // Subcategory options
  const subcategoryOptions = categoryDef?.subcategories ?? [];

  const attrToggle = useCallback(
    (key: string) => {
      const k = `a.${key}`;
      const cur = current[k];
      update({ [k]: cur === "1" ? null : "1" });
    },
    [current, update]
  );

  const attrSet = useCallback(
    (key: string, value: string | null) => {
      update({ [`a.${key}`]: value });
    },
    [update]
  );

  const attrMulti = useCallback(
    (key: string, value: string) => {
      const k = `a.${key}`;
      const cur = current[k]?.split(",").filter(Boolean) ?? [];
      const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
      update({ [k]: next });
    },
    [current, update]
  );

  const attrIsChecked = (key: string, value: string) =>
    (current[`a.${key}`]?.split(",").filter(Boolean) ?? []).includes(value);

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

        <FilterBlock title="Kategorija">
          <Select
            value={category}
            onChange={(e) => update({ category: e.target.value || null, subcategory: null, make: null, model: null })}
          >
            <option value="">Sve kategorije</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </Select>
          {subcategoryOptions.length > 0 && (
            <Select
              className="mt-2"
              value={current.subcategory ?? ""}
              onChange={(e) => update({ subcategory: e.target.value || null })}
            >
              <option value="">Sve podkategorije</option>
              {subcategoryOptions.map((sc) => (
                <option key={sc.slug} value={sc.slug}>{sc.name}</option>
              ))}
            </Select>
          )}
        </FilterBlock>

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
            {makeOptions.map((m) => (
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

        {attrGroups.length > 0 && (
          <div className="space-y-6 pt-2 border-t border-[var(--color-line)]">
            <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-accent-dark)] pt-2">
              Specifični filtri · {filterDef.label}
            </div>
            {attrGroups.map((g) => (
              <div key={g.name} className="space-y-4">
                <h3 className="text-[11px] uppercase tracking-widest font-semibold text-[var(--color-muted)]">
                  {g.name}
                </h3>
                {g.fields.map((f) => (
                  <AttrField
                    key={f.key}
                    field={f}
                    current={current}
                    onToggle={() => attrToggle(f.key)}
                    onSet={(v) => attrSet(f.key, v)}
                    onMulti={(v) => attrMulti(f.key, v)}
                    isChecked={(v) => attrIsChecked(f.key, v)}
                  />
                ))}
              </div>
            ))}
          </div>
        )}

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

function AttrField({
  field,
  current,
  onToggle,
  onSet,
  onMulti,
  isChecked,
}: {
  field: FilterField;
  current: Record<string, string>;
  onToggle: () => void;
  onSet: (v: string | null) => void;
  onMulti: (v: string) => void;
  isChecked: (v: string) => boolean;
}) {
  const key = `a.${field.key}`;
  const raw = current[key] ?? "";

  if (field.type === "toggle") {
    const on = raw === "1" || raw === "true";
    return (
      <button
        type="button"
        onClick={onToggle}
        className={
          "w-full text-left text-sm px-3 py-2 rounded-[var(--radius-md)] border transition-all flex items-center justify-between " +
          (on
            ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
            : "bg-transparent text-[var(--color-ink-soft)] border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")
        }
      >
        <span>{field.label}</span>
        <span className={"size-2 rounded-full " + (on ? "bg-[var(--color-accent)]" : "bg-[var(--color-line)]")} />
      </button>
    );
  }

  if (field.type === "range") {
    const [minS, maxS] = raw.includes("..") ? raw.split("..") : ["", ""];
    return (
      <div>
        <div className="text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">{field.label}{field.unit ? ` (${field.unit})` : ""}</div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            defaultValue={minS}
            placeholder={field.min !== undefined ? String(field.min) : "Min"}
            inputMode="numeric"
            onBlur={(e) => {
              const v = e.target.value;
              const max = maxS;
              if (!v && !max) onSet(null);
              else onSet(`${v}..${max}`);
            }}
          />
          <Input
            type="number"
            defaultValue={maxS}
            placeholder={field.max !== undefined ? String(field.max) : "Max"}
            inputMode="numeric"
            onBlur={(e) => {
              const v = e.target.value;
              const min = minS;
              if (!v && !min) onSet(null);
              else onSet(`${min}..${v}`);
            }}
          />
        </div>
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div>
        <div className="text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">{field.label}</div>
        <Select value={raw} onChange={(e) => onSet(e.target.value || null)}>
          <option value="">Sve</option>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </Select>
      </div>
    );
  }

  if (field.type === "multi") {
    return (
      <div>
        <div className="text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">{field.label}</div>
        <div className="flex flex-wrap gap-1.5">
          {field.options?.map((o) => {
            const active = isChecked(o.value);
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onMulti(o.value)}
                className={
                  "text-xs px-2.5 py-1.5 rounded-full border transition-all " +
                  (active
                    ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                    : "bg-transparent text-[var(--color-ink-soft)] border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")
                }
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // text fallback
  return (
    <div>
      <div className="text-xs font-medium text-[var(--color-ink-soft)] mb-1.5">{field.label}</div>
      <Input
        defaultValue={raw}
        placeholder={field.label}
        onBlur={(e) => onSet(e.target.value || null)}
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
