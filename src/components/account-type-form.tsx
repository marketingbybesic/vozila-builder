"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { CompanyFields } from "@/components/company-fields";
import { updateAccountAction, type AccountResult } from "@/actions/account";
import type { CompanyInfo } from "@/db/types";

/**
 * Postavke → Vrsta računa (Karlo st. 13): dropdown Privatni/Firma.
 * Privatnom korisniku su polja firme ONEMOGUĆENA dok ne prebaci na Firmu.
 */
export function AccountTypeForm({ sellerType, company }: { sellerType: "Privatni" | "Trgovac"; company: CompanyInfo | null }) {
  const [type, setType] = useState<"privatni" | "firma">(sellerType === "Trgovac" ? "firma" : "privatni");
  const [state, formAction, pending] = useActionState<AccountResult | undefined, FormData>(
    updateAccountAction,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && (
        <div className="text-sm bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded-md px-3 py-2 border border-[var(--color-danger)]/20">
          {state.error}
        </div>
      )}
      {state?.ok && (
        <div className="text-sm bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-md px-3 py-2 border border-[var(--color-success)]/20">
          Spremljeno.
        </div>
      )}

      <div>
        <label htmlFor="accountType" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
          Vrsta računa
        </label>
        {/* Hardkodirani <select> — Alpine/template opcije u selectu su poznata zamka. */}
        <select
          id="accountType"
          name="accountType"
          value={type}
          onChange={(e) => setType(e.target.value as "privatni" | "firma")}
          className="mt-1.5 w-full h-11 rounded-md border border-[var(--color-line)] bg-white px-3 text-sm"
        >
          <option value="privatni">Privatna osoba</option>
          <option value="firma">Firma / obrt</option>
        </select>
      </div>

      <div className={type === "firma" ? "space-y-4" : "space-y-4 opacity-50"}>
        {type === "firma" && (
          <p className="text-xs text-[var(--color-muted)]">
            OIB i adresa sjedišta koriste se samo interno, za izdavanje R1 računa — ne prikazuju se javno.
          </p>
        )}
        <CompanyFields defaults={company} disabled={type !== "firma"} />
      </div>

      <div className="flex justify-end">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Spremam..." : "Spremi vrstu računa"}
        </Button>
      </div>
    </form>
  );
}
