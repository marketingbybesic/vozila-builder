import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Cjenik oglasa",
  description: "Cjenik objave i isticanja oglasa na Vozila.hr. Prvi oglas za privatne korisnike je besplatan.",
};

const PLANS = [
  {
    name: "Besplatno",
    price: "0 €",
    note: "za privatne korisnike",
    features: ["1 aktivan oglas", "Do 10 fotografija", "Osnovna vidljivost", "Poruke i kontakt"],
    cta: "Objavi besplatno",
    highlight: false,
  },
  {
    name: "Istaknuti oglas",
    price: "4,99 €",
    note: "po oglasu / 30 dana",
    features: ["Oznaka „Istaknuto“", "Viša pozicija u rezultatima", "Do 20 fotografija", "3× više pregleda u prosjeku"],
    cta: "Istakni oglas",
    highlight: true,
  },
  {
    name: "Trgovac",
    price: "od 39 €",
    note: "mjesečno",
    features: ["Neograničeno oglasa", "Profil trgovca", "Verificirana značka", "Uvoz inventara (CSV)", "Statistika i podrška"],
    cta: "Kontaktiraj nas",
    highlight: false,
  },
];

export default function CjenikPage() {
  return (
    <>
      <section className="bg-[var(--color-surface)] border-b border-[var(--color-line)]">
        <Container className="py-10 md:py-14">
          <nav className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--color-ink)]">Početna</Link>
            <span>›</span>
            <span className="text-[var(--color-ink-soft)]">Cjenik</span>
          </nav>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">Cjenik oglasa</h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)] leading-relaxed">
            Platforma je besplatna za osnovnu objavu. Plaćaš samo ako želiš dodatnu vidljivost.
            Sve cijene su u EUR s uključenim PDV-om.
          </p>
        </Container>
      </section>

      <Container className="py-10 md:py-14">
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={
                "rounded-[var(--radius-lg)] border p-6 flex flex-col " +
                (p.highlight
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/[0.06] shadow-lg"
                  : "border-[var(--color-line)] bg-[var(--color-surface)]")
              }
            >
              {p.highlight && (
                <span className="self-start mb-3 text-[10px] uppercase tracking-wider font-semibold text-[var(--color-accent-dark)] bg-[var(--color-accent)]/15 px-2 py-0.5 rounded-full">
                  Najpopularnije
                </span>
              )}
              <div className="font-display text-xl tracking-tight">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-display text-3xl text-[var(--color-ink)]">{p.price}</span>
                <span className="text-xs text-[var(--color-muted)]">{p.note}</span>
              </div>
              <ul className="mt-5 space-y-2.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-ink-soft)]">
                    <Check className="size-4 text-[var(--color-accent-dark)] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/objavi"
                className={
                  "mt-6 h-11 rounded-xl flex items-center justify-center text-sm font-semibold transition-colors " +
                  (p.highlight
                    ? "bg-[var(--color-accent)] text-[var(--color-ink)] hover:bg-[var(--color-accent-dark)] hover:text-white"
                    : "border border-[var(--color-line)] text-[var(--color-ink)] hover:bg-[var(--color-line)]/40")
                }
              >
                {p.cta}
              </Link>
            </div>
          ))}
        </div>
        <p className="mt-8 text-xs text-[var(--color-muted)] max-w-2xl">
          Cijene su informativne i mogu se mijenjati. Za ponudu za trgovce i uvoz inventara javi se na{" "}
          <Link href="/kontakt" className="underline hover:text-[var(--color-ink)]">kontakt stranicu</Link>.
        </p>
      </Container>
    </>
  );
}
