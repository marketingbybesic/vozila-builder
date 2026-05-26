import Link from "next/link";
import { Container } from "@/components/ui/container";

const FOOTER_NAV = [
  {
    heading: "Kupnja",
    links: [
      { href: "/oglasi", label: "Svi oglasi" },
      { href: "/oglasi?condition=Novo", label: "Novi automobili" },
      { href: "/oglasi?condition=Rabljeno", label: "Rabljeni automobili" },
      { href: "/oglasi?bodyType=SUV", label: "SUV vozila" },
      { href: "/oglasi?fuel=Elektri%C4%8Dni", label: "Električni" },
    ],
  },
  {
    heading: "Prodaja",
    links: [
      { href: "/objavi", label: "Objavi oglas" },
      { href: "/savjeti/cijena", label: "Procjena cijene" },
      { href: "/savjeti/fotografije", label: "Savjeti za fotografije" },
      { href: "/cjenik", label: "Cjenik oglasa" },
    ],
  },
  {
    heading: "Savjeti",
    links: [
      { href: "/savjeti", label: "Vodič za kupce" },
      { href: "/savjeti/test-vozila", label: "Test vožnja" },
      { href: "/savjeti/dokumentacija", label: "Dokumentacija" },
      { href: "/savjeti/prijevara", label: "Kako prepoznati prijevaru" },
    ],
  },
  {
    heading: "Tvrtka",
    links: [
      { href: "/o-nama", label: "O nama" },
      { href: "/kontakt", label: "Kontakt" },
      { href: "/uvjeti", label: "Uvjeti korištenja" },
      { href: "/privatnost", label: "Privatnost" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-ink)] text-white/85">
      <Container className="py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8 md:gap-6">
          {/* Logo + tagline */}
          <div className="md:w-48 shrink-0">
            <Link href="/" className="inline-flex items-baseline">
              <span className="font-display text-xl font-semibold text-white">vozila</span>
              <span className="font-display text-xl font-semibold text-[var(--color-accent)]">.hr</span>
            </Link>
            <p className="mt-2 text-xs text-white/50 leading-relaxed">
              Hrvatsko tržište vozila. Sve na jednom mjestu.
            </p>
          </div>

          {/* Nav columns */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            {FOOTER_NAV.map((col) => (
              <div key={col.heading}>
                <h3 className="text-[10px] uppercase tracking-widest font-semibold text-white/40 mb-2">
                  {col.heading}
                </h3>
                <ul className="space-y-1.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-xs text-white/70 hover:text-[var(--color-accent)] transition-colors"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between text-[10px] text-white/40">
          <p>&copy; {new Date().getFullYear()} Vozila.hr. Sva prava pridržana.</p>
          <p>Napravljeno u Hrvatskoj &middot; Plaćanje u EUR</p>
        </div>
      </Container>
    </footer>
  );
}
