import type { Metadata } from "next";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = {
  title: "Savjeti za fotografije oglasa",
  description: "Kako fotografirati vozilo da tvoj oglas privuče više kupaca.",
};

export default function Page() {
  return (
    <InfoPage
      title="Savjeti za fotografije"
      backHref="/savjeti"
      backLabel="Savjeti"
      intro="Dobre fotografije udvostručuju broj upita. Nekoliko pravila koja rade razliku."
      sections={[
        { title: "1. Dnevno svjetlo, čisto vozilo", body: "Slikaj po danu, po mogućnosti u zlatnom satu (jutro/predvečer). Operi i posuši vozilo prije slikanja — prljavština i mrlje odbijaju kupce." },
        { title: "2. Pokrij sve kutove", body: "Minimalno: prednji 3/4 kut, bočni profil, stražnji 3/4, unutrašnjost (prednja i stražnja sjedala), instrument ploča s kilometražom, motor i prtljažnik." },
        { title: "3. Prva fotografija je najvažnija", body: "Naslovna slika (prednji 3/4 kut) odlučuje hoće li kupac uopće otvoriti oglas. Neka bude oštra, dobro osvijetljena i bez ljudi u kadru." },
        { title: "4. Budi iskren o oštećenjima", body: "Fotografiraj i ogrebotine, udubljenja ili habanje. Transparentnost gradi povjerenje i sprječava gubitak vremena na preglede koji ne završe prodajom." },
        { title: "5. Bez filtera i uljepšavanja", body: "Ne koristi jake filtere koji mijenjaju boju laka. Kupac očekuje vozilo kakvo je na slikama — nerealne fotografije vode do razočaranja i otkazivanja." },
      ]}
    />
  );
}
