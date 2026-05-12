"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { clearSessionCookie, createSessionCookie, requireUser } from "@/lib/session";

const SignUpInput = z.object({
  email: z.string().email("Neispravna e-mail adresa"),
  password: z.string().min(8, "Lozinka mora imati minimalno 8 znakova"),
  firstName: z.string().min(1, "Ime je obavezno"),
  lastName: z.string().min(1, "Prezime je obavezno"),
  phone: z.string().optional(),
});

export type AuthResult = { ok: true } | { ok: false; error: string };

export async function signUpAction(_prev: AuthResult | undefined, formData: FormData): Promise<AuthResult> {
  const parsed = SignUpInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Neispravni podaci" };

  const existing = await db().getUserByEmail(parsed.data.email);
  if (existing) return { ok: false, error: "Korisnik s ovom e-mail adresom već postoji" };

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await db().createUser({
    email: parsed.data.email,
    passwordHash,
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone,
  });
  await createSessionCookie(user.id);
  redirect("/moj-racun");
}

const SignInInput = z.object({
  email: z.string().email("Neispravna e-mail adresa"),
  password: z.string().min(1, "Unesite lozinku"),
});

export async function signInAction(_prev: AuthResult | undefined, formData: FormData): Promise<AuthResult> {
  const parsed = SignInInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Neispravni podaci" };

  const user = await db().getUserByEmail(parsed.data.email);
  if (!user || !user.passwordHash) return { ok: false, error: "Neispravan e-mail ili lozinka" };
  const valid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!valid) return { ok: false, error: "Neispravan e-mail ili lozinka" };
  await createSessionCookie(user.id);
  redirect("/moj-racun");
}

export async function signOutAction() {
  await clearSessionCookie();
  redirect("/");
}

const UpdateProfile = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  county: z.string().optional(),
  city: z.string().optional(),
});

export async function updateProfileAction(_prev: AuthResult | undefined, formData: FormData): Promise<AuthResult> {
  const user = await requireUser();
  const parsed = UpdateProfile.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone") || undefined,
    county: formData.get("county") || undefined,
    city: formData.get("city") || undefined,
  });
  if (!parsed.success) return { ok: false, error: "Provjeri unesene podatke" };
  await db().updateUser(user.id, parsed.data);
  revalidatePath("/moj-racun");
  revalidatePath("/moj-racun/postavke");
  return { ok: true };
}
