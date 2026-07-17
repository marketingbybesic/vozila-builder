import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Test vožnja i pregled vozila",
  description: "Na što paziti pri pregledu i probnoj vožnji rabljenog vozila.",
};

export default function Page() {
  return (
    <InfoPage
      title="Test vožnja"
      backHref="/savjeti"
      backLabel="Savjeti"
      intro="Probna vožnja otkriva ono što fotografije ne mogu. Evo na što obratiti pozornost."
      sections={[
        { title: "1. Hladan motor pri dolasku", body: "Traži da vozilo bude hladno kad dođeš. Topao motor može skrivati poteškoće s paljenjem. Prati dim iz ispuha pri pokretanju." },
        { title: "2. Provjeri karoseriju i lak", body: "Gledaj razlike u nijansi laka, neravne razmake između dijelova i tragove kita — mogu ukazivati na popravljenu nesreću. Ponesi magnet za provjeru kita." },
        { title: "3. Vožnja u raznim uvjetima", body: "Vozi po gradu i na otvorenoj cesti. Osluškuj zvukove ovjesa, provjeri kočnice, rad mjenjača i kvačila te ponašanje upravljača pri većim brzinama." },
        { title: "4. Elektronika i oprema", body: "Isprobaj klimu, grijanje, svjetla, brisače, prozore, multimediju i sve senzore. Provjeri ima li upaljenih lampica na instrument ploči." },
        { title: "5. Neovisni pregled", body: "Za skuplja vozila isplati se pregled kod ovlaštenog servisa ili neovisnog mehaničara. Dijagnostika može otkriti izbrisane greške i stvarno stanje." },
      ]}
    />
  );
}
