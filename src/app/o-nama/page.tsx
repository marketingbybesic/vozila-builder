import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "O nama",
  description: "Auti.hr je hrvatsko tržište automobila. Naša misija je transparentna kupnja i prodaja vozila bez prijevara i nepotrebnih posrednika.",
};

export default function ONamaPage() {
  return (
    <>
      <section className="bg-[var(--color-ink)] text-white">
        <Container className="py-20 md:py-28">
          <h1 className="font-display text-4xl md:text-6xl tracking-tight leading-[0.95] max-w-3xl">
            Tržište bez{" "}
            <span className="text-[var(--color-accent)] italic">trikova</span>.
          </h1>
          <p className="mt-6 text-lg text-white/75 max-w-2xl leading-relaxed">
            Auti.hr smo pokrenuli jer je hrvatsko tržište rabljenih vozila bilo previše neuredno. Previše prevaranata, previše posrednika, premalo transparentnosti. Mi gradimo drukčije.
          </p>
        </Container>
      </section>

      <Container className="py-16 md:py-24 max-w-3xl">
        <div className="prose prose-lg max-w-none">
          <h2 className="font-display text-3xl mt-0">Misija</h2>
          <p className="text-[var(--color-ink-soft)] leading-relaxed">
            Pomoći ljudima u Hrvatskoj da kupe ili prodaju automobil bez stresa. Svaki oglas mora imati istinite podatke. Svaki prodavač mora biti pristupačan. Svaki kupac mora znati što kupuje.
          </p>

          <h2 className="font-display text-3xl mt-12">Što radimo drukčije</h2>
          <ul className="space-y-3 text-[var(--color-ink-soft)] mt-4">
            <li className="flex gap-3">
              <span className="text-[var(--color-accent-dark)] font-bold mt-0.5">→</span>
              <span><strong className="text-[var(--color-ink)]">VIN provjera</strong> u suradnji s HAK servisom. Svako vozilo ima vidljivu povijest registracija.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-accent-dark)] font-bold mt-0.5">→</span>
              <span><strong className="text-[var(--color-ink)]">Verificirani trgovci</strong>. Svaki ovlašteni trgovac prolazi provjeru OIB-a i poslovnih dozvola.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-accent-dark)] font-bold mt-0.5">→</span>
              <span><strong className="text-[var(--color-ink)]">Sustav procjene rizika</strong> za privatne oglase. Sumnjivi obrasci se automatski označavaju.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-accent-dark)] font-bold mt-0.5">→</span>
              <span><strong className="text-[var(--color-ink)]">Direktna komunikacija</strong>. Razgovaraš s prodavačem kroz našu poruku - bez dijeljenja broja telefona dok ne odlučiš.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-[var(--color-accent-dark)] font-bold mt-0.5">→</span>
              <span><strong className="text-[var(--color-ink)]">Bez skrivenih troškova</strong>. Prvi oglas je besplatan. Premium pozicije su transparentne.</span>
            </li>
          </ul>

          <h2 className="font-display text-3xl mt-12">Tim</h2>
          <p className="text-[var(--color-ink-soft)] leading-relaxed">
            Mala ekipa s velikim ciljem. Inženjeri, dizajneri i ljudi koji su prošli stotinu prijevara prije nego što su odlučili sagraditi nešto bolje. Sjedište u Zagrebu, ali pokrivamo svih 21 hrvatsku županiju.
          </p>

          <h2 className="font-display text-3xl mt-12">Kontakt</h2>
          <p className="text-[var(--color-ink-soft)] leading-relaxed">
            Pitanja, prijedlozi, prijave prijevara — javi se. Svaka poruka stigne do osobe, ne do robota.
          </p>
          <Button asChild variant="primary" size="lg" className="mt-4">
            <Link href="/kontakt">Kontaktiraj nas</Link>
          </Button>
        </div>
      </Container>
    </>
  );
}
