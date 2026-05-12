import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/container";
import { SignInForm } from "@/components/sign-in-form";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Prijava",
  description: "Prijavi se na svoj Auti.hr račun i upravljaj oglasima.",
};

export default async function PrijavaPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/moj-racun");
  const sp = await searchParams;

  return (
    <Container className="py-16 md:py-24">
      <div className="mx-auto max-w-md">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Prijava</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Nemaš račun?{" "}
          <Link href="/registracija" className="text-[var(--color-accent-dark)] font-medium hover:underline">
            Registriraj se
          </Link>
        </p>

        {sp.reason === "expired" && (
          <div className="mt-6 text-sm bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-md px-4 py-3 text-[var(--color-ink-soft)]">
            <strong className="text-[var(--color-ink)]">Sesija je istekla.</strong> Prijavi se ponovno za nastavak.
          </div>
        )}

        <SignInForm />

        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Prijavom prihvaćaš{" "}
          <Link href="/uvjeti" className="hover:text-[var(--color-ink)] underline">Uvjete korištenja</Link>{" "}
          i{" "}
          <Link href="/privatnost" className="hover:text-[var(--color-ink)] underline">Politiku privatnosti</Link>.
        </p>
      </div>
    </Container>
  );
}
