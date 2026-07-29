import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { BadgeEuro, Camera, FileText, ShieldAlert, Car } from "lucide-react";

export const metadata: Metadata = {
  title: "Savjeti za kupce i prodavače",
  description: "Vodiči za sigurnu kupnju i prodaju vozila: procjena cijene, fotografije, dokumentacija, test vožnja, prepoznavanje prijevare.",
};

const GUIDES = [
  { href: "/savjeti/cijena", icon: BadgeEuro, title: "Procjena cijene", desc: "Kako odrediti realnu tržišnu cijenu vozila." },
  { href: "/savjeti/fotografije", icon: Camera, title: "Savjeti za fotografije", desc: "Kako slikati vozilo da se oglas ističe." },
  { href: "/savjeti/dokumentacija", icon: FileText, title: "Dokumentacija", desc: "Koji papiri su potrebni pri kupoprodaji." },
  { href: "/savjeti/test-vozila", icon: Car, title: "Test vožnja", desc: "Na što paziti pri pregledu i probnoj vožnji." },
  { href: "/savjeti/prijevara", icon: ShieldAlert, title: "Kako prepoznati prijevaru", desc: "Znakovi upozorenja i sigurna kupnja." },
];

export default function SavjetiPage() {
  return (
    <>
      <section className="bg-[var(--color-surface)] border-b border-[var(--color-line)]">
        <Container className="py-10 md:py-14">
          <nav className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--color-ink)]">Početna</Link>
            <span>›</span>
            <span className="text-[var(--color-ink-soft)]">Savjeti</span>
          </nav>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">Savjeti za kupce i prodavače</h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)] leading-relaxed">
            Praktični vodiči koji ti pomažu kupiti ili prodati vozilo sigurno, brzo i po poštenoj cijeni.
          </p>
        </Container>
      </section>

      <Container className="py-10 md:py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDES.map((g) => {
            const Icon = g.icon;
            return (
              <Link
                key={g.href}
                href={g.href}
                className="rounded-[var(--radius-md)] shadow-[var(--shadow-flat)] bg-[var(--color-surface)] p-5 hover:border-[var(--color-accent)] hover:shadow-md transition-all group"
              >
                <div className="size-10 rounded-xl bg-[var(--color-accent)]/12 text-[var(--color-accent-dark)] grid place-items-center mb-3">
                  <Icon className="size-5" />
                </div>
                <div className="font-medium text-[var(--color-ink)] group-hover:text-[var(--color-accent-dark)]">
                  {g.title}
                </div>
                <p className="mt-1 text-sm text-[var(--color-ink-soft)] leading-relaxed">{g.desc}</p>
              </Link>
            );
          })}
        </div>
      </Container>
    </>
  );
}
