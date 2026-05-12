import type { Metadata } from "next";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { COUNTIES } from "@/data/locations";

export const metadata: Metadata = { title: "Postavke" };

export default function PostavkePage() {
  return (
    <div>
      <header className="mb-8">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Postavke</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          Upravljaj profilom, obavijestima i privatnošću.
        </p>
      </header>

      <div className="space-y-6">
        <Card title="Profil" desc="Tvoji javni podaci - prikazani na oglasima.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ime"><Input defaultValue="Ivan" /></Field>
            <Field label="Prezime"><Input defaultValue="Horvat" /></Field>
            <Field label="E-mail"><Input type="email" defaultValue="ivan@auti.hr" /></Field>
            <Field label="Telefon"><Input defaultValue="+385 91 234 5678" /></Field>
            <Field label="Županija">
              <Select defaultValue="Grad Zagreb">
                {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Grad"><Input defaultValue="Zagreb" /></Field>
          </div>
          <div className="flex justify-end mt-5">
            <Button variant="primary">Spremi promjene</Button>
          </div>
        </Card>

        <Card title="Obavijesti" desc="Što želiš da ti dolazi u sandučić.">
          <div className="space-y-3">
            <Toggle label="Nove poruke" desc="E-mail kad mi kupac/prodavač pošalje poruku" defaultChecked />
            <Toggle label="Promjene cijene" desc="Kad prodavač spusti cijenu na spremljenom oglasu" defaultChecked />
            <Toggle label="Nove ponude" desc="Tjedni sažetak novih oglasa za moje spremljene pretrage" defaultChecked />
            <Toggle label="Marketing" desc="Promocije, savjeti, posebne ponude" />
          </div>
        </Card>

        <Card title="Privatnost" desc="Tko vidi tvoje podatke.">
          <div className="space-y-3">
            <Toggle label="Prikaži moj telefon" desc="Direktan poziv s detaljne stranice oglasa" defaultChecked />
            <Toggle label="Prikaži broj oglasa" desc="Vidljiv broj 'X drugih oglasa' na profilu" />
          </div>
        </Card>

        <Card title="Opasna zona" desc="Akcije koje se ne mogu poništiti." danger>
          <Button variant="danger">Obriši račun</Button>
          <p className="text-xs text-[var(--color-muted)] mt-2">
            Trajno briše tvoje oglase, poruke i podatke. Ne može se vratiti.
          </p>
        </Card>
      </div>
    </div>
  );
}

function Card({ title, desc, children, danger }: { title: string; desc: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section className={
      "bg-[var(--color-surface)] rounded-[var(--radius-lg)] border p-6 " +
      (danger ? "border-[var(--color-danger)]/30" : "border-[var(--color-line)]")
    }>
      <h2 className="font-display text-xl">{title}</h2>
      <p className="text-xs text-[var(--color-muted)] mt-0.5 mb-5">{desc}</p>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Toggle({ label, desc, defaultChecked }: { label: string; desc: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between gap-4 p-3 rounded-md hover:bg-[var(--color-bg)] cursor-pointer transition-colors">
      <div className="min-w-0">
        <div className="font-medium text-sm">{label}</div>
        <div className="text-xs text-[var(--color-muted)] mt-0.5">{desc}</div>
      </div>
      <span className="relative inline-block w-11 h-6 shrink-0">
        <input
          type="checkbox"
          defaultChecked={defaultChecked}
          className="peer appearance-none w-full h-full bg-[var(--color-line)] checked:bg-[var(--color-ink)] rounded-full transition-colors cursor-pointer"
        />
        <span className="absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5 pointer-events-none" />
      </span>
    </label>
  );
}
