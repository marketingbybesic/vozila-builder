import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Input, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Kontakt",
  description: "Kontaktiraj Auti.hr tim. Pitanja, prijedlozi, prijave - odgovaramo unutar 24 sata.",
};

export default function KontaktPage() {
  return (
    <Container className="py-16 md:py-24">
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl md:text-5xl tracking-tight">Pišite nam</h1>
        <p className="mt-3 text-lg text-[var(--color-ink-soft)] max-w-xl">
          Sva pitanja, prijedlozi i prijave dolaze direktno do nas. Odgovaramo unutar 24 sata radnim danom.
        </p>
      </div>

      <div className="mt-12 grid lg:grid-cols-[1fr_320px] gap-10">
        <form className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-6 space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
                Ime i prezime
              </label>
              <Input id="name" placeholder="Ivan Horvat" className="mt-1.5" required />
            </div>
            <div>
              <label htmlFor="email" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
                E-mail
              </label>
              <Input id="email" type="email" placeholder="ime@primjer.hr" className="mt-1.5" required />
            </div>
          </div>
          <div>
            <label htmlFor="subject" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
              Tema
            </label>
            <Input id="subject" placeholder="O čemu se radi?" className="mt-1.5" required />
          </div>
          <div>
            <label htmlFor="message" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
              Poruka
            </label>
            <Textarea id="message" placeholder="Detaljnije..." className="mt-1.5 min-h-[180px]" required />
          </div>
          <Button variant="accent" size="lg" className="w-full sm:w-auto">
            Pošalji poruku
          </Button>
        </form>

        <aside className="space-y-6 text-sm">
          <ContactRow icon={<Mail className="size-4" />} title="E-mail" value="podrska@auti.hr" />
          <ContactRow icon={<Phone className="size-4" />} title="Telefon" value="+385 1 555 5555" sub="Radnim danom 9-17" />
          <ContactRow icon={<MapPin className="size-4" />} title="Sjedište" value="Zagreb, Hrvatska" sub="Adresa po dogovoru" />
          <div className="border-t border-[var(--color-line)] pt-6">
            <p className="text-xs text-[var(--color-muted)] leading-relaxed">
              Ako si žrtva prijevare ili sumnjaš na sumnjiv oglas, javi se odmah - reagiramo isti dan.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}

function ContactRow({ icon, title, value, sub }: { icon: React.ReactNode; title: string; value: string; sub?: string }) {
  return (
    <div className="flex gap-3">
      <div className="size-9 rounded-md bg-[var(--color-accent)]/15 text-[var(--color-accent-dark)] grid place-items-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">{title}</div>
        <div className="mt-0.5 font-medium text-[var(--color-ink)]">{value}</div>
        {sub && <div className="text-xs text-[var(--color-muted)] mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}
