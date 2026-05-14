import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { MAKES } from "@/data/makes";
import { COUNTIES } from "@/data/locations";
import {
  FUEL_TYPES,
  TRANSMISSIONS,
  BODY_TYPES,
  DRIVES,
  COLORS,
  CONDITIONS,
  SELLER_TYPES,
} from "@/lib/types";

export const metadata: Metadata = {
  title: "Napredna pretraga",
  description:
    "Detaljna pretraga vozila po svakom kriteriju — marka, model, godina, cijena, kilometri, gorivo, mjenjač, karoserija, županija.",
};

const PRICE_STEPS = [500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000, 25000, 30000, 40000, 50000, 75000, 100000];
const KM_STEPS = [5000, 10000, 25000, 50000, 75000, 100000, 150000, 200000, 250000];
const YEAR_NOW = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => YEAR_NOW - i);

export default function NaprednoPage() {
  return (
    <Container className="py-10 max-w-4xl">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Napredna pretraga</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Posloži kriterij točno kako želiš — pretraga vraća točan broj rezultata na sljedećem koraku.
        </p>
      </header>

      <form action="/oglasi" method="get" className="space-y-8">
        <Section title="Osnovno">
          <Field label="Pojam">
            <input
              name="q"
              type="text"
              placeholder="npr. xenon, koža, automatik..."
              className="w-full h-11 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)]"
            />
          </Field>
          <Row>
            <Field label="Marka">
              <select name="make" className={selectCls}>
                <option value="">Sve marke</option>
                {MAKES.map((m) => (
                  <option key={m.slug} value={m.slug}>{m.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Model">
              <input
                name="model"
                type="text"
                placeholder="npr. Golf, A4, X3..."
                className="w-full h-11 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)]"
              />
            </Field>
          </Row>
        </Section>

        <Section title="Cijena (EUR)">
          <Row>
            <Field label="Od">
              <select name="priceMin" className={selectCls} defaultValue="">
                <option value="">Bez granice</option>
                {PRICE_STEPS.map((p) => <option key={p} value={p}>{p.toLocaleString("hr-HR")} €</option>)}
              </select>
            </Field>
            <Field label="Do">
              <select name="priceMax" className={selectCls} defaultValue="">
                <option value="">Bez granice</option>
                {PRICE_STEPS.map((p) => <option key={p} value={p}>{p.toLocaleString("hr-HR")} €</option>)}
              </select>
            </Field>
          </Row>
        </Section>

        <Section title="Godina i kilometri">
          <Row>
            <Field label="Godina od">
              <select name="yearMin" className={selectCls} defaultValue="">
                <option value="">Bez granice</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label="Godina do">
              <select name="yearMax" className={selectCls} defaultValue="">
                <option value="">Bez granice</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </Field>
            <Field label="Kilometri do">
              <select name="kmMax" className={selectCls} defaultValue="">
                <option value="">Bez granice</option>
                {KM_STEPS.map((k) => <option key={k} value={k}>{k.toLocaleString("hr-HR")} km</option>)}
              </select>
            </Field>
          </Row>
        </Section>

        <Section title="Karakteristike">
          <Field label="Gorivo">
            <CheckGroup name="fuel" options={FUEL_TYPES} />
          </Field>
          <Field label="Mjenjač">
            <CheckGroup name="transmission" options={TRANSMISSIONS} />
          </Field>
          <Field label="Karoserija">
            <CheckGroup name="bodyType" options={BODY_TYPES} />
          </Field>
          <Field label="Pogon">
            <CheckGroup name="drive" options={DRIVES} />
          </Field>
          <Field label="Boja">
            <CheckGroup name="color" options={COLORS} />
          </Field>
          <Field label="Stanje">
            <CheckGroup name="condition" options={CONDITIONS} />
          </Field>
        </Section>

        <Section title="Lokacija i prodavač">
          <Row>
            <Field label="Županija">
              <select name="county" className={selectCls} defaultValue="">
                <option value="">Sve županije</option>
                {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Tip prodavača">
              <CheckGroup name="sellerType" options={SELLER_TYPES} />
            </Field>
          </Row>
        </Section>

        <div className="flex gap-2 pt-2 sticky bottom-4 bg-[var(--color-bg)]/95 backdrop-blur p-3 rounded-md border border-[var(--color-line)] -mx-3 shadow-sm">
          <button
            type="submit"
            className="h-11 px-6 rounded-md bg-[var(--color-ink)] text-white text-sm font-medium hover:bg-[var(--color-ink-soft)]"
          >
            Prikaži rezultate
          </button>
          <button
            type="reset"
            className="h-11 px-5 rounded-md border border-[var(--color-line)] text-sm font-medium hover:bg-[var(--color-line)]/40"
          >
            Reset
          </button>
        </div>
      </form>
    </Container>
  );
}

const selectCls = "w-full h-11 px-3 rounded-md border border-[var(--color-line)] bg-[var(--color-bg)] text-sm";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-3">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="block mb-1.5 font-medium text-[var(--color-ink)]">{label}</span>
      {children}
    </label>
  );
}

function CheckGroup({ name, options }: { name: string; options: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <label key={o} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] text-xs cursor-pointer has-[:checked]:border-[var(--color-ink)] has-[:checked]:bg-[var(--color-ink)] has-[:checked]:text-white transition-colors">
          <input type="checkbox" name={name} value={o} className="sr-only" />
          {o}
        </label>
      ))}
    </div>
  );
}
