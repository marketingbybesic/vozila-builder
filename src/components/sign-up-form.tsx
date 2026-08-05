"use client";

import { useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signUpAction, type AuthResult } from "@/actions/auth";
import { CompanyFields } from "@/components/company-fields";

export function SignUpForm() {
  // Karlo st. 13: privatnik ili firma — firma popunjava i podatke za R1 račun.
  const [accountType, setAccountType] = useState<"privatni" | "firma">("privatni");
  // Karlo 30.07: proxy.ts stavi ?next=<put> kad zaštićena ruta odbije pristup.
  // Bez ovog skrivenog polja server akcija ga ne vidi i korisnik uvijek padne
  // na /moj-racun umjesto na stranicu koju je tražio.
  const nextParam = useSearchParams().get("next") ?? "";
  const [state, formAction, pending] = useActionState<AuthResult | undefined, FormData>(
    signUpAction,
    undefined
  );

  return (
    <form action={formAction} className="mt-8 space-y-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-6">
      <input type="hidden" name="next" value={nextParam} />
      <input type="hidden" name="accountType" value={accountType} />

      {/* Vrsta računa — dva jasna izbora umjesto skrivenog polja. */}
      <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Vrsta računa">
        {([["privatni", "Privatna osoba"], ["firma", "Firma / obrt"]] as const).map(([val, label]) => (
          <button
            key={val}
            type="button"
            role="radio"
            aria-checked={accountType === val}
            onClick={() => setAccountType(val)}
            className={
              "h-11 rounded-lg border text-sm font-medium transition-colors " +
              (accountType === val
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                : "border-[var(--color-line)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink-soft)]")
            }
          >
            {label}
          </button>
        ))}
      </div>

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
      {accountType === "firma" && (
        <div className="space-y-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-bg)] p-4 animate-fade-in">
          <div>
            <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-ink-soft)]">Podaci firme</div>
            <p className="text-xs text-[var(--color-muted)] mt-1">
              OIB i adresa sjedišta koriste se samo interno, za izdavanje R1 računa — ne prikazuju se javno.
            </p>
          </div>
          <CompanyFields />
        </div>
      )}

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
