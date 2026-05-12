import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { PostListingForm } from "@/components/post-listing-form";

export const metadata: Metadata = {
  title: "Objavi oglas",
  description: "Objavi oglas za svoj automobil u 5 minuta. Prvi oglas je besplatan.",
};

export default function ObjaviPage() {
  return (
    <Container className="py-10 md:py-14">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Objavi svoj oglas</h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          5 koraka · cca 5 minuta · prvi oglas je besplatan
        </p>

        <PostListingForm />
      </div>
    </Container>
  );
}
