import Link from "next/link";
import Image from "next/image";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { HeroSearch } from "@/components/hero-search";
import { CategoryNav } from "@/components/category-nav";
import { DealerShowcase, DealerShowcaseMobile } from "@/components/dealer-showcase";
import { BrandLogo } from "@/components/brand-logo";
import { NewListingsFeed } from "@/components/new-listings-feed";
import { HeroBanner } from "@/components/hero-banner";
import { MAKES, POPULAR_MAKE_SLUGS } from "@/data/makes";
import { db } from "@/db";
import { ShieldCheck, Zap, Users } from "lucide-react";
import type { Listing } from "@/lib/types";

/**
 * ⏸ REKLAMNI BANNER — PRIVREMENO ISKLJUČEN (Karlo, 29.07.2026)
 *
 * Banner "Gume −40%" je gotov i testiran, samo se za sada ne prikazuje.
 * Za aktivaciju: postavi na `true` i deployaj — ništa drugo ne treba.
 *
 * Što ostaje spremno u međuvremenu:
 *  - komponenta `src/components/hero-banner.tsx` (desktop 112px / mobitel 16:9)
 *  - 4 akcijska oglasa Guma Centra u bazi (Continental −40%, Bridgestone −34%,
 *    Goodyear −30%, Nokian −28%) — vidljivi na
 *    /oglasi?category=dijelovi&subcategory=gume
 */
const SHOW_HERO_BANNER = false;

