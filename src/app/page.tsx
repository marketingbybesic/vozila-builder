import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MAKES, POPULAR_MAKE_SLUGS } from "@/data/makes";
import { Search, ShieldCheck, Zap, Users } from "lucide-react";

export default function HomePage() {
  const popularMakes = POPULAR_MAKE_SLUGS.map(
    (slug) => MAKES.find((m) => m.slug === slug)!
  );

  return (
    <>
      <section className="relative overflow-hidden bg-[var(--color-ink)] text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.18] mix-blend-screen"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 80% 0%, #F59E0B 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 0% 100%, #3B82F6 0%, transparent 60%)",
          }}
        />
        <Container className="relative py-20 md:py-32">
          <div className="max-w-2xl">
            <Badge variant="accent" className="mb-6">
              <Zap className="size-3" /> 12.847 aktivnih oglasa
            </Badge>
            <h1 className="font-display text-5xl md:text-7xl font-medium leading-[0.95] tracking-[-0.025em]">
              Tvoj sljedeći auto.
              <br />
              <span className="text-[var(--color-accent)] italic">Bez zamki.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-white/75 max-w-xl leading-relaxed">
              Najveće hrvatsko tržište rabljenih i novih automobila. Pretraži po
              modelu, godini, ili pronađi posebnu ponudu u svom gradu.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Button asChild variant="accent" size="lg" className="text-base">
                <Link href="/oglasi">
                  <Search className="size-4" />
                  Pretraži oglase
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white/30 text-white hover:bg-white/10 hover:text-white hover:border-white"
              >
                <Link href="/objavi">Objavi svoj oglas</Link>
              </Button>
            </div>

            <div className="mt-12 grid grid-cols-3 gap-6 max-w-md">
              <div>
                <div className="font-display text-3xl text-white">12k+</div>
                <div className="text-xs text-white/60 mt-1">Aktivnih oglasa</div>
              </div>
              <div>
                <div className="font-display text-3xl text-white">340+</div>
                <div className="text-xs text-white/60 mt-1">Trgovaca</div>
              </div>
              <div>
                <div className="font-display text-3xl text-white">21</div>
                <div className="text-xs text-white/60 mt-1">Županija</div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <Container className="py-12">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-3xl tracking-tight">Popularne marke</h2>
              <p className="text-sm text-[var(--color-muted)] mt-1">
                Najtraženije marke u Hrvatskoj ove godine
              </p>
            </div>
            <Link
              href="/oglasi"
              className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-accent-dark)]"
            >
              Sve marke →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
            {popularMakes.map((make) => (
              <Link
                key={make.slug}
                href={`/oglasi?make=${make.slug}`}
                className="group flex flex-col items-center justify-center aspect-square rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg)] hover:border-[var(--color-ink)] hover:shadow-[var(--shadow-card)] transition-all"
              >
                <span className="font-display text-lg font-medium text-[var(--color-ink)] group-hover:text-[var(--color-accent-dark)]">
                  {make.name}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-muted)] mt-1">
                  {make.country}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-20">
        <Container>
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="size-12 rounded-[var(--radius-md)] bg-[var(--color-accent)]/15 text-[var(--color-accent-dark)] flex items-center justify-center mb-5">
                <ShieldCheck className="size-6" />
              </div>
              <h3 className="font-display text-xl mb-2">Provjereni prodavači</h3>
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                Svaki ovlašteni trgovac prolazi verifikaciju. Privatne oglase
                pratimo sustavom procjene rizika u realnom vremenu.
              </p>
            </div>
            <div>
              <div className="size-12 rounded-[var(--radius-md)] bg-[var(--color-accent)]/15 text-[var(--color-accent-dark)] flex items-center justify-center mb-5">
                <Zap className="size-6" />
              </div>
              <h3 className="font-display text-xl mb-2">Pametna pretraga</h3>
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                Spremi pretragu, dobivaj obavijesti čim se pojavi auto koji
                odgovara — bez stalnog osvježavanja.
              </p>
            </div>
            <div>
              <div className="size-12 rounded-[var(--radius-md)] bg-[var(--color-accent)]/15 text-[var(--color-accent-dark)] flex items-center justify-center mb-5">
                <Users className="size-6" />
              </div>
              <h3 className="font-display text-xl mb-2">Direktan kontakt</h3>
              <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed">
                Razgovaraj s prodavačem u našoj poruci, bez dijeljenja broja
                telefona dok ne odlučiš.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <section className="bg-[var(--color-ink)] text-white">
        <Container className="py-16 flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div>
            <h2 className="font-display text-3xl md:text-4xl tracking-tight">
              Prodajete auto?
            </h2>
            <p className="mt-2 text-white/70 max-w-md">
              Objava traje 2 minute. Prvi oglas je besplatan, ostali od 4,90 €.
            </p>
          </div>
          <Button asChild variant="accent" size="lg">
            <Link href="/objavi">Objavi oglas</Link>
          </Button>
        </Container>
      </section>
    </>
  );
}
