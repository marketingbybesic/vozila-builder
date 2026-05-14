import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageGallery } from "@/components/image-gallery";
import { ListingCard } from "@/components/listing-card";
import { SaveButton } from "@/components/save-button";
import { ShareButton } from "@/components/share-button";
import { CompareButton } from "@/components/compare-button";
import { db } from "@/db";
import { FEATURE_CATEGORIES } from "@/data/features";
import {
  formatPrice,
  formatKm,
  formatPower,
  timeAgo,
  formatDate,
} from "@/lib/utils";
import {
  Phone,
  MessageSquare,
  MapPin,
  Calendar,
  Gauge,
  Fuel,
  Cog,
  Eye,
  Shield,
} from "lucide-react";

export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const rows = await db().getAllActiveSlugs();
    return rows.map((r) => ({ slug: r.slug }));
  } catch (err) {
    // Build-time DB unreachable. Skip SSG — dynamicParams handles all routes at runtime.
    console.warn("[generateStaticParams] getAllActiveSlugs failed, falling back to dynamic-only:", err);
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const listing = await db().getListingBySlug(slug);
  if (!listing) return { title: "Oglas nije pronađen" };
  return {
    title: `${listing.make} ${listing.model} ${listing.year}. — ${formatPrice(listing.priceEur)}`,
    description: `${listing.title} · ${formatKm(listing.km)} · ${listing.fuel} · ${listing.city}. ${listing.description.slice(0, 140)}`,
    openGraph: {
      title: `${listing.make} ${listing.model} ${listing.year}.`,
      description: `${formatPrice(listing.priceEur)} · ${formatKm(listing.km)} · ${listing.city}`,
      images: [{ url: listing.images[0] }],
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const listing = await db().getListingBySlug(slug);
  if (!listing) notFound();

  const related = await db().getRelatedListings(listing, 4);

  const featuresByCategory = FEATURE_CATEGORIES.map((cat) => ({
    name: cat.name,
    items: cat.items.filter((f) => listing.features.includes(f)),
  })).filter((c) => c.items.length > 0);

  return (
    <>
      <Container className="py-6 md:py-10">
        <nav className="text-xs text-[var(--color-muted)] mb-4 flex items-center gap-2">
          <Link href="/" className="hover:text-[var(--color-ink)]">Početna</Link>
          <span>›</span>
          <Link href="/oglasi" className="hover:text-[var(--color-ink)]">Oglasi</Link>
          <span>›</span>
          <Link
            href={`/oglasi?make=${listing.make.toLowerCase()}`}
            className="hover:text-[var(--color-ink)]"
          >
            {listing.make}
          </Link>
          <span>›</span>
          <span className="text-[var(--color-ink-soft)] truncate">{listing.model}</span>
        </nav>

        <div className="grid lg:grid-cols-[1fr_360px] gap-8 lg:gap-10">
          <div className="space-y-8">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {listing.featured && <Badge variant="accent">Izdvojeno</Badge>}
                <Badge variant="outline">{listing.condition}</Badge>
                <Badge variant="outline">{listing.sellerType}</Badge>
              </div>
              <h1 className="font-display text-3xl md:text-4xl tracking-tight leading-tight">
                {listing.make} {listing.model}
                {listing.variant && (
                  <span className="text-[var(--color-ink-soft)] font-normal italic"> {listing.variant}</span>
                )}
              </h1>
              <div className="mt-2 text-sm text-[var(--color-muted)] flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" /> {listing.city}, {listing.county}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Eye className="size-3.5" /> {listing.views} pregleda
                </span>
                <span>Objavljeno {timeAgo(listing.createdAt)}</span>
              </div>
            </div>

            <ImageGallery images={listing.images} alt={listing.title} />

            <section>
              <h2 className="font-display text-2xl mb-4">Osnovni podaci</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5">
                <SpecItem icon={<Calendar className="size-4" />} label="Godina" value={`${listing.year}.`} />
                <SpecItem icon={<Gauge className="size-4" />} label="Kilometraža" value={formatKm(listing.km)} />
                <SpecItem icon={<Fuel className="size-4" />} label="Gorivo" value={listing.fuel} />
                <SpecItem icon={<Cog className="size-4" />} label="Mjenjač" value={listing.transmission} />
                <SpecItem label="Karoserija" value={listing.bodyType} />
                <SpecItem label="Pogon" value={listing.drive} />
                <SpecItem label="Snaga" value={formatPower(listing.powerKw)} />
                {listing.engineCc > 0 && (
                  <SpecItem label="Obujam" value={`${listing.engineCc} cm³`} />
                )}
                <SpecItem label="Boja" value={listing.color} />
                <SpecItem label="Vrata" value={String(listing.doors)} />
                <SpecItem label="Sjedala" value={String(listing.seats)} />
                {listing.firstRegistered && (
                  <SpecItem label="Prva registracija" value={listing.firstRegistered} />
                )}
                {listing.registrationUntil && (
                  <SpecItem label="Registriran do" value={listing.registrationUntil} />
                )}
              </dl>
            </section>

            {(listing.accidentHistory || listing.serviceHistory || listing.importedFrom || listing.vinMasked) && (
              <section>
                <h2 className="font-display text-2xl mb-4">Povijest vozila</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5">
                  {listing.accidentHistory && <SpecItem label="Nesreće" value={listing.accidentHistory} />}
                  {listing.serviceHistory && <SpecItem label="Servisna knjižica" value={listing.serviceHistory} />}
                  {listing.importedFrom && <SpecItem label="Uvezen iz" value={listing.importedFrom} />}
                  {listing.vinMasked && <SpecItem label="VIN (skraćeno)" value={listing.vinMasked} />}
                </dl>
              </section>
            )}

            <section>
              <h2 className="font-display text-2xl mb-4">Opis</h2>
              <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5 text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-line">
                {listing.description}
              </div>
            </section>

            {featuresByCategory.length > 0 && (
              <section>
                <h2 className="font-display text-2xl mb-4">Oprema</h2>
                <div className="space-y-5">
                  {featuresByCategory.map((cat) => (
                    <div key={cat.name}>
                      <h3 className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-3">
                        {cat.name}
                      </h3>
                      <div className="flex flex-wrap gap-1.5">
                        {cat.items.map((f) => (
                          <Badge key={f} variant="neutral">{f}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="bg-[var(--color-ink)] text-white rounded-[var(--radius-lg)] p-6">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-md bg-[var(--color-accent)]/20 text-[var(--color-accent)] grid place-items-center shrink-0">
                  <Shield className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg">Prije nego što platiš</h3>
                  <p className="mt-1 text-sm text-white/70 leading-relaxed">
                    Nikad ne uplaćuj kaparu prije nego što fizički pregledaš vozilo. Provjeri VIN preko HAK servisa i dokumente vozila kod ovlaštenog ispitivača. Ako prodavač odbija susret uživo, prijavi oglas.
                  </p>
                  <Link
                    href="/savjeti/prijevara"
                    className="mt-3 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline"
                  >
                    Kako prepoznati prijevaru →
                  </Link>
                </div>
              </div>
            </section>
          </div>

          <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5 shadow-[var(--shadow-card)]">
              <div className="font-display text-4xl text-[var(--color-ink)] tracking-tight flex items-baseline gap-3 flex-wrap">
                {formatPrice(listing.priceEur)}
                {listing.originalPriceEur && listing.originalPriceEur > listing.priceEur && (
                  <span className="text-lg text-[var(--color-muted)] line-through decoration-1 font-normal">
                    {formatPrice(listing.originalPriceEur)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[var(--color-muted)] flex items-center gap-2">
                Cijena s PDV-om
                {listing.originalPriceEur && listing.originalPriceEur > listing.priceEur && (
                  <span className="inline-flex items-center text-[10px] uppercase tracking-wider font-semibold text-[var(--color-accent-dark)] bg-[var(--color-accent)]/15 px-2 py-0.5 rounded">
                    -{Math.round(((listing.originalPriceEur - listing.priceEur) / listing.originalPriceEur) * 100)}% snižena cijena
                  </span>
                )}
              </p>

              <div className="mt-5 space-y-2">
                <Button variant="accent" size="lg" className="w-full">
                  <Phone className="size-4" />
                  {listing.sellerPhone}
                </Button>
                <Button variant="primary" size="lg" className="w-full">
                  <MessageSquare className="size-4" />
                  Pošalji poruku
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <SaveButton listingId={listing.id} variant="detail" className="w-full" />
                  <ShareButton title={`${listing.make} ${listing.model}`} />
                </div>
                <div className="mt-2">
                  <CompareButton slug={listing.slug} variant="detail" />
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-[var(--color-line)]">
                <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-2">
                  Prodavač
                </div>
                <div className="font-medium">{listing.sellerName}</div>
                <div className="text-xs text-[var(--color-muted)] mt-0.5">
                  {listing.sellerType} · {listing.city}
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-[var(--color-line)]">
                <Link
                  href={`/oglasi/${listing.slug}/prijavi`}
                  className="text-xs text-[var(--color-muted)] hover:text-red-600 hover:underline"
                >
                  Prijavi oglas
                </Link>
              </div>
            </div>

            <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-5 text-sm space-y-2">
              <div className="font-medium text-[var(--color-ink)]">Spremno za izračun</div>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                Mjesečna rata uz 20% predujma i 5 godina otplate približno
                <span className="font-semibold text-[var(--color-ink)]"> {formatPrice(Math.round((listing.priceEur * 0.8) / 60))}</span>/mjesečno.
              </p>
              <Link href="/savjeti/financiranje" className="text-xs text-[var(--color-accent-dark)] hover:underline">
                Izračunaj kredit →
              </Link>
            </div>
          </aside>
        </div>
      </Container>

      {related.length > 0 && (
        <section className="border-t border-[var(--color-line)] bg-[var(--color-surface)]">
          <Container className="py-12 md:py-16">
            <h2 className="font-display text-2xl md:text-3xl tracking-tight mb-6">
              Slični oglasi
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((l) => (
                <ListingCard key={l.id} listing={l} />
              ))}
            </div>
          </Container>
        </section>
      )}
    </>
  );
}

function SpecItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 font-medium text-[var(--color-ink)]">{value}</dd>
    </div>
  );
}

