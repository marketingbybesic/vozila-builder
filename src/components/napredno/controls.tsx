"use client";

/**
 * Napredna pretraga — reusable form controls.
 * One coherent system (no chips-wall): every multi filter is a dropdown that
 * opens a checkbox list; selections render as removable chips below the field.
 */

import { useEffect, useId, useRef, useState } from "react";
import {
  Check, ChevronDown, X, Car, Caravan, Truck, Bus, Container, Forklift,
  Tractor, Bike, Box, Disc3, type LucideIcon,
} from "lucide-react";

export type Opt = { value: string; label: string };

/**
 * Ikona po obliku karoserije (radi za sve kategorije: auto/gospodarska/...).
 * PRIVREMENO: lucide nema točne bočne siluete karoserija pa auto-podtipovi
 * (Limuzina/SUV/Coupe/...) dijele Car. Vehicle-type ikone (Truck/Bus/Caravan/
 * Forklift) SU točne. TODO: zamijeniti pravim SVG siluetama (vidi memory).
 */
const BODY_ICON: Record<string, LucideIcon> = {
  // auto
  Microcar: Car, Limuzina: Car, Hatchback: Car, Karavan: Car, Monovolumen: Car,
  SUV: Car, Coupe: Car, Cabrio: Car, Pickup: Truck,
  // gospodarska
  Furgon: Truck, Kombi: Truck, Kamionet: Truck, "Šasija s kabinom": Truck,
  "Šasija s nadgradnjom": Container, "Pick up": Truck,
  Autobusi: Bus, Kamioni: Truck, "Dostavna vozila": Truck, "Teretne prikolice": Container,
  // generičke
  Kamper: Caravan, "Mobilne kućice": Caravan, Viličari: Forklift, Traktor: Tractor,
  Motocikl: Bike, Skuter: Bike,
};
function bodyIcon(label: string): LucideIcon {
  if (BODY_ICON[label]) return BODY_ICON[label];
  const l = label.toLowerCase();
  if (l.includes("kamion") || l.includes("furgon") || l.includes("dostav") || l.includes("pickup") || l.includes("pick up")) return Truck;
  if (l.includes("autobus") || l.includes("bus")) return Bus;
  if (l.includes("kamper") || l.includes("kućic") || l.includes("prikolic")) return Caravan;
  if (l.includes("vilič") || l.includes("vilic")) return Forklift;
  if (l.includes("traktor") || l.includes("stroj")) return Tractor;
  if (l.includes("moto") || l.includes("skuter") || l.includes("bicikl")) return Bike;
  if (l.includes("kontejner") || l.includes("šasij") || l.includes("sasij")) return Container;
  if (l.includes("oprema") || l.includes("dio") || l.includes("dijel")) return Box;
  return Car;
}

