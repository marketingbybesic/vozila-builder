import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/ui/container";
import { NaprednoForm } from "@/components/napredno-form";

export const metadata: Metadata = {
  title: "Napredna pretraga",
  description:
    "Detaljna pretraga vozila po svakom kriteriju — kategorija, podkategorija, marka, model, godina, cijena, oprema, povijest, lokacija.",
};

export default function NaprednoPage() {
  return (
    <Container className="py-10 max-w-4xl">
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Napredna pretraga</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Posloži kriterij točno kako želiš — pretraga vraća točan broj rezultata na sljedećem koraku.
        </p>
      </header>
      <Suspense fallback={<div className="text-sm text-[var(--color-muted)]">Učitavanje pretrage…</div>}>
        <NaprednoForm />
      </Suspense>
    </Container>
  );
}
