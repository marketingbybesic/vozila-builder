"use client";

/**
 * Napredna pretraga — reusable form controls.
 * One coherent system (no chips-wall): every multi filter is a dropdown that
 * opens a checkbox list; selections render as removable chips below the field.
 */

import { Fragment, useEffect, useId, useRef, useState } from "react";
import {
  Check, ChevronDown, X, Car, Caravan, Truck, Bus, Container, Forklift,
  Tractor, Bike, Box, Disc3, type LucideIcon,
} from "lucide-react";
import { AUTO_BODY_ICON } from "./body-icons";

/** ⚠️ Karlo 12.08.2026: `header` je neobavezno zaglavlje grupe (npr.
 *  "Najpopularnije marke" / "Sve marke"). Renderira se kao nekliktabilna
 *  natuknica iznad opcije. Bez njega se sve ponaša kao i prije. */
export type Opt = { value: string; label: string; header?: string };

/** Ikona može biti lucide ili naša SVG silueta — obje primaju `className`. */
type IconComp = React.ComponentType<{ className?: string }>;

/**
 * Ikona po obliku karoserije (radi za sve kategorije: auto/gospodarska/...).
 * AUTO tipovi (Limuzina/SUV/Coupe/...) sad koriste PRAVE bočne siluete iz
 * body-icons.tsx. Vehicle-type ikone (Truck/Bus/Caravan/Forklift) ostaju lucide.
 */
