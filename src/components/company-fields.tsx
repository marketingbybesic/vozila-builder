"use client";

import { Input } from "@/components/ui/input";
import type { CompanyInfo } from "@/db/types";

/**
 * Polja firme (Karlo st. 13) — dijele ih registracija i postavke profila.
 * OIB/adresa/grad/poštanski = INTERNO (Stripe R1); web smije biti javan.
 */
export function CompanyFields({ defaults, disabled }: { defaults?: CompanyInfo | null; disabled?: boolean }) {
  const f = (label: string, name: string, props: React.ComponentProps<typeof Input>) => (
    <div>
      <label htmlFor={name} className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
        {label}
      </label>
      <Input id={name} name={name} className="mt-1.5" disabled={disabled} {...props} />
    </div>
  );

  return (
    <>
      {f("Naziv firme / obrta", "companyName", { placeholder: "npr. Auto Kuća d.o.o.", defaultValue: defaults?.name ?? "", required: !disabled })}
      {f("OIB", "companyOib", { placeholder: "11 znamenki", inputMode: "numeric", maxLength: 11, defaultValue: defaults?.oib ?? "", required: !disabled })}
      <div className="grid grid-cols-2 gap-3">
        {f("Adresa sjedišta", "companyAddress", { placeholder: "Ulica i broj", defaultValue: defaults?.address ?? "", required: !disabled })}
        {f("Grad", "companyCity", { placeholder: "npr. Zagreb", defaultValue: defaults?.city ?? "", required: !disabled })}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {f("Poštanski broj", "companyZip", { placeholder: "npr. 10000", inputMode: "numeric", maxLength: 5, defaultValue: defaults?.zip ?? "", required: !disabled })}
        {f("Web stranica (javno, opcionalno)", "companyWebsite", { placeholder: "https://...", defaultValue: defaults?.website ?? "" })}
      </div>
    </>
  );
}
