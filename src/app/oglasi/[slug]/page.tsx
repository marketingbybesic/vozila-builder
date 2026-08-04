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
import {
  formatPrice,
  formatKm,
  formatPower,
  timeAgo,
  formatDate,
} from "@/lib/utils";
import { listingHasField, specGroupsFor, isVehicle, cardSummary } from "@/lib/listing-fields";
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
  // Karlo 31.07: metapodaci su bezuvjetno ubacivali km i gorivo — pa je i SEO
  // opis filtera za traktor tvrdio "0 km · Benzin". Sad se koristi isti sažetak
  // kao na kartici (lib/listing-fields.ts), koji je prilagođen kategoriji.
  const summary = cardSummary(listing).join(" · ");
  return {
    title: `${listing.make} ${listing.model} ${listing.year}. — ${formatPrice(listing.priceEur)}`,
    description: `${listing.title}${summary ? ` · ${summary}` : ""} · ${listing.city}. ${listing.description.slice(0, 140)}`,
    openGraph: {
      title: `${listing.make} ${listing.model} ${listing.year}.`,
      description: `${formatPrice(listing.priceEur)}${summary ? ` · ${summary}` : ""} · ${listing.city}`,
      // Oglas bez slike davao je `url: undefined` → neispravan og:image.
      images: listing.images?.[0] ? [{ url: listing.images[0] }] : undefined,
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
  // Specifikacije iz sheme — samo popunjena polja relevantna za ovu kategoriju.
  const specGroups = specGroupsFor(listing);

  /**
   * ⚠️ Dino 04.08.2026: rubrike Karoserija / Osnovno / Motor / Vrata i sjedala /
   * Boja / Stanje vozila spajaju se u JEDNU rubriku "Osnovni podaci", bez
   * ponavljanja. "Dodatne opcije" ostaju zasebno (svaka stavka u svoj red),
   * "Povijest" i "Dokumenti" također.
   *
   * ⚠️ Duplikat se prepoznaje po VRIJEDNOSTI, ne po oznaci — hardkodirana
   * sekcija kaže "Karoserija: Hatchback", a shema "Oblik karoserije: Hatchback".
   * Isto Kilometraža/Kilometri, Obujam/Obujam motora, Boja/Boja vozila.
   *
   * `specGroupsFor()` je NETAKNUT — koriste ga kartica, usporedba, moji oglasi
   * i admin. Spajanje je isključivo na OVOM prikazu.
   */
  const MERGE_INTO_BASIC = new Set([
    "Karoserija", "Osnovno", "Motor", "Vrata i sjedala", "Boja", "Stanje vozila",
  ]);
  // Vrijednosti koje hardkodirana sekcija "Osnovni podaci" već prikazuje.
  const shownValues = new Set(
    [
      listing.year > 0 ? `${listing.year}.` : "",
      listing.km > 0 ? `${listing.km.toLocaleString("hr-HR")} km` : "",
      listing.fuel, listing.transmission, listing.bodyType, listing.drive, listing.color,
      listing.powerKw > 0 ? formatPower(listing.powerKw) : "",
      listing.powerKw > 0 ? `${listing.powerKw} kW (${Math.round(listing.powerKw * 1.36)} KS)` : "",
      listing.engineCc > 0 ? `${listing.engineCc} cm³` : "",
      listing.doors > 0 ? String(listing.doors) : "",
      listing.seats > 0 ? String(listing.seats) : "",
    ].filter(Boolean),
  );
  const extraBasics: Array<{ label: string; value: string }> = [];
  const otherGroups: typeof specGroups = [];
  for (const g of specGroups) {
    if (MERGE_INTO_BASIC.has(g.name)) {
      for (const it of g.items) {
        if (shownValues.has(it.value)) continue; // već gore
        if (extraBasics.some((e) => e.value === it.value)) continue; // dvije grupe, ista vrijednost
        extraBasics.push(it);
      }
    } else {
      otherGroups.push(g);
    }
  }
  /**
   * ⚠️ Dino 04.08.: "Tip boje" (metalik/mat) stoji ODMAH IZA "Boje".
   * `extraBasics` se inače renderiraju na kraju rubrike, iza hardkodiranih
   * polja, pa je Tip boje završavao daleko od Boje kojoj pripada.
   * Vadi se van i renderira uz `Boja`; ostatak `extraBasics` ostaje na kraju.
   */
  const colorTypeItem = extraBasics.find((e) => e.label === "Tip boje");
  const extraBasicsRest = extraBasics.filter((e) => e !== colorTypeItem);

  const povijestGroups = otherGroups.filter((g) => g.name === "Povijest");
  const dokumentiGroups = otherGroups.filter((g) => g.name === "Dokumenti");
  const opcijeGroups = otherGroups.filter(
    (g) => g.name !== "Povijest" && g.name !== "Dokumenti",
  );

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

            {/* Karlo 31.07: prije su se OVDJE bezuvjetno ispisivale auto-kolone —
                filter za traktor je pokazivao "0 km · Benzin · Limuzina · Vrata 4".
                Sada se pita shema (lib/listing-fields.ts): prikazuje se samo ono
                što ta kategorija/podkategorija stvarno ima, uključujući atribute
                (širina gume, nosivost viličara, broj ležišta kampera) koji se
                dosad nisu prikazivali NIGDJE. */}
            <section>
              <h2 className="font-display text-2xl mb-4">Osnovni podaci</h2>
              <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5">
                <SpecItem icon={<Calendar className="size-4" />} label="Godina" value={`${listing.year}.`} />
                {listingHasField(listing, "km") && listing.km > 0 && (
                  <SpecItem icon={<Gauge className="size-4" />} label="Kilometraža" value={formatKm(listing.km)} />
                )}
                {listingHasField(listing, "fuel") && listing.fuel && (
                  <SpecItem icon={<Fuel className="size-4" />} label="Gorivo" value={listing.fuel} />
                )}
                {listingHasField(listing, "transmission") && listing.transmission && (
                  <SpecItem icon={<Cog className="size-4" />} label="Mjenjač" value={listing.transmission} />
                )}
                {listingHasField(listing, "bodyType") && listing.bodyType && (
                  <SpecItem label="Karoserija" value={listing.bodyType} />
                )}
                {listingHasField(listing, "drive") && listing.drive && (
                  <SpecItem label="Pogon" value={listing.drive} />
                )}
                {listingHasField(listing, "powerKw") && listing.powerKw > 0 && (
                  <SpecItem label="Snaga" value={formatPower(listing.powerKw)} />
                )}
                {listingHasField(listing, "engineCc") && listing.engineCc > 0 && (
                  <SpecItem label="Obujam" value={`${listing.engineCc} cm³`} />
                )}
                {listingHasField(listing, "color") && listing.color && (
                  <SpecItem label="Boja" value={listing.color} />
                )}
                {/* Tip boje (metalik/mat) pripada uz Boju — Dino 04.08. */}
                {colorTypeItem && (
                  <SpecItem label={colorTypeItem.label} value={colorTypeItem.value} />
                )}
                {listingHasField(listing, "doors") && listing.doors > 0 && (
                  <SpecItem label="Vrata" value={String(listing.doors)} />
                )}
                {listingHasField(listing, "seats") && listing.seats > 0 && (
                  <SpecItem label="Sjedala" value={String(listing.seats)} />
                )}
                {isVehicle(listing) && listing.firstRegistered && (
                  <SpecItem label="Prva registracija" value={listing.firstRegistered} />
                )}
                {isVehicle(listing) && listing.registrationUntil && (
                  <SpecItem label="Registriran do" value={listing.registrationUntil} />
                )}
                {/* Spojene rubrike Karoserija / Osnovno / Motor / Vrata i sjedala /
                    Boja / Stanje vozila — samo ono što gore još nije prikazano. */}
                {extraBasicsRest.map((it) => (
                  <SpecItem key={it.label} label={it.label} value={it.value} />
                ))}
              </dl>
            </section>

            {/* Redoslijed (Dino 04.08.): OSNOVNI PODACI → DOKUMENTI → POVIJEST →
                DODATNE OPCIJE → OPIS. */}
            {dokumentiGroups.map((g) => (
              <section key={g.name}>
                <h2 className="font-display text-2xl mb-4">{g.name}</h2>
                {/* ⚠️ VIN je 17 znakova bez razmaka — u stupcu od ~147 px (mobilni)
                    dodiruje susjedni stupac i duži broj bi ga probio. Dobiva
                    VLASTITI puni red + `break-all`; datumi idu ispod, na mobilnom
                    jedan ispod drugog, od `sm` jedan pored drugog. */}
                <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5">
                  {g.items.map((it) => {
                    const isVin = it.label.toLowerCase().includes("šasije") || it.label.toLowerCase().includes("vin");
                    return (
                      <SpecItem
                        key={it.label}
                        label={it.label}
                        value={it.value}
                        className={isVin ? "sm:col-span-3" : undefined}
                        valueClassName={isVin ? "break-all" : undefined}
                      />
                    );
                  })}
                </dl>
              </section>
            ))}

            {/* Povijest iz sheme + stupci (VIN, servisna, nesreće) u jednoj rubrici. */}
            {(povijestGroups.length > 0 ||
              (isVehicle(listing) &&
                (listing.accidentHistory || listing.serviceHistory || listing.importedFrom || listing.vinMasked))) && (
              <section>
                <h2 className="font-display text-2xl mb-4">Povijest</h2>
                <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5 space-y-5">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                    {listing.accidentHistory && <SpecItem label="Nesreće" value={listing.accidentHistory} />}
                    {listing.serviceHistory && <SpecItem label="Servisna knjižica" value={listing.serviceHistory} />}
                    {listing.importedFrom && <SpecItem label="Uvezen iz" value={listing.importedFrom} />}
                    {listing.vinMasked && <SpecItem label="VIN (skraćeno)" value={listing.vinMasked} />}
                  </dl>
                  {povijestGroups.flatMap((g) => g.items).map((it) => (
                    <OptionBlock key={it.label} label={it.label} value={it.value} />
                  ))}
                </div>
              </section>
            )}

            {/* ⚠️ Dino 04.08.: svaka dodatna opcija u SVOJ red s bullet pointom —
                prije je bio zarezom odvojen blok teksta, nečitko. */}
            {opcijeGroups.length > 0 && (
              <section>
                <h2 className="font-display text-2xl mb-4">Dodatne opcije</h2>
                <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5 space-y-5">
                  {opcijeGroups.flatMap((g) => g.items).map((it) => (
                    <OptionBlock key={it.label} label={it.label} value={it.value} />
                  ))}
                </div>
              </section>
            )}

            <section>
              <h2 className="font-display text-2xl mb-4">Opis</h2>
              <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5 text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-line">
                {listing.description}
              </div>
            </section>

            {/* ⚠️ Dino 04.08.2026: cijela sekcija "Oprema" MAKNUTA s pojedinačnog
                oglasa — ~80 pilula u 7 rubrika, neuredno i nepregledno.
                Ista oprema i dalje postoji u podacima; `featureGroupsFor()` je
                NETAKNUT jer ga koriste kartica / usporedba / moji oglasi / admin.
                Pravilo: na OVOM prikazu ne koristimo pill/badge stavke. */}

            <section className="bg-[var(--color-ink)] text-white rounded-[var(--radius-lg)] p-6">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-md bg-[var(--color-accent)]/20 text-[var(--color-accent)] grid place-items-center shrink-0">
                  <Shield className="size-5" />
                </div>
                <div>
                  <h3 className="font-display text-lg">Prije nego što platiš</h3>
                  <p className="mt-1 text-sm text-white/70 leading-relaxed">
                    {isVehicle(listing)
                      ? "Nikad ne uplaćuj kaparu prije nego što fizički pregledaš vozilo. Provjeri VIN preko HAK servisa i dokumente vozila kod ovlaštenog ispitivača. Ako prodavač odbija susret uživo, prijavi oglas."
                      : "Nikad ne uplaćuj unaprijed prije nego što provjeriš artikl i prodavača. Traži fotografije stvarnog artikla i broj s kataloga, te provjeri odgovara li dio tvojem vozilu. Ako prodavač odbija susret ili pouzeće, prijavi oglas."}
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
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-card)]">
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

            {/* Kredit na filter za traktor od 246 € nema smisla — samo vozila. */}
            {isVehicle(listing) && (
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5 text-sm space-y-2">
              <div className="font-medium text-[var(--color-ink)]">Spremno za izračun</div>
              <p className="text-xs text-[var(--color-muted)] leading-relaxed">
                Mjesečna rata uz 20% predujma i 5 godina otplate približno
                <span className="font-semibold text-[var(--color-ink)]"> {formatPrice(Math.round((listing.priceEur * 0.8) / 60))}</span>/mjesečno.
              </p>
              <Link href="/savjeti/financiranje" className="text-xs text-[var(--color-accent-dark)] hover:underline">
                Izračunaj kredit →
              </Link>
            </div>
            )}
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

