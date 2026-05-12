import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, User, Plus, Search } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--color-line)] bg-[var(--color-bg)]/85 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg)]/65">
      <Container className="flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-2 group" aria-label="Auti.hr početna">
          <div className="relative">
            <span className="font-display text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
              auti
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight text-[var(--color-accent-dark)]">
              .hr
            </span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link
            href="/oglasi"
            className="px-3 py-2 rounded-md text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40 transition-colors"
          >
            Svi oglasi
          </Link>
          <Link
            href="/oglasi?condition=Novo"
            className="px-3 py-2 rounded-md text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40 transition-colors"
          >
            Novi automobili
          </Link>
          <Link
            href="/oglasi?condition=Rabljeno"
            className="px-3 py-2 rounded-md text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40 transition-colors"
          >
            Rabljeni
          </Link>
          <Link
            href="/oglasi?fuel=Elektri%C4%8Dni"
            className="px-3 py-2 rounded-md text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-line)]/40 transition-colors"
          >
            Električni
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/oglasi"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-ink-soft)] hover:bg-[var(--color-line)]/40"
            aria-label="Pretraži"
          >
            <Search className="size-4" />
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
        </div>
      </Container>
    </header>
  );
}
