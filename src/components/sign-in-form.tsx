"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signInAction, type AuthResult } from "@/actions/auth";

export function SignInForm() {
  const [state, formAction, pending] = useActionState<AuthResult | undefined, FormData>(
    signInAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-8 space-y-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-6">
      {state && !state.ok && (
        <div className="text-sm bg-[var(--color-danger)]/10 text-[var(--color-danger)] rounded-md px-3 py-2 border border-[var(--color-danger)]/20">
          {state.error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
          E-mail
        </label>
        <Input id="email" name="email" type="email" placeholder="ime@primjer.hr" className="mt-1.5" required autoComplete="email" />
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="password" className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">
            Lozinka
          </label>
          <Link href="/zaboravljena-lozinka" className="text-xs text-[var(--color-ink-soft)] hover:underline">
            Zaboravljena?
          </Link>
        </div>
        <Input id="password" name="password" type="password" placeholder="••••••••" className="mt-1.5" required autoComplete="current-password" />
      </div>

      <Button type="submit" variant="primary" size="lg" className="w-full" disabled={pending}>
        {pending ? "Prijavljujem..." : "Prijavi se"}
      </Button>

      <p className="text-center text-xs text-[var(--color-muted)]">
        U demo načinu možeš se prijaviti s bilo kojim računom koji si registrirao.
      </p>
    </form>
  );
}
