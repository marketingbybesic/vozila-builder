"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { requireUser } from "@/lib/session";
import { companyFromForm } from "@/lib/company";

export type AccountResult = { ok: true } | { ok: false; error: string };

/**
 * Promjena vrste računa + podataka firme (Karlo st. 13, postavke profila).
 *
 * ⏭️ MENTAL NOTE (Dino, 06.08.2026): promjena vrste računa kasnije će se
 * naplaćivati/ograničiti da trgovci ne objavljuju kao "privatni" i ne varaju
 * na cijeni objave. Za sada slobodna — kad dođe naplata, ovdje je jedina
 * ulazna točka pa se gate dodaje na jednom mjestu.
 */
export async function updateAccountAction(_prev: AccountResult | undefined, formData: FormData): Promise<AccountResult> {
  const user = await requireUser();

  const type = z.enum(["privatni", "firma"]).safeParse(formData.get("accountType"));
  if (!type.success) return { ok: false, error: "Neispravna vrsta računa" };

  if (type.data === "firma") {
    const c = companyFromForm(formData);
    if (!c.ok) return { ok: false, error: c.error };
    await db().updateUser(user.id, { sellerType: "Trgovac", company: c.company });
  } else {
    // Povratak na privatni račun: podaci firme se ZADRŽAVAJU u bazi (interno,
    // radi računovodstvene povijesti) — samo se tip vrati na Privatni.
    await db().updateUser(user.id, { sellerType: "Privatni" });
  }

  revalidatePath("/moj-racun/postavke");
  return { ok: true };
}
