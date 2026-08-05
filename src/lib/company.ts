import { z } from "zod";
import { isValidOib } from "@/lib/oib";
import type { CompanyInfo } from "@/db/types";

/**
 * Podaci firme (Karlo st. 13) — dijele ih registracija (signUpAction) i
 * postavke (updateAccountAction). Živi IZVAN "use server" datoteka jer one
 * smiju izvoziti samo async funkcije.
 */
export const CompanyInput = z.object({
  companyName: z.string().trim().min(2, "Naziv firme je obavezan"),
  companyOib: z.string().trim().refine(isValidOib, "OIB nije ispravan (11 znamenki s kontrolnom)"),
  companyAddress: z.string().trim().min(3, "Adresa sjedišta je obavezna"),
  companyCity: z.string().trim().min(2, "Grad sjedišta je obavezan"),
  companyZip: z.string().trim().regex(/^\d{5}$/, "Poštanski broj mora imati 5 znamenki"),
  companyWebsite: z.string().trim().optional().or(z.literal("")),
});

export function companyFromForm(formData: FormData): { ok: true; company: CompanyInfo } | { ok: false; error: string } {
  const c = CompanyInput.safeParse({
    companyName: formData.get("companyName"),
    companyOib: formData.get("companyOib"),
    companyAddress: formData.get("companyAddress"),
    companyCity: formData.get("companyCity"),
    companyZip: formData.get("companyZip"),
    companyWebsite: formData.get("companyWebsite") || "",
  });
  if (!c.success) return { ok: false, error: c.error.issues[0]?.message ?? "Neispravni podaci firme" };
  return {
    ok: true,
    company: {
      name: c.data.companyName,
      oib: c.data.companyOib,
      address: c.data.companyAddress,
      city: c.data.companyCity,
      zip: c.data.companyZip,
      website: c.data.companyWebsite || undefined,
    },
  };
}
