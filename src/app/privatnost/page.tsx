import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Politika privatnosti",
  description: "Kako Vozila.hr prikuplja, koristi i štiti tvoje osobne podatke (GDPR).",
};

export default function PrivatnostPage() {
  return (
    <InfoPage
      title="Politika privatnosti"
      intro="Vozila.hr poštuje tvoju privatnost i postupa u skladu s Općom uredbom o zaštiti podataka (GDPR) i hrvatskim propisima."
      sections={[
        {
          title: "1. Voditelj obrade",
          body: "Voditelj obrade osobnih podataka je Vozila.hr. Za sva pitanja o zaštiti podataka možeš nas kontaktirati putem kontakt stranice.",
        },
        {
          title: "2. Koje podatke prikupljamo",
          body: "Prikupljamo podatke koje sam unosiš: ime, e-mail, telefon i lokaciju pri registraciji i objavi oglasa. Automatski bilježimo tehničke podatke (IP adresa, tip preglednika, pregledane stranice) radi sigurnosti i statistike.",
        },
        {
          title: "3. Svrha obrade",
          body: "Podatke koristimo za: omogućavanje objave i pregleda oglasa, komunikaciju između kupca i prodavača, sprječavanje prijevara, poboljšanje usluge te slanje obavijesti na koje si pristao/la (npr. spremljene pretrage).",
        },
        {
          title: "4. Dijeljenje podataka",
          body: "Tvoje podatke ne prodajemo trećim stranama. Kontakt podaci u oglasu vidljivi su zainteresiranim kupcima. Podatke dijelimo samo s pružateljima usluga (hosting, plaćanja) i nadležnim tijelima kad to zahtijeva zakon.",
        },
        {
          title: "5. Kolačići",
          body: "Koristimo nužne kolačiće za funkcioniranje platforme te analitičke kolačiće uz tvoj pristanak. Postavke kolačića možeš promijeniti u pregledniku ili putem trake za pristanak.",
        },
        {
          title: "6. Tvoja prava",
          body: "Imaš pravo na pristup, ispravak, brisanje i prijenos svojih podataka te pravo na prigovor. Zahtjev možeš poslati putem kontakt stranice. Također imaš pravo podnijeti pritužbu Agenciji za zaštitu osobnih podataka (AZOP).",
        },
        {
          title: "7. Čuvanje podataka",
          body: "Podatke čuvamo dok imaš aktivan račun te razumno razdoblje nakon zatvaranja radi zakonskih obveza. Oglasi se arhiviraju nakon isteka ili prodaje.",
        },
      ]}
    />
  );
}