const BODY_ICON: Record<string, IconComp> = {
  // auto — prave siluete
  ...AUTO_BODY_ICON,
  // gospodarska — lucide vehicle ikone (točne)
  Furgon: Truck, Kombi: Truck, Kamionet: Truck, "Šasija s kabinom": Truck,
  "Šasija s nadgradnjom": Container, "Pick up": Truck,
  Autobusi: Bus, Kamioni: Truck, "Dostavna vozila": Truck, "Teretne prikolice": Container,
  // generičke
  Kamper: Caravan, "Mobilne kućice": Caravan, Viličari: Forklift, Traktor: Tractor,
  Motocikl: Bike, Skuter: Bike,
};
function bodyIcon(label: string): IconComp {
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
          // Auto siluete su 2:1 (viewBox 48×24) → treba h-4 w-8; lucide 1:1 → size-4.
          const isSilhouette = o.label in AUTO_BODY_ICON;
          const iconCls =
            (isSilhouette ? "h-4 w-8 " : "size-4 ") +
            "shrink-0 " +
            (active ? "text-[var(--color-accent-dark)]" : "text-[var(--color-muted)]");
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
              <Icon className={iconCls} />
              <span className="min-w-0 leading-tight">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Osnova svih polja filtera.
 *
 * Prije: `rounded-xl` (22px) + puni okvir → svako polje je bilo zaobljena kapsula,
 * a dvanaest kapsula u nizu čita se kao generički obrazac, ne kao alat u magazinu.
 * Sada: plosnata površina (`radius-md`), bez vidljivog ruba u mirnom stanju —
 * polje se od podloge odvaja vrlo tihom sjenom, a okvir se POJAVLJUJE na
 * hover/fokus, gdje i nosi informaciju. Visina i padding su nepromijenjeni
 * (raspored se ne smije mijenjati).
 */
const fieldBase =
  "w-full h-12 px-3.5 rounded-[var(--radius-md)] border border-transparent " +
  "bg-[var(--color-surface)] shadow-[var(--shadow-flat)] text-sm " +
  "text-[var(--color-ink)] transition-all hover:border-[var(--color-line)] " +
  "focus:outline-none focus:border-[var(--color-accent)] " +
  "focus:ring-2 focus:ring-[var(--color-accent)]/20";

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

/* ⚠️ JEDINA iznimka od "bez okvira": lebdeći popover je bijel na svijetloj podlozi,
   pa mu okvir daje definiciju — bez njega "pluta" bez granice. Okvir ostaje, ali
   uz jaču sjenu i manji radius da se uklopi u ostatak sustava. */
const panelWrapCls =
  "absolute z-30 mt-2 w-full rounded-[var(--radius-md)] border border-[var(--color-line)] " +
  "bg-[var(--color-surface)] shadow-[0_12px_32px_rgb(10_22_40/14%)] overflow-hidden";
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
          {/* ⚠️ Karlo 11.08.2026: bez `min-w-0` je `truncate` bio mrtvo slovo —
              flex dijete ima zadano `min-width:auto` pa se span držao pune
              širine teksta (mjereno 144 px) i gurao sortiranje van ekrana. */}
          <span className="truncate flex-1 min-w-0">{current ? current.label : placeholder}</span>
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
            {options.map((o, i) => {
              const active = o.value === value;
              return (
                // ⚠️ ključ mora nositi i indeks: ista marka se namjerno pojavi
                // dvaput (popularne + abecedno), pa bi `key={o.value}` dao duple.
                <Fragment key={`${o.value}-${i}`}>
                  {o.header && (
                    <div className="px-3 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">
                      {o.header}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => { onChange(o.value); setOpen(false); }}
                    className={optionCls(active)}
                  >
                    <span className="size-4.5 shrink-0 grid place-items-center">
                      {active && <Check className="size-3.5 text-[var(--color-accent-dark)]" strokeWidth={3} />}
                    </span>
                    {o.label}
                  </button>
                </Fragment>
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
                  {/* Karlo st. 16 (05.08.2026): neodabrani kvadratić je imao samo
                      border-line rub — na bijelom popoveru nevidljiv, "ne vidi se
                      gdje birati". Sad svijetlo narančast; odabrano NEDIRANO.
                      ⚠️ Boja ruba kroz `style`: Tailwind v4 je i `border-[var]/45`
                      i `border-[color:var]/45` TIHO ispustio (klasa na elementu,
                      pravilo bez učinka) — inline style je jedino što pouzdano
                      prolazi. bg-...
                      /15 kroz klasu RADI (izmjereno na produkciji). */}
                  <span
                    className={
                      "size-4.5 shrink-0 rounded-md border grid place-items-center transition-colors " +
                      (active
                        ? "bg-[var(--color-accent)] border-[var(--color-accent)]"
                        : "bg-[var(--color-accent)]/15")
                    }
                    style={active ? undefined : { borderColor: "color-mix(in oklab, var(--color-accent) 45%, transparent)" }}
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
  label, required, optional, unit, minValue, maxValue, onMin, onMax, steps, fmt, maxOnly,
}: {
  label: string; required?: boolean; optional?: boolean; unit?: string;
  minValue: string; maxValue: string;
  onMin: (v: string) => void; onMax: (v: string) => void;
  steps: number[]; fmt?: (n: number) => string;
  /** Prikaži SAMO gornju granicu ("do max"), bez Od polja — npr. NDM prikolice. */
  maxOnly?: boolean;
}) {
  const render = (n: number) => (fmt ? fmt(n) : n.toLocaleString("hr-HR")) + (unit ? ` ${unit}` : "");
  const opts = steps.map((s) => ({ value: String(s), label: render(s) }));
  return (
    <div>
      <Label required={required} optional={optional}>{label}</Label>
      {maxOnly ? (
        <SelectField value={maxValue} onChange={onMax} placeholder="do max" options={opts} />
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <SelectField value={minValue} onChange={onMin} placeholder="Od" options={opts} />
          <SelectField value={maxValue} onChange={onMax} placeholder="Do" options={opts} />
        </div>
      )}
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
      {/* Karlo st. 16 (05.08.2026): ugašeni kružić je bio bg-line — na bijeloj
          plohi nevidljiv, "ne vidi se gdje birati". Sad svijetlo narančast s
          tankim rubom; upaljeno stanje NEDIRANO (puni accent). */}
      <span
        className={
          "size-2.5 rounded-full shrink-0 " +
          (on
            ? "bg-[var(--color-accent)]"
            : "bg-[var(--color-accent)]/30 ring-1 ring-inset ring-[var(--color-accent)]/50")
        }
      />
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

const MONTHS = [
  "Siječanj", "Veljača", "Ožujak", "Travanj", "Svibanj", "Lipanj",
  "Srpanj", "Kolovoz", "Rujan", "Listopad", "Studeni", "Prosinac",
];

/**
 * Mjesec (padajući 1-12) + godina (ručni unos) — Karlo 31.07 za
 * "Prva registracija" i "Tehnički vrijedi do".
 *
 * Dva prozorčića, ali JEDNA spremljena vrijednost "YYYY-MM" — inače bi prikaz
 * oglasa pokazivao odvojeno "7" i "2019" bez ikakvog značenja. Dok je upisan
 * samo jedan od dva podatka, vrijednost je `undefined` (ništa se ne sprema),
 * pa polupopunjeno polje ne može zaprljati bazu.
 */
export function MonthYearField({
  label, required, optional, value, onChange, minYear = 1950, maxYear = 2035,
}: {
  label?: string; required?: boolean; optional?: boolean;
  value: string; onChange: (v: string | undefined) => void;
  minYear?: number; maxYear?: number;
}) {
  /**
   * ⚠️ Draft state je OBAVEZAN, ne udobnost.
   *
   * Polje sprema JEDNU vrijednost "YYYY-MM", a prikazuje dva inputa. Da su oba
   * inputa čitala isključivo iz `value`, svaki nepotpun međukorak (upisana samo
   * godina, ili godina u tijeku tipkanja "2"→"20"→"201") spremio bi `undefined`
   * i time OBRISAO korisniku i drugi input. Zato se tipkano drži lokalno, a
   * `value` se dira samo kad je par potpun i valjan.
   */
  const parsed = (() => {
    const m = /^(\d{4})-(\d{1,2})$/.exec(value ?? "");
    return m ? { y: m[1], mo: String(Number(m[2])) } : { y: "", mo: "" };
  })();
  const [draft, setDraft] = useState<{ y: string; mo: string } | null>(null);
  // Vanjska vrijednost pobjeđuje dok korisnik nije počeo tipkati po ovom polju.
  const monthRaw = draft ? draft.mo : parsed.mo;
  const yearRaw = draft ? draft.y : parsed.y;

  const commit = (mo: string, y: string) => {
    setDraft({ mo, y });
    const yr = Number(y);
    const ok =
      Boolean(mo) && y.length === 4 && Number.isFinite(yr) && yr >= minYear && yr <= maxYear;
    onChange(ok ? `${yr}-${String(Number(mo)).padStart(2, "0")}` : undefined);
  };

  const yearInvalid =
    yearRaw.length === 4 && (Number(yearRaw) < minYear || Number(yearRaw) > maxYear);

  return (
    <div className="block">
      {label && <Label required={required} optional={optional}>{label}</Label>}
      <div className="grid grid-cols-2 gap-2">
        <select
          value={monthRaw}
          onChange={(e) => commit(e.target.value, yearRaw)}
          aria-label={`${label ?? ""} - mjesec`}
          className={fieldBase + " appearance-none cursor-pointer"}
        >
          <option value="">Mjesec</option>
          {MONTHS.map((name, i) => (
            <option key={name} value={String(i + 1)}>{`${i + 1}. ${name}`}</option>
          ))}
        </select>
        <input
          value={yearRaw}
          onChange={(e) => commit(monthRaw, e.target.value.replace(/\D/g, "").slice(0, 4))}
          type="text"
          inputMode="numeric"
          maxLength={4}
          placeholder="Godina"
          aria-label={`${label ?? ""} - godina`}
          aria-invalid={yearInvalid || undefined}
          className={
            fieldBase + (yearInvalid ? " border-[var(--color-danger)] hover:border-[var(--color-danger)]" : "")
          }
        />
      </div>
      {yearInvalid && (
        <span className="mt-1 block text-[11px] text-[var(--color-danger)]">
          Godina mora biti između {minYear}. i {maxYear}.
        </span>
      )}
    </div>
  );
}

/**
 * Brojčani unos (precizan ručni upis) — za km, kW, cm³, radne sate, težinu...
 * Sprema čisti broj (string bez razmaka); prikazuje grupirano (95.473) + sufiks jedinice.
 * Filteri ostaju raspon; ovo je samo za objavu (jedna točna vrijednost).
 */
export function NumberField({
  label, required, optional, value, onChange, unit, placeholder = "npr. 95000",
  decimals = 0,
}: {
  label?: string; required?: boolean; optional?: boolean;
  value: string; onChange: (v: string) => void;
  unit?: string; placeholder?: string;
  /**
   * Broj dopuštenih decimala (Dino 04.08.2026). Zadano 0 = samo cijeli brojevi,
   * kao dosad (km, kW, cm³).
   *
   * ⚠️ Potrošnja se izražava decimalno ("5,5 l/100km"), a ovo je polje brisalo
   * SVE osim znamenki (`replace(/[^\d]/g, "")`) → korisnik utipka "5,5" i
   * ostane mu "55". Zato ovaj prekidač, a ne `step` na inputu: polje je
   * `type="text"` s vlastitim parserom, pa `step` na njemu ne bi ništa značio.
   */
  decimals?: number;
}) {
  // Vrijednost se sprema s TOČKOM (5.5) jer je tako čita `Number()` i baza;
  // korisniku se prikazuje hrvatski, sa ZAREZOM.
  const grouped = value
    ? decimals > 0
      ? value.replace(".", ",")
      : Number(value).toLocaleString("hr-HR")
    : "";
  return (
    <label className="block">
      {label && <Label required={required} optional={optional}>{label}</Label>}
      <div className="relative">
        <input
          inputMode={decimals > 0 ? "decimal" : "numeric"}
          value={grouped}
          onChange={(e) => {
            if (decimals > 0) {
              // Zarez i točka su ravnopravni pri unosu; sprema se s točkom.
              let v = e.target.value.replace(",", ".").replace(/[^\d.]/g, "");
              const [cijeli, ...ost] = v.split(".");
              // Više točaka → prva vrijedi, ostale se odbacuju.
              v = ost.length ? `${cijeli}.${ost.join("").slice(0, decimals)}` : cijeli;
              onChange(v);
              return;
            }
            const digits = e.target.value.replace(/[^\d]/g, "");
            onChange(digits);
          }}
          type="text"
          placeholder={placeholder}
          className={fieldBase + (unit ? " pr-14" : "")}
        />
        {unit && (
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-[var(--color-muted)]">
            {unit}
          </span>
        )}
      </div>
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
