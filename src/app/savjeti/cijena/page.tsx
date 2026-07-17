import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Procjena cijene vozila",
  description: "Kako odrediti realnu tržišnu cijenu vozila pri kupnji ili prodaji.",
};

export default function Page() {
  return (
    <InfoPage
      title="Procjena cijene vozila"
      backHref="/savjeti"
      backLabel="Savjeti"
      intro="Realna cijena je ključ brze prodaje i sigurne kupnje. Evo kako je odrediti."
      sections={[
        { title: "1. Usporedi slične oglase", body: "Pretraži Vozila.hr po istoj marki, modelu, godini i kilometraži. Uzmi raspon cijena 5–10 sličnih vozila kao polaznu točku, a ne pojedinačni ekstrem." },
        { title: "2. Prilagodi po stanju", body: "Servisна knjižica, broj vlasnika, zimske gume, oprema i vidljiva oštećenja utječu na cijenu. Uredno održavano vozilo s dokumentacijom vrijedi više." },
        { title: "3. Uzmi u obzir kilometražu i godinu", body: "Vozilo s natprosječnom kilometražom za svoju godinu prodaje se ispod prosjeka. Novija godina proizvodnje uz nisku kilometražu podiže cijenu." },
        { title: "4. Ostavi prostor za pregovor", body: "Kupci gotovo uvijek pregovaraju. Postavi cijenu 3–5% iznad minimuma koji prihvaćaš, ali ne pretjeruj — precijenjen oglas dobiva malo upita." },
        { title: "5. Prati potražnju", body: "Sezonske razlike su realne: kabrioleti i motori idu bolje u proljeće, 4×4 i zimska oprema u jesen. Prilagodi trenutak objave ako možeš." },
      ]}
    />
  );
}
