import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { MapPin } from "lucide-react";
import { COUNTIES } from "@/data/locations";

export const metadata: Metadata = {
  title: "Vozila po gradovima i županijama",
  description: "Pregledaj oglase vozila po hrvatskim gradovima i županijama.",
};

export default function GradoviPage() {
  return (
    <>
      <section className="bg-[var(--color-surface)] border-b border-[var(--color-line)]">
        <Container className="py-10 md:py-14">
          <nav className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--color-ink)]">Početna</Link>
            <span>›</span>
            <span className="text-[var(--color-ink-soft)]">Gradovi</span>
          </nav>
          <h1 className="font-display text-3xl md:text-4xl tracking-tight">Vozila po županijama</h1>
          <p className="mt-3 max-w-2xl text-[var(--color-ink-soft)] leading-relaxed">
            Odaberi županiju i pregledaj sve dostupne oglase u tvojoj regiji.
          </p>
        </Container>
      </section>

      <Container className="py-10 md:py-14">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {COUNTIES.map((county) => (
            <Link
              key={county}
              href={`/oglasi?county=${encodeURIComponent(county)}`}
              className="flex items-center gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-4 h-12 text-sm text-[var(--color-ink-soft)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] transition-all"
            >
              <MapPin className="size-4 text-[var(--color-accent-dark)] shrink-0" />
              <span className="truncate">{county}</span>
            </Link>
          ))}
        </div>
      </Container>
    </>
  );
}
