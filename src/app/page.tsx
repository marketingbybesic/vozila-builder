import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/hero-search";
import { CategoryNav } from "@/components/category-nav";
import { DealerShowcase, DealerShowcaseMobile } from "@/components/dealer-showcase";
import { BrandLogo } from "@/components/brand-logo";
import { NewListingsFeed } from "@/components/new-listings-feed";
import { MAKES, POPULAR_MAKE_SLUGS } from "@/data/makes";
import { db } from "@/db";
import { ShieldCheck, Zap, Users } from "lucide-react";
import type { Listing } from "@/lib/types";

export default async function HomePage() {
  const popularMakes = POPULAR_MAKE_SLUGS.map(
    (slug) => MAKES.find((m) => m.slug === slug)!
  );
  let latest: Listing[] = [];
  try {
    const result = await db().listListings({ sort: "newest", page: 1 });
    latest = result.items.slice(0, 12);
  } catch (err) {
    console.warn("[home] listListings failed:", err);
  }

  return (
    <>
      {/* HERO: search left + dealers right on desktop, stacked on mobile */}
      <section className="relative overflow-hidden bg-[var(--color-ink)] text-white">
        <Container className="relative py-5 md:py-8">
          <div className="text-center mb-4 md:mb-5">
            <h1 className="font-display text-2xl md:text-3xl">
              Pronađi svoje vozilo
            </h1>
            <p className="mt-1 text-sm text-white/60">
              Pretraži 12.847 oglasa — auti, motori, gospodarska, mehanizacija, kamperi i dijelovi
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_1fr] gap-5 items-stretch">
            <HeroSearch />
            <div className="hidden lg:flex flex-col">
              <DealerShowcase />
            </div>
          </div>

          {/* Mobile: categories first, then dealers */}
          <div className="lg:hidden mt-5">
            <p className="text-sm text-white/50 mb-3 text-center">
              Pregled ostalih kategorija
            </p>
            <CategoryNav />
          </div>

          <div className="lg:hidden mt-4">
            <DealerShowcaseMobile />
          </div>

          {/* Desktop: categories below both panels */}
          <div className="hidden lg:block mt-5 text-center">
            <p className="text-sm text-white/50 mb-3">
              Pregled ostalih kategorija
            </p>
            <CategoryNav />
          </div>
        </Container>
      </section>

      {/* BRAND LOGOS */}
      <section className="border-b border-[var(--color-line)] bg-[var(--color-surface)]">
        <Container className="py-8 md:py-10">
          <div className="flex items-end justify-between mb-4 md:mb-6">
            <div>
              <h2 className="font-display text-xl md:text-3xl">Popularne marke</h2>
              <p className="text-xs md:text-sm text-[var(--color-muted)] mt-0.5">
                Najtraženije marke u Hrvatskoj
              </p>
            </div>
            <Link
              href="/marke"
              className="text-xs md:text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-accent-dark)]"
            >
              Sve marke &rarr;
            </Link>
          </div>
          {/* Mobile: horizontal scroll. Desktop: 5-col grid */}
          <div className="md:hidden overflow-x-auto scrollbar-thin -mx-4 px-4">
            <div className="flex gap-2.5" style={{ width: `${popularMakes.length * 90}px` }}>
              {popularMakes.map((make) => (
                <Link
                  key={make.slug}
                  href={`/oglasi?make=${make.slug}`}
                  className="w-[82px] shrink-0 group flex flex-col items-center justify-center gap-1.5 py-3 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg)] hover:border-[var(--color-ink)] transition-all"
                >
                  <BrandLogo slug={make.slug} className="size-10" />
                  <span className="text-[10px] font-medium text-[var(--color-ink)]">{make.name}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden md:grid grid-cols-5 gap-4">
            {popularMakes.map((make) => (
              <Link
                key={make.slug}
                href={`/oglasi?make=${make.slug}`}
                className="group flex flex-col items-center justify-center gap-3 py-5 rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-bg)] hover:border-[var(--color-ink)] hover:shadow-[var(--shadow-card)] transition-all"
              >
                <BrandLogo slug={make.slug} className="size-20" />
                <span className="text-sm font-medium text-[var(--color-ink)] group-hover:text-[var(--color-accent-dark)]">
                  {make.name}
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* NEW LISTINGS — animated feed */}
      {latest.length > 0 && (
        <section className="py-8 md:py-16">
          <Container>
            <div className="flex items-end justify-between mb-4 md:mb-6">
              <div>
                <h2 className="font-display text-xl md:text-3xl">Novi oglasi</h2>
                <p className="text-xs md:text-sm text-[var(--color-muted)] mt-0.5">
                  Najnoviji oglasi dodani na platformu
                </p>
              </div>
              <Link
                href="/oglasi?sort=newest"
                className="text-sm font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-accent-dark)]"
              >
                Svi oglasi &rarr;
              </Link>
            </div>
            <NewListingsFeed listings={latest} />
          </Container>
        </section>
      )}

      {/* VALUE PROPS */}
      <section className="py-6 md:py-16 bg-[var(--color-surface)] border-y border-[var(--color-line)]">
        <Container>
          <div className="grid grid-cols-3 gap-3 md:gap-8">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="size-10 md:size-12 rounded-[var(--radius-md)] bg-[var(--color-accent)]/15 text-[var(--color-accent-dark)] flex items-center justify-center mb-2 md:mb-5">
                <ShieldCheck className="size-5 md:size-6" />
              </div>
              <h3 className="font-display text-sm md:text-xl mb-1 md:mb-2">Provjereni prodavači</h3>
              <p className="text-[11px] md:text-sm text-[var(--color-ink-soft)] leading-relaxed hidden md:block">
                Svaki ovlašteni trgovac prolazi verifikaciju. Privatne oglase pratimo sustavom procjene rizika.
              </p>
            </div>
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="size-10 md:size-12 rounded-[var(--radius-md)] bg-[var(--color-accent)]/15 text-[var(--color-accent-dark)] flex items-center justify-center mb-2 md:mb-5">
                <Zap className="size-5 md:size-6" />
              </div>
              <h3 className="font-display text-sm md:text-xl mb-1 md:mb-2">Pametna pretraga</h3>
              <p className="text-[11px] md:text-sm text-[var(--color-ink-soft)] leading-relaxed hidden md:block">
                Spremi pretragu, dobivaj obavijesti čim se pojavi auto koji odgovara.
              </p>
            </div>
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="size-10 md:size-12 rounded-[var(--radius-md)] bg-[var(--color-accent)]/15 text-[var(--color-accent-dark)] flex items-center justify-center mb-2 md:mb-5">
                <Users className="size-5 md:size-6" />
              </div>
              <h3 className="font-display text-sm md:text-xl mb-1 md:mb-2">Direktan kontakt</h3>
              <p className="text-[11px] md:text-sm text-[var(--color-ink-soft)] leading-relaxed hidden md:block">
                Razgovaraj s prodavačem u poruci, bez dijeljenja broja telefona.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <section className="bg-[var(--color-ink)] text-white">
        <Container className="py-10 md:py-16">
          <div className="text-center md:text-left md:grid md:grid-cols-[1.2fr_auto] md:gap-12 md:items-center">
            <div>
              <h2 className="font-display text-3xl md:text-5xl">
                Prodajete vozilo?
              </h2>
              <p className="mt-2 md:mt-4 text-sm md:text-base text-white/70 max-w-lg mx-auto md:mx-0 leading-relaxed">
                Objavite oglas besplatno u 3 koraka. Platforma je besplatna &mdash; platite samo ako želite istaknuti oglas.
              </p>
              <div className="mt-5 md:mt-8 flex justify-center md:justify-start gap-8 md:gap-10">
                <div>
                  <div className="font-display text-2xl md:text-3xl text-[var(--color-accent)]">1.</div>
                  <div className="text-xs md:text-sm font-bold mt-0.5">Slikajte</div>
                </div>
                <div>
                  <div className="font-display text-2xl md:text-3xl text-[var(--color-accent)]">2.</div>
                  <div className="text-xs md:text-sm font-bold mt-0.5">Objavite</div>
                </div>
                <div>
                  <div className="font-display text-2xl md:text-3xl text-[var(--color-accent)]">3.</div>
                  <div className="text-xs md:text-sm font-bold mt-0.5">Prodajte</div>
                </div>
              </div>
            </div>
            <div className="mt-6 md:mt-0 flex flex-col items-stretch md:items-end gap-2">
              <Button asChild variant="accent" size="lg" className="w-full md:w-auto">
                <Link href="/objavi">Objavi oglas besplatno</Link>
              </Button>
              <span className="text-[11px] text-white/40 text-center md:text-right">Bez pretplate &middot; Bez skrivenih troškova</span>
            </div>
          </div>
        </Container>
      </section>

      {/* POPULARNA PRETRAGA — pill links */}
      <section className="py-8 md:py-14 bg-[var(--color-surface)] border-y border-[var(--color-line)]">
        <Container>
          <h2 className="font-display text-xl md:text-3xl mb-4 md:mb-6">Popularna pretraga</h2>
          <div className="flex flex-wrap gap-1.5 md:gap-2">
            {[
              { label: "SUV do 20.000 €", href: "/oglasi?bodyType=SUV&priceMax=20000" },
              { label: "Limuzine do 15.000 €", href: "/oglasi?bodyType=Limuzina&priceMax=15000" },
              { label: "Električna vozila", href: "/oglasi?fuel=Električni" },
              { label: "Automatski mjenjač", href: "/oglasi?transmission=Automatski" },
              { label: "Hibridna vozila", href: "/oglasi?fuel=Hibrid" },
              { label: "Karavani", href: "/oglasi?bodyType=Karavan" },
              { label: "Do 10.000 €", href: "/oglasi?priceMax=10000" },
              { label: "Do 5.000 €", href: "/oglasi?priceMax=5000" },
              { label: "Novija od 2020.", href: "/oglasi?yearMin=2020" },
              { label: "Do 100.000 km", href: "/oglasi?kmMax=100000" },
              { label: "4x4 pogon", href: "/oglasi?a.drive4x4=1" },
              { label: "Dizel do 25.000 €", href: "/oglasi?fuel=Dizel&priceMax=25000" },
            ].map((s) => (
              <Link
                key={s.label}
                href={s.href}
                className="px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-[var(--color-line)] bg-[var(--color-bg)] text-xs md:text-sm text-[var(--color-ink-soft)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)] hover:shadow-sm transition-all"
              >
                {s.label}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* GRADOVI */}
      <section className="py-8 md:py-14">
        <Container>
          <h2 className="font-display text-xl md:text-3xl mb-4 md:mb-6">Vozila po gradovima</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-x-4 gap-y-1.5">
            {[
              "Zagreb", "Split", "Rijeka", "Osijek", "Zadar",
              "Pula", "Karlovac", "Varaždin", "Šibenik", "Dubrovnik",
              "Sisak", "Bjelovar", "Vinkovci", "Čakovec", "Koprivnica",
            ].map((city) => (
              <Link
                key={city}
                href={`/oglasi?county=${encodeURIComponent(city)}`}
                className="text-xs md:text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-accent-dark)] py-0.5 transition-colors"
              >
                {city}
              </Link>
            ))}
          </div>
          <Link
            href="/gradovi"
            className="inline-block mt-3 text-xs md:text-sm font-medium text-[var(--color-accent-dark)] hover:underline"
          >
            Svi gradovi &rarr;
          </Link>
        </Container>
      </section>
    </>
  );
}
