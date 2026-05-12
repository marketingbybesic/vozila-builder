"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signUpAction, type AuthResult } from "@/actions/auth";

export function SignUpForm() {
  const [state, formAction, pending] = useActionState<AuthResult | undefined, FormData>(
    signUpAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-8 space-y-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-6">
      {state && !state.ok && (
        <div className="text-sm bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded-md px-3 py-2 border border-[var(--color-danger)]/20">
          {state.error}
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="firstName" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
            Ime
          </label>
          <Input id="firstName" name="firstName" placeholder="Ivan" className="mt-1.5" required />
        </div>
        <div>
          <label htmlFor="lastName" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
            Prezime
          </label>
          <Input id="lastName" name="lastName" placeholder="Horvat" className="mt-1.5" required />
        </div>
      </div>
      <div>
        <label htmlFor="email" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
          E-mail
        </label>
        <Input id="email" name="email" type="email" placeholder="ime@primjer.hr" className="mt-1.5" required autoComplete="email" />
      </div>
      <div>
        <label htmlFor="phone" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
          Telefon
        </label>
        <Input id="phone" name="phone" type="tel" placeholder="+385 91 234 5678" className="mt-1.5" autoComplete="tel" />
      </div>
      <div>
        <label htmlFor="password" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
          Lozinka
        </label>
        <Input id="password" name="password" type="password" placeholder="Minimalno 8 znakova" className="mt-1.5" required minLength={8} autoComplete="new-password" />
      </div>

      <label className="flex items-start gap-2 text-xs text-[var(--color-ink-soft)] leading-relaxed">
        <input type="checkbox" className="mt-0.5 size-4 rounded border-[var(--color-line)]" required />
        <span>
          Slažem se s{" "}
          <Link href="/uvjeti" className="text-[var(--color-accent-dark)] underline hover:no-underline">Uvjetima korištenja</Link>{" "}
          i{" "}
          <Link href="/privatnost" className="text-[var(--color-accent-dark)] underline hover:no-underline">Politikom privatnosti</Link>.
        </span>
      </label>

      <Button type="submit" variant="accent" size="lg" className="w-full" disabled={pending}>
        {pending ? "Otvaranje računa..." : "Otvori račun"}
      </Button>
    </form>
  );
}
