import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { ListingCard } from "@/components/listing-card";
import { db } from "@/db";
import { MapPin, Phone, ShieldCheck, Mail } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const seller = await db().getUserById(id);
  if (!seller) return { title: "Prodavač nije pronađen" };
  return {
    title: `${seller.firstName} ${seller.lastName} — oglasi`,
    description: `Svi oglasi prodavača ${seller.firstName} ${seller.lastName} iz ${seller.city ?? "Hrvatske"}.`,
  };
}

export default async function DealerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const seller = await db().getUserById(id);
  if (!seller) notFound();

  const userListings = await db().getListingsByUser(id);
  const active = userListings.filter((l) => l.status === "active");

  return (
    <>
      <section className="bg-[var(--color-surface)] border-b border-[var(--color-line)]">
        <Container className="py-10 md:py-14">
          <nav className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-2">
            <Link href="/" className="hover:text-[var(--color-ink)]">Početna</Link>
            <span>›</span>
            <Link href="/trgovci" className="hover:text-[var(--color-ink)]">Prodavači</Link>
            <span>›</span>
            <span className="text-[var(--color-ink-soft)] truncate">
              {seller.firstName} {seller.lastName}
            </span>
          </nav>

          <div className="flex flex-wrap items-start gap-6">
            <div className="size-20 rounded-full bg-gradient-to-br from-[var(--color-ink)] to-[var(--color-ink-soft)] text-white grid place-items-center font-display text-2xl">
              {seller.firstName.charAt(0)}{seller.lastName.charAt(0)}
            </div>
            <div className="flex-1 min-w-[260px]">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={seller.sellerType === "Trgovac" ? "accent" : "neutral"}>
                  {seller.sellerType}
                </Badge>
                {seller.verifiedAt && (
                  <Badge variant="outline">
                    <ShieldCheck className="size-3" /> Verificiran
                  </Badge>
                )}
                {seller.tier === "premium-dealer" && <Badge variant="accent">Premium</Badge>}
              </div>
              <h1 className="font-display text-3xl md:text-4xl tracking-tight">
                {seller.firstName} {seller.lastName}
              </h1>
              <div className="mt-2 text-sm text-[var(--color-ink-soft)] flex flex-wrap items-center gap-x-5 gap-y-1">
                {seller.city && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    {seller.city}, {seller.county}
                  </span>
                )}
                {seller.phone && (
                  <a href={`tel:${seller.phone}`} className="inline-flex items-center gap-1.5 hover:text-[var(--color-ink)]">
                    <Phone className="size-3.5" />
                    {seller.phone}
                  </a>
                )}
                <a href={`mailto:${seller.email}`} className="inline-flex items-center gap-1.5 hover:text-[var(--color-ink)]">
                  <Mail className="size-3.5" />
                  {seller.email}
                </a>
              </div>
              <div className="mt-4 text-sm text-[var(--color-ink-soft)]">
                {active.length} {active.length === 1 ? "aktivan oglas" : "aktivnih oglasa"} ·
                Član od {new Date(seller.createdAt).toLocaleDateString("hr-HR", { year: "numeric", month: "long" })}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-10">
        {active.length === 0 ? (
          <div className="text-center py-16 text-[var(--color-muted)]">
            <p className="text-sm italic">Ovaj prodavač trenutno nema aktivnih oglasa.</p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </Container>
    </>
  );
}