export default async function HomePage() {
  const popularMakes = POPULAR_MAKE_SLUGS.map(
    (slug) => MAKES.find((m) => m.slug === slug)!
  );
  let latest: Listing[] = [];
  // Karlo 30.07: podnaslov je tvrdio "12.847 oglasa" kao literal — broj nije imao
  // veze s bazom. `listListings` već vraća `total`, samo se nije koristio.
  let totalListings = 0;
  try {
    const result = await db().listListings({ sort: "newest", page: 1 });
    latest = result.items.slice(0, 12);
    totalListings = result.total;
  } catch (err) {
    console.warn("[home] listListings failed:", err);
  }

  return (
    <>
      {/* HERO: search left + dealers right on desktop, stacked on mobile */}
      <section className="relative overflow-hidden bg-[var(--color-ink)] text-white">
        {/*
          Dino 31.07: hero je bio prazan tamni pravokutnik — najveći razlog zašto
          stranica nije "bacala na auto-moto svijet". Sada fotografija automobila
          iza tražilice, kao na svakom pravom auto portalu.

          ⚠️ Čitljivost je zaključana neovisno o slici: preko fotografije ide
          dvostruki sloj — okomiti gradijent (tamno gore/dolje) i vodoravni s
          lijeva. Bijeli tekst tako ostaje čitak i da fotografija bude svijetla.
          `priority` + `sizes` sprječavaju CLS i odgađanje LCP-a.
        */}
        <div className="absolute inset-0" aria-hidden="true">
          <Image
            src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2000&q=70&auto=format&fit=crop"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          {/*
            ⚠️ Prva verzija je imala `opacity-45` + dva puna gradijenta preko cijele
            plohe → izmjereni kontrast slike bio je 10 (praktički nevidljiva), pa je
            hero i dalje izgledao kao prazan pravokutnik. Sada slika ide punom
            jačinom, a čitljivost se štiti CILJANO:
              1) blagi opći veo (55%) da bijeli tekst nikad ne padne ispod praga
              2) jači gradijent SAMO uz donji/lijevi rub, gdje stoje paneli
            Fotografija ostaje vidljiva u gornjem desnom dijelu.
          */}
          <div className="absolute inset-0 bg-[var(--color-ink)]/55" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-ink)] via-[var(--color-ink)]/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-ink)]/85 via-transparent to-transparent" />
        </div>

        {/* Karlo 29.07: 40 px gore i dolje da se tamnoplava pozadina vidi
            iznad i ispod panela (prije 16/20 px — paneli su "sjedali" na rub).
            Dino 31.07: vertikalni ritam po Fibonaccijevu nizu (34/55 px) —
            hero dobiva najviše zraka jer je prvi dojam. */}
        <Container className="relative py-[34px] lg:py-[55px]">
          {/* Dino 31.07: naslov je bio text-2xl — premalen za hero s fotografijom.
              Sada φ-ljestvica (34 → 55 px, Fibonacci) i `drop-shadow` koji čuva
              čitljivost NAD SLIKOM bez zamračivanja cijele fotografije: mjereni
              kontrast je s vela-preko-svega pao na 2,6:1 (ispod WCAG 3:1). */}
          <div className="text-center mb-[21px] md:mb-[34px] [text-shadow:0_2px_18px_rgb(2_8_20/85%)]">
            <h1 className="font-display text-[34px] leading-none md:text-[55px]">
              Pronađi svoje vozilo
            </h1>
            <p className="mt-[13px] text-sm text-white/85">
              {totalListings > 0
                ? `Pretraži ${totalListings.toLocaleString("hr-HR")} oglasa`
                : "Pretraži oglase"}{" "}
              — auti, motori, gospodarska, mehanizacija, kamperi i dijelovi
            </p>
          </div>

          {/* ⚠️ Karlo 04.08.2026 (stavka 14): traka kategorija PRESELJENA u
              sticky zaglavlje (`site-header.tsx`) — prati scroll i dostupna je
              sa svake stranice, ne samo s naslovnice.
              Mobilna mreža (`<CategoryNav />` niže) ostaje netaknuta. */}

          {/* Karlo 29.07: bijeli panel širi, narančasti uži — hero mora stati
              u jedan ekran na desktopu.
              Karlo 29.07 (2): donji rubovi se nisu poklapali — žuti je završavao
              ~46 px iznad bijelog. Bijeli (HeroSearch) je viši i diktira visinu
              retka, pa `lg:items-stretch` razvlači SAMO žuti do iste linije.
              Na mobitelu ostaje `items-start` (paneli su jedan ispod drugog).
              ⚠️ Ne vraćati globalni `items-stretch` — 28.07 je razvukao bijeli
              panel i ostavio praznu rupu ispod polja. */}
          <div className="grid lg:grid-cols-[1.15fr_1fr] gap-4 items-start lg:items-stretch">
            <HeroSearch />
            <div className="hidden lg:flex flex-col">
              <DealerShowcase />
            </div>
          </div>

          {/* Mobile: categories first, then dealers.
              Karlo 02.08.: "neka poravna ovaj okvir da bude u liniji".
              Kartice kategorija bile su gola mreža bez podloge, a ploha
              "Premium trgovci" ispod ima `p-[13px]` + zlatni `ring` — pa se
              njihov sadržaj nije poklapao po lijevom/desnom rubu.
              Ista ploha i isti unutarnji razmak → oba bloka sad u liniji. */}
          <div className="lg:hidden mt-5 bg-[var(--color-ink)]/85 backdrop-blur-sm rounded-[var(--radius-lg)] p-[13px] md:p-[21px] shadow-[0_24px_64px_rgb(2_8_20/55%)] ring-1 ring-white/10">
            <p className="text-sm text-white/75 mb-3 text-center">
              Pregled ostalih kategorija
            </p>
            <CategoryNav />
          </div>

          {/* Reklamni banner — desktop ispod pretrage i trgovaca (pun raspon,
              nizak profil), mobitel na kraju sekcije.
              ⏸ Karlo 29.07: PRIVREMENO SAKRIVEN — aktivirat ćemo ga kasnije.
              Za uključivanje: SHOW_HERO_BANNER = true (gore u ovoj datoteci).
              Komponenta `hero-banner.tsx` i akcijski oglasi za gume ostaju
              netaknuti, banner se samo ne renderira. */}
          {SHOW_HERO_BANNER && (
            <div className="hidden lg:block mt-3">
              <HeroBanner />
            </div>
          )}

          <div className="lg:hidden mt-4">
            <DealerShowcaseMobile />
          </div>

          {SHOW_HERO_BANNER && (
            <div className="lg:hidden mt-4">
              <HeroBanner />
            </div>
          )}
        </Container>
      </section>

      {/* BRAND LOGOS */}
      {/* Kontrast bijelo-na-#FAFAF7 već razdvaja sekcije — okvir je bio suvišan. */}
      <section className="bg-[var(--color-surface)]">
        <Container className="py-[34px] md:py-[55px]">
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
          {/* Mobile: static 5-col grid = 2 rows of 10 makes, no horizontal scroll. */}
          <div className="md:hidden grid grid-cols-5 gap-2">
            {popularMakes.map((make) => (
              <Link
                key={make.slug}
                href={`/oglasi?make=${make.slug}`}
                className="group flex flex-col items-center justify-center gap-1 py-2.5 px-1 rounded-[var(--radius-md)] bg-[var(--color-bg)] hover:bg-[var(--color-line-soft)] transition-all"
              >
                <BrandLogo slug={make.slug} className="size-9" />
                <span className="text-[9px] leading-tight font-medium text-[var(--color-ink)] text-center truncate w-full">{make.name}</span>
              </Link>
            ))}
          </div>
          <div className="hidden md:grid grid-cols-5 gap-4">
            {popularMakes.map((make) => (
              <Link
                key={make.slug}
                href={`/oglasi?make=${make.slug}`}
                /* Dino 31.07: kartice marki bile su prazni sivi pravokutnici — logo je
                   plivao u praznini. Sada: suptilan gradijent (svjetlo pada odozgo),
                   logo se blago podiže i poveća na hover, naziv dobiva akcent.
                   Dimenzije i mreža 5×2 NEPROMIJENJENE. */
                className="group flex flex-col items-center justify-center gap-[13px] py-[21px] rounded-[var(--radius-md)] bg-gradient-to-b from-white to-[var(--color-bg)] shadow-[var(--shadow-flat)] hover:shadow-[var(--shadow-card)] hover:-translate-y-0.5 transition-all duration-200"
              >
                <BrandLogo slug={make.slug} className="size-20 transition-transform duration-200 group-hover:scale-110" />
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
        <section className="py-[34px] md:py-[89px]">
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
      <section className="py-[34px] md:py-[89px] bg-[var(--color-surface)]">
        <Container>
          <div className="grid grid-cols-3 gap-3 md:gap-8">
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="size-10 md:size-12 rounded-full bg-[var(--color-ink)] text-[var(--color-accent)] flex items-center justify-center mb-2 md:mb-5">
                <ShieldCheck className="size-4.5 md:size-5" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-sm md:text-xl mb-1 md:mb-2">Provjereni prodavači</h3>
              <p className="text-[11px] md:text-sm text-[var(--color-ink-soft)] leading-relaxed hidden md:block">
                Svaki ovlašteni trgovac prolazi verifikaciju. Privatne oglase pratimo sustavom procjene rizika.
              </p>
            </div>
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="size-10 md:size-12 rounded-full bg-[var(--color-ink)] text-[var(--color-accent)] flex items-center justify-center mb-2 md:mb-5">
                <Zap className="size-4.5 md:size-5" strokeWidth={1.5} />
              </div>
              <h3 className="font-display text-sm md:text-xl mb-1 md:mb-2">Pametna pretraga</h3>
              <p className="text-[11px] md:text-sm text-[var(--color-ink-soft)] leading-relaxed hidden md:block">
                Spremi pretragu, dobivaj obavijesti čim se pojavi auto koji odgovara.
              </p>
            </div>
            <div className="flex flex-col items-center text-center md:items-start md:text-left">
              <div className="size-10 md:size-12 rounded-full bg-[var(--color-ink)] text-[var(--color-accent)] flex items-center justify-center mb-2 md:mb-5">
                <Users className="size-4.5 md:size-5" strokeWidth={1.5} />
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
      {/* Dino 31.07: bio je gol tamni blok. Sad isti jezik kao hero — dijagonalni
          gradijent + suptilan zlatni sjaj u kutu, pa se čita kao dio istog sustava,
          a ne kao odsječen pravokutnik. Sadržaj i raspored nepromijenjeni. */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-ink)] via-[#0d1f3d] to-[var(--color-ink)] text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 size-[380px] rounded-full bg-[var(--color-accent)]/10 blur-3xl"
        />
        <Container className="relative py-[34px] md:py-[89px]">
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
              <span className="text-[11px] text-white/70 text-center md:text-right">Bez pretplate &middot; Bez skrivenih troškova</span>
            </div>
          </div>
        </Container>
      </section>

      {/* POPULARNA PRETRAGA — pill links */}
      <section className="py-[34px] md:py-[89px] bg-[var(--color-surface)]">
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
