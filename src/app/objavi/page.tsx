import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PostListingForm } from "@/components/post-listing-form";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "Objavi oglas",
  description: "Objavi oglas za svoj automobil u 5 minuta. Besplatno za privatne korisnike.",
};

export default async function ObjaviPage() {
  // /objavi je iza proxy guarda — korisnik je uvijek prijavljen (Karlo st. 12:
  // kontakt podaci se predpopune iz profila, uz mogućnost izmjene u formi).
  const user = await requireUser();
  return (
    <Container className="py-10 md:py-14">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Objavi svoj oglas</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          6 koraka · cca 5 minuta · besplatno za privatne korisnike
        </p>

        <PostListingForm
          profile={{
            firstName: user.firstName,
            lastName: user.lastName,
            phone: user.phone ?? "",
            email: user.email,
          }}
        />
      </div>
    </Container>
  );
}
