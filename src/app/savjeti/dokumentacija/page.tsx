import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Dokumentacija pri kupoprodaji vozila",
  description: "Koji su dokumenti potrebni pri kupnji i prodaji vozila u Hrvatskoj.",
};

export default function Page() {
  return (
    <InfoPage
      title="Dokumentacija"
      backHref="/savjeti"
      backLabel="Savjeti"
      intro="Uredni papiri čine kupoprodaju brzom i sigurnom. Evo što treba pripremiti."
      sections={[
        { title: "1. Prometna i knjižica vozila", body: "Prodavač mora imati važeću prometnu dozvolu i knjižicu vozila. Provjeri da se podaci (broj šasije, vlasnik) podudaraju s vozilom." },
        { title: "2. Ugovor o kupoprodaji", body: "Sastavi pisani ugovor u dva primjerka s podacima obje strane, vozila, cijenom i datumom. Za sigurnost se potpisi mogu ovjeriti kod javnog bilježnika." },
        { title: "3. Dokaz o vlasništvu i teretima", body: "Provjeri da vozilo nije pod leasingom, kreditom ili zabranom. Traži uvid u povijest vlasništva i eventualne terete prije plaćanja." },
        { title: "4. Tehnički pregled i registracija", body: "Provjeri do kada vrijedi registracija i tehnički pregled. Vozilo s isteklim pregledom morat ćeš registrirati prije korištenja." },
        { title: "5. Prijenos vlasništva", body: "Nakon kupnje prijenos vlasništva obavlja se u stanici za tehnički pregled ili nadležnoj ustanovi u zakonskom roku. Ponesi ugovor, osobne dokumente i dokaz o plaćenom porezu." },
      ]}
    />
  );
}
