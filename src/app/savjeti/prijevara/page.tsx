import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Kako prepoznati prijevaru",
  description: "Znakovi upozorenja i pravila za sigurnu kupnju vozila bez prijevare.",
};

export default function Page() {
  return (
    <InfoPage
      title="Kako prepoznati prijevaru"
      backHref="/savjeti"
      backLabel="Savjeti"
      intro="Većina prodavača je poštena, ali oprez se isplati. Ovo su najčešći znakovi prijevare."
      sections={[
        { title: "1. Cijena predobra da bi bila istinita", body: "Vozilo znatno ispod tržišne cijene je prvi znak upozorenja. Prevaranti mame niskom cijenom da izvuku kaparu ili osobne podatke." },
        { title: "2. Prodavač izbjegava pregled uživo", body: "Ako netko traži plaćanje ili kaparu prije nego što vidiš vozilo, ili tvrdi da je „u inozemstvu“ pa nudi dostavu preko posrednika — prekini kontakt." },
        { title: "3. Pritisak i žurba", body: "„Imam još kupaca, moraš odlučiti odmah“ klasična je taktika pritiska. Poštena prodaja podnosi razuman rok za provjeru i razmišljanje." },
        { title: "4. Neslaganje dokumentacije", body: "Broj šasije na vozilu mora odgovarati prometnoj i knjižici. Nejasno porijeklo, strani papiri bez prijevoda ili „privremena“ registracija su rizik." },
        { title: "5. Sigurno plaćanje", body: "Plati tek nakon pregleda i uz potpisan ugovor. Izbjegavaj isključivo gotovinske transakcije bez potvrde. Nikad ne šalji novac unaprijed nepoznatoj osobi." },
        { title: "6. Prijavi sumnjiv oglas", body: "Ako naiđeš na sumnjiv oglas na Vozila.hr, prijavi ga gumbom „Prijavi oglas“ na stranici oglasa. Provjeravamo svaku prijavu." },
      ]}
    />
  );
}
