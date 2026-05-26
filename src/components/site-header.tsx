"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, User, Plus, SlidersHorizontal, Menu, X } from "lucide-react";
import { HeaderSearch } from "@/components/header-search";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg)]/65">
      <Container className="flex h-16 items-center gap-4">
        <Link href="/" className="flex items-center gap-2 group shrink-0" aria-label="Vozila.hr početna">
          <div className="relative">
            <span className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              vozila
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight text-[var(--color-accent-dark)]">
              .hr
            </span>
          </div>
        </Link>

        <nav className="hidden xl:flex items-center gap-1 text-sm shrink-0">
          <Link
            href="/oglasi"
            className="px-3 py-2 rounded-md text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40 transition-colors"
          >
            Svi oglasi
          </Link>
          <Link
            href="/marke"
            className="px-3 py-2 rounded-md text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40 transition-colors"
          >
            Marke
          </Link>
          <Link
            href="/oglasi/najnoviji"
            className="px-3 py-2 rounded-md text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40 transition-colors"
          >
            Najnoviji
          </Link>
        </nav>

        <div className="hidden md:block flex-1 max-w-md mx-auto">
          <HeaderSearch />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/oglasi/napredno"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40"
            aria-label="Napredna pretraga"
            title="Napredna pretraga"
          >
            <SlidersHorizontal className="size-4" />
          </Link>
          <Link
            href="/moj-racun/spremljeno"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40"
            aria-label="Spremljeni oglasi"
          >
            <Heart className="size-4" />
          </Link>
          <Link
            href="/moj-racun/poruke"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40"
            aria-label="Poruke"
          >
            <MessageSquare className="size-4" />
          </Link>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/prijava">
              <User className="size-4" />
              Prijava
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

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-[var(--color-line)] bg-[var(--color-bg)] animate-slide-up">
          <Container className="py-4 flex flex-col gap-1">
            <Link
              href="/oglasi"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
            >
              Svi oglasi
            </Link>
            <Link
              href="/marke"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
            >
              Marke
            </Link>
            <Link
              href="/oglasi/najnoviji"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
            >
              Najnoviji
            </Link>
            <Link
              href="/oglasi/napredno"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
            >
              Napredna pretraga
            </Link>
            <hr className="border-[var(--color-line)] my-1" />
            <Link
              href="/prijava"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
            >
              Prijava
            </Link>
            <Link
              href="/moj-racun/spremljeno"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-md text-sm text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40"
            >
              Spremljeni oglasi
            </Link>
            <Link
              href="/moj-racun/poruke"
              onClick={() => setOpen(false)}
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
