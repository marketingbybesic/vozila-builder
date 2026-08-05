"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { CircleParking, MessageSquare, User, Plus, Search, Menu, X, ChevronDown } from "lucide-react";
import { CategoryNav } from "@/components/category-nav";
import { ChevronRight } from "lucide-react";
import { CATEGORIES, subcategoryHref, subChildHref, hasChildren } from "@/data/categories";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [openSub, setOpenSub] = useState<string | null>(null);

  const closeMenu = () => {
    setOpen(false);
    setOpenCat(null);
    setOpenSub(null);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg)]/65">
      <Container className="flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group shrink-0" aria-label="Vozila.hr početna">
          {/* ⚠️ Slogan (Dino 04.08.2026) stoji ISPOD logotipa → `flex-col`.
              Vidljiv i na mobilnom (Dino, 2. runda). Zaglavlje je visoko 64 px,
              pa `leading-none` na oba retka drži cjelinu unutar te visine.
              Na mobilnom je razmak između slova manji (`tracking-[0.14em]`) da
              slogan ne bude širi od logotipa iznad njega. */}
          <div className="relative flex flex-col">
            <div className="leading-none">
              <span className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
                vozila
              </span>
              <span className="font-display text-2xl font-semibold tracking-tight text-[var(--color-accent-dark)]">
                .hr
              </span>
            </div>
            <span className="mt-0.5 text-[8px] sm:text-[9px] uppercase tracking-[0.14em] sm:tracking-[0.2em] text-[var(--color-muted)] leading-none whitespace-nowrap">
              Kupi, prodaj i vozi
            </span>
          </div>
        </Link>


        {/* ⚠️ Karlo / Dino 04.08.2026: tražilica MAKNUTA iz zaglavlja.
            Naslovnica ionako ima veliku "Brzu pretragu" odmah ispod, a na
            stranici rezultata postoji bočni filter — traka u zaglavlju je
            bila treći ulaz u istu radnju.
            Komponenta `header-search.tsx` OSTAJE u projektu (nije obrisana)
            za slučaj povratka. */}

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/oglasi/napredno"
            className="hidden sm:flex h-10 items-center justify-center gap-1.5 rounded-md px-2.5 text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40 hover:text-[var(--color-ink)] transition-colors"
            aria-label="Napredna pretraga"
            title="Napredna pretraga"
          >
            {/* Povećalo VRAĆENO 04.08.2026: maknuto je bilo zato što se
                ponavljalo s ikonom u traci tražilice — a ta je traka sad izbačena
                iz zaglavlja, pa dupliranja više nema.
                (31.07. je ovdje bila ikona klizača; zamijenjena je povećalom jer
                link vodi na PRETRAGU, ne na postavke.) */}
            <Search className="size-4" />
            {/* Karlo 04.08.: gore "Napredna pretraga", dolje (u Brzoj pretrazi)
                samo "Napredno auto" — gornji ulaz vodi na SVE kategorije. */}
            <span className="text-xs font-medium whitespace-nowrap">Napredna pretraga</span>
          </Link>
          <Link
            href="/moj-racun/spremljeno"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40"
            aria-label="Moj parking"
          >
            <CircleParking className="size-4" />
          </Link>
          <Link
            href="/moj-racun/poruke"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40"
            aria-label="Poruke"
          >
            <MessageSquare className="size-4" />
          </Link>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            {/* Dino 31.07: "Prijava" → "Moj račun". Link i dalje vodi na /prijava —
                proxy.ts ionako preusmjeri neprijavljenog korisnika s /moj-racun
                natrag na prijavu, pa je ovako jedan korak manje. */}
            <Link href="/prijava">
              <User className="size-4" />
              Moj račun
            </Link>
          </Button>
          <Button asChild variant="accent" size="sm">
            <Link href="/objavi">
              <Plus className="size-4" />
              Objavi oglas
            </Link>
          </Button>

          {/* Hamburger — mobile only */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden h-10 w-10 flex items-center justify-center rounded-md text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40"
            aria-label="Izbornik"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {/* ⚠️ Karlo 04.08.2026 (stavka 14): traka kategorija PRESELJENA iz heroja
          u sticky zaglavlje — "puno je lakše surfat s tom opcijom nego se stalno
          vraćat na home" (uzor: avto.net).
          Sad je dostupna sa SVAKE stranice i prati scroll.
          Uža je nego u heroju (`py-1.5`, manji font) da ne jede ekran. */}
      {/* ⚠️ Karlo 04.08.2026 (2. runda): traka je TAMNOPLAVA s bijelim rubom —
          ista boja kao hero/podnožje, pa se navigacija jasno odvaja od bijelog
          zaglavlja iznad. */}
      <div className="hidden lg:block bg-[var(--color-ink)] border-y border-white/15">
        <Container className="py-1.5">
          <CategoryNav variant="bar" compact />
        </Container>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--color-line)] bg-[var(--color-bg)] animate-slide-up max-h-[80vh] overflow-y-auto">
          <Container className="py-4 flex flex-col gap-1">
            {/* 6 main categories — each expands its subcategories */}
            {CATEGORIES.map((cat) => {
              const isOpen = openCat === cat.slug;
              return (
                <div key={cat.slug}>
                  <button
                    type="button"
                    onClick={() => setOpenCat(isOpen ? null : cat.slug)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
                  >
                    {cat.name}
                    <ChevronDown
                      className={`size-4 text-[var(--color-ink-soft)] transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                  {isOpen && (
                    <div className="pl-3 pb-1 flex flex-col">
                      {cat.subcategories.map((sub) => {
                        const subOpen = openSub === `${cat.slug}:${sub.slug}`;
                        if (hasChildren(sub)) {
                          return (
                            <div key={sub.slug}>
                              <button
                                type="button"
                                onClick={() =>
                                  setOpenSub(subOpen ? null : `${cat.slug}:${sub.slug}`)
                                }
                                aria-expanded={subOpen}
                                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
                              >
                                {sub.name}
                                <ChevronRight
                                  className={`size-3.5 text-[var(--color-ink-soft)] transition-transform ${subOpen ? "rotate-90" : ""}`}
                                />
                              </button>
                              {subOpen && (
                                <div className="pl-3 flex flex-col border-l border-[var(--color-line)] ml-3">
                                  <Link
                                    href={subcategoryHref(cat.slug, sub.slug)}
                                    onClick={closeMenu}
                                    className="px-3 py-1.5 rounded-md text-[13px] font-medium text-[var(--color-accent-dark)] hover:bg-[var(--color-line)]/40"
                                  >
                                    Sve: {sub.name}
                                  </Link>
                                  {sub.children!.map((child) => (
                                    <Link
                                      key={child.slug}
                                      href={subChildHref(cat.slug, sub.slug, child.slug)}
                                      onClick={closeMenu}
                                      className="px-3 py-1.5 rounded-md text-[13px] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
                                    >
                                      {child.name}
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return (
                          <Link
                            key={sub.slug}
                            /* Karlo 31.07: "Osobni auto" je sad prava podkategorija —
                               vodi na svoje rezultate kao i sve ostale, ne na
                               praznu naprednu pretragu bez podkategorije. */
                            href={subcategoryHref(cat.slug, sub.slug)}
                            onClick={closeMenu}
                            className="px-3 py-2 rounded-md text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
                          >
                            {sub.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ⚠️ Karlo 04.08.2026: "na mobilnoj opciji nema napredne pretrage".
                U zaglavlju je skrivena ispod `sm` (nema mjesta uz logo i gumb),
                pa jedini mobilni ulaz ide ovdje — odmah ispod kategorija, prije
                crte koja odvaja blok računa. Naglašena je accent bojom jer je
                radnja, ne postavka računa. */}
            <hr className="border-[var(--color-line)] my-2" />

            <Link
              href="/oglasi/napredno"
              onClick={closeMenu}
              className="px-3 py-2.5 rounded-md text-sm font-medium text-[var(--color-accent-dark)] hover:bg-[var(--color-line)]/40 inline-flex items-center gap-2"
            >
              <Search className="size-4" />
              Napredna pretraga
            </Link>

            <hr className="border-[var(--color-line)] my-2" />

            {/* Account block — unchanged */}
            <Link
              href="/prijava"
              onClick={closeMenu}
              className="px-3 py-2.5 rounded-md text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
            >
              Moj račun
            </Link>
            <Link
              href="/moj-racun/spremljeno"
              onClick={closeMenu}
              className="px-3 py-2.5 rounded-md text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
            >
              Moj parking
            </Link>
            <Link
              href="/moj-racun/poruke"
              onClick={closeMenu}
              className="px-3 py-2.5 rounded-md text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
            >
              Poruke
            </Link>
          </Container>
        </div>
      )}
    </header>
  );
}