/**
 * Rubrika opreme: naslov + svaka stavka u SVOM redu s bullet pointom.
 *
 * ⚠️ Dino 04.08.2026: prije je vrijednost bila jedan zarezom odvojen blok teksta
 * ("ALU felge, Kočioni sustav (ABS), Pomoć pri kočenju…") koji se prelijevao
 * preko pola ekrana i bio nečitak. Bulleti u stupcima daju oku uporište.
 *
 * Vrijednost koja NIJE popis (npr. "6 kom") prikazuje se kao običan redak.
 */
function OptionBlock({ label, value }: { label: string; value: string }) {
  /**
   * ⚠️ Dijeli SAMO zareze izvan zagrada — naziv opcije često sadrži vlastiti
   * zarez: "USB priključak (iPod, HD, …)" se naivnim `split(",")` razbije u tri
   * besmislena retka ("USB priključak (iPod" / "HD" / "…)").
   */
  const items: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of value) {
    if (ch === "(") depth++;
    else if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      if (buf.trim()) items.push(buf.trim());
      buf = "";
    } else buf += ch;
  }
  if (buf.trim()) items.push(buf.trim());
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] mb-2">
        {label}
      </div>
      {items.length > 1 ? (
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-1.5">
          {items.map((it) => (
            <li
              key={it}
              className="text-sm text-[var(--color-ink)] leading-snug flex gap-2"
            >
              <span aria-hidden className="text-[var(--color-accent)] shrink-0">•</span>
              <span>{it}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="font-medium text-[var(--color-ink)]">{value}</div>
      )}
    </div>
  );
}

function SpecItem({
  icon,
  label,
  value,
  className,
  valueClassName,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
  /** Dodatne klase na omotač (npr. `sm:col-span-3` za polje preko punog reda). */
  className?: string;
  /** Dodatne klase na vrijednost (npr. `break-all` za VIN bez razmaka). */
  valueClassName?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] uppercase tracking-wider text-[var(--color-muted)] flex items-center gap-1.5">
        {icon}
        {label}
      </dt>
      <dd className={"mt-1 font-medium text-[var(--color-ink)]" + (valueClassName ? ` ${valueClassName}` : "")}>
        {value}
      </dd>
    </div>
  );
}

