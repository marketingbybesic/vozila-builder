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
      { href: "/kolacici", label: "Kolačići" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-[var(--color-line)] bg-[var(--color-ink)] text-white/85 mt-24">
      <Container className="py-16">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link href="/" className="inline-flex items-baseline">
              <span className="font-display text-2xl font-semibold text-white">auti</span>
              <span className="font-display text-2xl font-semibold text-[var(--color-accent)]">
                .hr
              </span>
            </Link>
            <p className="mt-4 text-sm text-white/60 leading-relaxed">
              Hrvatsko tržište automobila. Od privatnih prodavača do ovlaštenih trgovaca — sve na jednom mjestu.
            </p>
          </div>

          {FOOTER_NAV.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs uppercase tracking-widest font-semibold text-white/50 mb-4">
                {col.heading}
              </h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-white/80 hover:text-[var(--color-accent)] transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 pt-8 border-t border-white/10 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between text-xs text-white/50">
          <p>© {new Date().getFullYear()} Auti.hr. Sva prava pridržana.</p>
          <p>Napravljeno u Hrvatskoj · Plaćanje u EUR</p>
        </div>
      </Container>
    </footer>
  );
}
