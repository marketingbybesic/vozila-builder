import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Prijava",
  description: "Prijavi se na svoj Auti.hr račun i upravljaj oglasima.",
};

export default function PrijavaPage() {
  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Prijava</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Nemaš račun?{" "}
          <Link href="/registracija" className="text-[var(--color-accent-dark)] font-medium hover:underline">
            Registriraj se
          </Link>
        </p>

        <form className="mt-8 space-y-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-6">
          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
              E-mail
            </label>
            <Input id="email" type="email" placeholder="ime@primjer.hr" className="mt-1.5" required />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
                Lozinka
              </label>
              <Link href="/zaboravljena-lozinka" className="text-xs text-[var(--color-ink-soft)] hover:underline">
                Zaboravljena?
              </Link>
            </div>
            <Input id="password" type="password" placeholder="••••••••" className="mt-1.5" required />
          </div>

          <Button variant="primary" size="lg" className="w-full">
            Prijavi se
          </Button>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[var(--color-line)]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[var(--color-surface)] px-2 text-[var(--color-muted)]">ili nastavi sa</span>
            </div>
          </div>

          <Button variant="outline" size="lg" className="w-full">
            <svg viewBox="0 0 24 24" className="size-4" aria-hidden>
              <path fill="currentColor" d="M21.35 11.1H12v2.83h5.35c-.23 1.5-1.7 4.4-5.35 4.4-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.56-2.46C16.7 3.93 14.55 3 12 3 6.92 3 2.82 7.1 2.82 12.2S6.92 21.4 12 21.4c5.85 0 9.7-4.1 9.7-9.87 0-.66-.07-1.18-.18-1.7Z" />
            </svg>
            Nastavi s Googleom
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Prijavom prihvaćaš{" "}
          <Link href="/uvjeti" className="hover:text-[var(--color-ink)] underline">Uvjete korištenja</Link>{" "}
          i{" "}
          <Link href="/privatnost" className="hover:text-[var(--color-ink)] underline">Politiku privatnosti</Link>.
        </p>
      </div>
    </Container>
  );
}