/** Oblik karoserije kao chips s ikonom (lijepo, za sve kategorije). */
export function BodyTypePicker({
  label, required, optional, values, onChange, options, cols = 2,
}: { label?: string; required?: boolean; optional?: boolean; values: string[]; onChange: (v: string[]) => void; options: Opt[]; cols?: 2 | 3 }) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div>
      {label && <Label required={required} optional={optional}>{label}</Label>}
      <div className={"grid gap-2 " + (cols === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
        {options.map((o) => {
          const Icon = bodyIcon(o.label);
          const active = values.includes(o.value);
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => toggle(o.value)}
              aria-pressed={active}
              title={o.label}
              className={
                "flex items-center gap-1.5 px-2 h-11 rounded-xl border text-[13px] leading-tight text-left transition-all " +
                (active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/8 font-medium text-[var(--color-ink)]"
                  : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]")
              }
            >
              <Icon className={"size-4 shrink-0 " + (active ? "text-[var(--color-accent-dark)]" : "text-[var(--color-muted)]")} />
              <span className="min-w-0 leading-tight">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const fieldBase =
  "w-full h-12 px-3.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] text-sm " +
  "text-[var(--color-ink)] transition-colors focus:outline-none focus:border-[var(--color-accent)] " +
  "focus:ring-2 focus:ring-[var(--color-accent)]/25";

export function Label({
  children, required, optional,
}: { children: React.ReactNode; required?: boolean; optional?: boolean }) {
  return (
    <span className="flex items-center gap-1.5 mb-1.5 text-[13px] font-semibold text-[var(--color-ink-soft)]">
      <span>{children}</span>
      {required && <span className="text-[var(--color-danger)]" aria-hidden>*</span>}
      {required && <span className="sr-only">(obavezno)</span>}
      {optional && !required && (
        <span className="text-[11px] font-normal text-[var(--color-muted)]">(nije obavezno)</span>
      )}
    </span>
  );
}

/** Hook: close popover on outside-click / Escape. */
function useDismiss(open: boolean, onClose: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);
  return ref;
}

const panelWrapCls =
  "absolute z-30 mt-2 w-full rounded-xl border border-[var(--color-line)] " +
  "bg-[var(--color-surface)] shadow-xl shadow-black/10 overflow-hidden";
const panelScrollCls = "max-h-64 overflow-y-auto p-1.5 scrollbar-visible";

/**
 * Popover s vidljivim scrollom: sam izmjeri prelijeva li sadržaj (scrollHeight),
 * pa pokaže elegantan fade + chevron-pill na dnu dok ima opcija ispod.
 * Neovisno o OS overlay scrollbarima.
 */
function Popover({ id, children }: { id: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [overflow, setOverflow] = useState(false);
  const [atBottom, setAtBottom] = useState(true);
  const measure = () => {
    const el = ref.current;
    if (!el) return;
    const canScroll = el.scrollHeight > el.clientHeight + 2;
    setOverflow(canScroll);
    setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 4);
  };
  useEffect(() => { measure(); }, []);
  const showHint = overflow && !atBottom;
  return (
    <div className={panelWrapCls}>
      <div ref={ref} id={id} className={panelScrollCls} onScroll={measure}>
        {children}
      </div>
      {/* Elegantan nagovještaj skrolanja: fade + chevron-pill */}
      <div
        className={
          "pointer-events-none absolute inset-x-0 bottom-0 h-12 flex items-end justify-center pb-1.5 " +
          "bg-gradient-to-t from-[var(--color-surface)] via-[var(--color-surface)]/80 to-transparent " +
          "transition-opacity duration-200 " + (showHint ? "opacity-100" : "opacity-0")
        }
      >
        <span className="grid place-items-center size-6 rounded-full bg-[var(--color-surface)] border border-[var(--color-line)] shadow-sm">
          <ChevronDown className="size-3.5 text-[var(--color-ink-soft)] animate-bounce-slow" strokeWidth={2.5} />
        </span>
      </div>
    </div>
  );
}
const optionCls = (active: boolean) =>
  "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-colors " +
  (active
    ? "bg-[var(--color-accent)]/10 text-[var(--color-ink)]"
    : "text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40");

/**
 * Single-select dropdown — same custom popover look as MultiSelect.
 * Radio behavior: picking an option closes the menu.
 */
export function SelectField({
  label, required, optional, value, onChange, options, placeholder = "Sve", icon: Icon,
}: {
  label?: string; required?: boolean; optional?: boolean; value: string; onChange: (v: string) => void;
  options: Opt[]; placeholder?: string; icon?: LucideIcon;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useDismiss(open, () => setOpen(false));
  const current = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="block">
      {label && <Label required={required} optional={optional}>{label}</Label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className={
            fieldBase + " flex items-center gap-2.5 text-left cursor-pointer " +
            (value ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]")
          }
        >
          {Icon && (
            <Icon className={"size-4.5 shrink-0 " + (value ? "text-[var(--color-accent-dark)]" : "text-[var(--color-muted)]")} />
          )}
          <span className="truncate flex-1">{current ? current.label : placeholder}</span>
          <ChevronDown className={"size-4 text-[var(--color-muted)] shrink-0 transition-transform " + (open ? "rotate-180" : "")} />
        </button>

        {open && (
          <Popover id={id}>
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className={optionCls(!value)}
            >
              <span className="size-4.5 shrink-0" />
              {placeholder}
            </button>
            {options.map((o) => {
              const active = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => { onChange(o.value); setOpen(false); }}
                  className={optionCls(active)}
                >
                  <span className="size-4.5 shrink-0 grid place-items-center">
                    {active && <Check className="size-3.5 text-[var(--color-accent-dark)]" strokeWidth={3} />}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </Popover>
        )}
      </div>
    </div>
  );
}

/**
 * Multi-select dropdown. Closed: shows count. Open: checkbox list.
 * Selections render as removable chips beneath the trigger.
 */
export function MultiSelect({
  label, required, optional, values, onChange, options, placeholder = "Odaberi", icon: Icon,
}: {
  label?: string; required?: boolean; optional?: boolean; values: string[]; onChange: (v: string[]) => void;
  options: Opt[]; placeholder?: string; icon?: LucideIcon;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const ref = useDismiss(open, () => setOpen(false));

  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  const labelFor = (v: string) => options.find((o) => o.value === v)?.label ?? v;

  return (
    <div ref={ref} className="block">
      {label && <Label required={required} optional={optional}>{label}</Label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className={
            fieldBase + " flex items-center gap-2.5 text-left cursor-pointer " +
            (values.length ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]")
          }
        >
          {Icon && (
            <Icon className={"size-4.5 shrink-0 " + (values.length ? "text-[var(--color-accent-dark)]" : "text-[var(--color-muted)]")} />
          )}
          <span className="truncate flex-1">
            {values.length === 0 ? placeholder : `${values.length} odabrano`}
          </span>
          {values.length > 0 && (
            <span className="grid place-items-center min-w-5 h-5 px-1 rounded-full bg-[var(--color-accent)] text-white text-[11px] font-semibold shrink-0">
              {values.length}
            </span>
          )}
          <ChevronDown className={"size-4 text-[var(--color-muted)] shrink-0 transition-transform " + (open ? "rotate-180" : "")} />
        </button>

        {open && (
          <Popover id={id}>
            {options.map((o) => {
              const active = values.includes(o.value);
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggle(o.value)}
                  className={optionCls(active)}
                >
                  <span
                    className={
                      "size-4.5 shrink-0 rounded-md border grid place-items-center transition-colors " +
                      (active
                        ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                        : "border-[var(--color-line)]")
                    }
                  >
                    {active && <Check className="size-3 text-white" strokeWidth={3} />}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </Popover>
        )}
      </div>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {values.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-[var(--color-ink)] text-white text-xs"
            >
              {labelFor(v)}
              <button
                type="button"
                onClick={() => toggle(v)}
                aria-label={`Ukloni ${labelFor(v)}`}
                className="grid place-items-center size-4 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="size-3" strokeWidth={2.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

/** Color picker: swatch + name, always visible. Selected = ring + check. */
const COLOR_HEX: Record<string, string> = {
  "Crna": "#16181d", "Bijela": "#f4f4f0", "Siva": "#8a8d93", "Srebrna": "#c4c8cd",
  "Plava": "#2563aa", "Crvena": "#c0392b", "Zelena": "#2e7d4f", "Smeđa": "#6b4423",
  "Žuta": "#e6c419", "Narančasta": "#e8742c", "Bež": "#d8c9a8",
};

export function ColorPicker({
  label, required, optional, values, onChange, options,
}: {
  label?: string; required?: boolean; optional?: boolean; values: string[]; onChange: (v: string[]) => void; options: string[];
}) {
  const toggle = (v: string) =>
    onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v]);
  return (
    <div>
      {label && <Label required={required} optional={optional}>{label}</Label>}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
        {options.map((o) => {
          const active = values.includes(o);
          const hex = COLOR_HEX[o] ?? "#999";
          const lightSwatch = ["Bijela", "Žuta", "Srebrna", "Bež"].includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              aria-pressed={active}
              className={
                "flex items-center gap-2.5 px-2.5 h-11 rounded-xl border text-sm text-left transition-all " +
                (active
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/8 font-medium"
                  : "border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")
              }
            >
              <span
                className="size-6 rounded-lg shrink-0 grid place-items-center border border-black/10"
                style={{ backgroundColor: hex }}
              >
                {active && (
                  <Check
                    className={"size-3.5 " + (lightSwatch ? "text-black" : "text-white")}
                    strokeWidth={3}
                  />
                )}
              </span>
              <span className="truncate text-[var(--color-ink)]">{o}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Range as two compact selects (od / do) sharing a row. */
export function RangeSelect({
  label, required, optional, unit, minValue, maxValue, onMin, onMax, steps, fmt,
}: {
  label: string; required?: boolean; optional?: boolean; unit?: string;
  minValue: string; maxValue: string;
  onMin: (v: string) => void; onMax: (v: string) => void;
  steps: number[]; fmt?: (n: number) => string;
}) {
  const render = (n: number) => (fmt ? fmt(n) : n.toLocaleString("hr-HR")) + (unit ? ` ${unit}` : "");
  return (
    <div>
      <Label required={required} optional={optional}>{label}</Label>
      <div className="grid grid-cols-2 gap-2">
        <SelectField value={minValue} onChange={onMin} placeholder="Od" options={steps.map((s) => ({ value: String(s), label: render(s) }))} />
        <SelectField value={maxValue} onChange={onMax} placeholder="Do" options={steps.map((s) => ({ value: String(s), label: render(s) }))} />
      </div>
    </div>
  );
}

/** Numeric range as two inputs (for attr ranges without fixed steps). */
export function RangeInput({
  label, required, optional, unit, value, onSet,
}: {
  label: string; required?: boolean; optional?: boolean; unit?: string; value: string | undefined; onSet: (v: string | undefined) => void;
}) {
  const raw = value ?? "";
  const [minS, maxS] = raw.includes("..") ? raw.split("..") : ["", ""];
  return (
    <div>
      <Label required={required} optional={optional}>{label}{unit ? ` (${unit})` : ""}</Label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number" defaultValue={minS} placeholder="Od"
          onBlur={(e) => { const v = e.target.value; if (!v && !maxS) onSet(undefined); else onSet(`${v}..${maxS}`); }}
          className={fieldBase}
        />
        <input
          type="number" defaultValue={maxS} placeholder="Do"
          onBlur={(e) => { const v = e.target.value; if (!v && !minS) onSet(undefined); else onSet(`${minS}..${v}`); }}
          className={fieldBase}
        />
      </div>
    </div>
  );
}

/** On/off toggle pill (e.g. Garancija, Prikaži bez cijene). */
export function TogglePill({
  on, onClick, label,
}: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={
        "h-12 px-4 rounded-xl border text-sm font-medium flex items-center justify-between gap-2 transition-colors " +
        (on
          ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
          : "bg-[var(--color-surface)] text-[var(--color-ink-soft)] border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")
      }
    >
      <span>{label}</span>
      <span className={"size-2.5 rounded-full shrink-0 " + (on ? "bg-[var(--color-accent)]" : "bg-[var(--color-line)]")} />
    </button>
  );
}

export function TextField({
  label, required, optional, value, onChange, placeholder,
}: { label?: string; required?: boolean; optional?: boolean; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block">
      {label && <Label required={required} optional={optional}>{label}</Label>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="text"
        placeholder={placeholder}
        className={fieldBase}
      />
    </label>
  );
}

/** Izbornik glavnih kategorija (kućice s ikonom) — dinamička zamjena polja ispod. */
const CAT_ICON: Record<string, LucideIcon> = {
  car: Car, bike: Bike, truck: Truck, excavator: Tractor, camper: Caravan, brakedisc: Disc3,
};
export function CategoryTabs({
  categories, value, onChange,
}: {
  categories: { slug: string; name: string; icon: string }[];
  value: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
      {categories.map((c) => {
        const Icon = CAT_ICON[c.icon] ?? Car;
        const active = c.slug === value;
        return (
          <button
            key={c.slug}
            type="button"
            onClick={() => onChange(c.slug)}
            aria-pressed={active}
            className={
              "flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl border text-center transition-all " +
              (active
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/8 text-[var(--color-ink)] font-medium"
                : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]")
            }
          >
            <Icon className={"size-5 " + (active ? "text-[var(--color-accent-dark)]" : "text-[var(--color-muted)]")} />
            <span className="text-[11px] leading-tight">{c.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Velike kartice glavnih kategorija (objava — korak "Što prodaješ?").
 * Responsive: 2 stupca mobitel → 3 tablet → 6 desktop. Veća ikona + naziv.
 */
export function CategoryCards({
  categories, value, onChange,
}: {
  categories: { slug: string; name: string; icon: string }[];
  value: string;
  onChange: (slug: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
      {categories.map((c) => {
        const Icon = CAT_ICON[c.icon] ?? Car;
        const active = c.slug === value;
        return (
          <button
            key={c.slug}
            type="button"
            onClick={() => onChange(c.slug)}
            aria-pressed={active}
            className={
              "group flex flex-col items-center justify-center gap-2.5 sm:gap-3 py-5 sm:py-7 px-2 rounded-2xl border-2 text-center transition-all " +
              (active
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/8 shadow-sm"
                : "border-[var(--color-line)] hover:border-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/20")
            }
          >
            <span
              className={
                "grid place-items-center size-12 sm:size-14 rounded-2xl transition-colors " +
                (active ? "bg-[var(--color-accent)]/15 text-[var(--color-accent-dark)]" : "bg-[var(--color-line)]/40 text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]")
              }
            >
              <Icon className="size-6 sm:size-7" />
            </span>
            <span className={"text-sm font-medium leading-tight " + (active ? "text-[var(--color-ink)]" : "text-[var(--color-ink-soft)]")}>
              {c.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Podkategorije kao odabir gumbi (pill chips) — jedan odabir. */
export function SubcategoryButtons({
  options, value, onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (slug: string) => void;
}) {
  // Wrap u 1-2 reda (bez horizontalnog scrolla); kompaktni pillovi da sve stane,
  // i na mobitelu sve vidljivo bez scrollanja.
  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(active ? "" : o.value)}
            aria-pressed={active}
            className={
              "h-9 px-3 rounded-full border text-[13px] font-medium whitespace-nowrap transition-all " +
              (active
                ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-ink)]"
                : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]")
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
