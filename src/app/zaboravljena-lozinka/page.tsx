import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { getCurrentUser } from "@/lib/session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

export const metadata: Metadata = {
  title: "Zaboravljena lozinka",
  description: "Zatraži poveznicu za promjenu lozinke na svom Vozila.hr računu.",
};

/**
 * Karlo 28.07: /zaboravljena-lozinka je vraćao 404 iako `sign-in-form`
 * linka na njega. Slanje e-pošte još nije spojeno, pa stranica to POŠTENO
 * kaže umjesto da lažira "poslali smo ti mail".
 */
export default async function ZaboravljenaLozinkaPage() {
  const user = await getCurrentUser();
  if (user) redirect("/moj-racun");

  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">
          Zaboravljena lozinka
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Upiši e-adresu računa i poslat ćemo ti poveznicu za promjenu lozinke.
        </p>

        <div className="mt-6 flex gap-2.5 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3.5">
          <Info className="size-4 shrink-0 mt-0.5 text-[var(--color-accent-dark)]" />
          <p className="text-xs leading-relaxed text-[var(--color-ink-soft)]">
            Platforma je u demo načinu — slanje e-pošte još nije aktivno. Za pomoć
            oko računa javi se na{" "}
            <Link href="/kontakt" className="text-[var(--color-accent-dark)] font-medium hover:underline">
              kontakt stranici
            </Link>
            .
          </p>
        </div>

        <form className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]"
            >
              E-adresa
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="ime@primjer.hr"
              className="mt-1.5"
              autoComplete="email"
              disabled
            />
          </div>
          <Button type="submit" variant="primary" size="lg" className="w-full" disabled>
            Pošalji poveznicu
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[var(--color-muted)]">
          Sjetio si se lozinke?{" "}
          <Link
            href="/prijava"
            className="text-[var(--color-accent-dark)] font-medium hover:underline"
          >
            Prijavi se
          </Link>
        </p>
      </div>
    </Container>
  );
}
