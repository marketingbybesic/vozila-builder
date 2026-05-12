import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Uvjeti korištenja",
  description: "Uvjeti korištenja platforme Auti.hr.",
};

const SECTIONS = [
  {
    title: "1. Opće odredbe",
    body:
      "Auti.hr (dalje: Platforma) je internetska usluga koja omogućava objavu oglasa za kupnju i prodaju motornih vozila. Korištenjem Platforme prihvaćaš ove Uvjete u cijelosti. Ako se ne slažeš s njima, nemoj koristiti Platformu.",
  },
  {
    title: "2. Registracija i korisnički račun",
    body:
      "Za objavu oglasa potrebno je otvoriti korisnički račun. Korisnik je dužan unijeti istinite podatke. Korisnik je odgovoran za sigurnost svoje lozinke. Auti.hr zadržava pravo ukinuti račun u slučaju zloupotrebe.",
  },
  {
    title: "3. Objava oglasa",
    body:
      "Prodavač jamči da su podaci u oglasu istiniti i potpuni. Zabranjena je objava: ukradenih vozila, vozila s nejasnim porijeklom, vozila bez valjane dokumentacije, oglasa s namjernim obmanjivanjem kupca. Auti.hr zadržava pravo ukloniti oglas bez prethodne najave.",
  },
  {
    title: "4. Naplata usluga",
    body:
      "Prvi oglas za privatne korisnike je besplatan. Naknade za dodatne oglase, isticanje i premium pozicije objavljene su u Cjeniku. Cijene su izražene u EUR s uključenim PDV-om.",
  },
  {
    title: "5. Odgovornost",
    body:
      "Auti.hr je posrednik. Ugovor o kupoprodaji sklapa se između prodavača i kupca. Auti.hr nije odgovoran za točnost podataka u oglasima, za stanje vozila, niti za bilo kakvu štetu nastalu kupoprodajom. Preporučujemo fizički pregled vozila i provjeru dokumentacije prije plaćanja.",
  },
  {
    title: "6. Zaštita osobnih podataka",
    body:
      "Obrađujemo osobne podatke u skladu s GDPR-om i Zakonom o provedbi Opće uredbe o zaštiti podataka. Detalji u Politici privatnosti.",
  },
  {
    title: "7. Intelektualno vlasništvo",
    body:
      "Sav sadržaj Platforme (logotipi, dizajn, baza podataka, kod) vlasništvo je Auti.hr. Zabranjeno je kopiranje, skidanje (scraping), redistribucija ili komercijalna upotreba bez pisanog odobrenja.",
  },
  {
    title: "8. Završne odredbe",
    body:
      "Ovi Uvjeti mogu se izmijeniti u bilo kojem trenutku. Promjene stupaju na snagu objavom na Platformi. Za sporove je nadležan sud u Zagrebu, prema hrvatskom pravu.",
  },
];

export default function UvjetiPage() {
  return (
    <Container className="py-16 md:py-24">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl tracking-tight">Uvjeti korištenja</h1>
        <p className="mt-3 text-sm text-[var(--color-muted)]">Posljednje izmjene: svibanj 2026.</p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-xl">{s.title}</h2>
              <p className="mt-2 text-[var(--color-ink-soft)] leading-relaxed">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
