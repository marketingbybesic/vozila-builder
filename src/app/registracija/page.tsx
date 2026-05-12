import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SignUpForm } from "@/components/sign-up-form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Registracija",
  description: "Otvori besplatan Auti.hr račun i objavi svoj prvi oglas u 2 minute.",
};

export default async function RegistracijaPage() {
  const user = await getCurrentUser();
  if (user) redirect("/moj-racun");

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

        <SignUpForm />

        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Otvaranje računa je besplatno. Prvi oglas je besplatan.
        </p>
      </div>
    </Container>
  );
}
