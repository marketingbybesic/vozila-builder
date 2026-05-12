import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Registracija",
  description: "Otvori besplatan Auti.hr račun i objavi svoj prvi oglas u 2 minute.",
};

export default function RegistracijaPage() {
  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Otvori račun</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Već imaš račun?{" "}
          <Link href="/prijava" className="text-[var(--color-accent-dark)] font-medium hover:underline">
            Prijavi se
          </Link>
        </p>

        <form className="mt-8 space-y-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-6">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="firstName" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
                Ime
              </label>
              <Input id="firstName" placeholder="Ivan" className="mt-1.5" required />
            </div>
            <div>
              <label htmlFor="lastName" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
                Prezime
              </label>
              <Input id="lastName" placeholder="Horvat" className="mt-1.5" required />
            </div>
          </div>
          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
              E-mail
            </label>
            <Input id="email" type="email" placeholder="ime@primjer.hr" className="mt-1.5" required />
          </div>
          <div>
            <label htmlFor="phone" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
              Telefon
            </label>
            <Input id="phone" type="tel" placeholder="+385 91 234 5678" className="mt-1.5" required />
          </div>
          <div>
            <label htmlFor="password" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
              Lozinka
            </label>
            <Input id="password" type="password" placeholder="Minimalno 8 znakova" className="mt-1.5" required minLength={8} />
          </div>

          <label className="flex items-start gap-2 text-xs text-[var(--color-ink-soft)] leading-relaxed">
            <input type="checkbox" className="mt-0.5 size-4 rounded border-[var(--color-line)]" required />
            <span>
              Slažem se s{" "}
              <Link href="/uvjeti" className="text-[var(--color-accent-dark)] underline hover:no-underline">Uvjetima korištenja</Link>{" "}
              i{" "}
              <Link href="/privatnost" className="text-[var(--color-accent-dark)] underline hover:no-underline">Politikom privatnosti</Link>.
            </span>
          </label>

          <Button variant="accent" size="lg" className="w-full">
            Otvori račun
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Otvaranje računa je besplatno. Prvi oglas je besplatan.
        </p>
      </div>
    </Container>
  );
}
