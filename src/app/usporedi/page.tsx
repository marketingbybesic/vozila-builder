import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { db } from "@/db";
import { formatPrice, formatKm, formatPower } from "@/lib/utils";
import { listingHasField, specGroupsFor } from "@/lib/listing-fields";
import type { Listing } from "@/lib/types";

export const metadata: Metadata = {
  title: "Usporedba vozila",
  description: "Usporedi do četiri automobila bok uz bok — cijena, kilometri, snaga, oprema.",
};

const SLOTS = ["a", "b", "c", "d"] as const;

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const slugs: string[] = SLOTS.map((k) => {
    const v = sp[k];
    return typeof v === "string" ? v : "";
  }).filter(Boolean);

  const items = (
    await Promise.all(slugs.map((s) => db().getListingBySlug(s)))
  ).filter((l): l is Listing => !!l);

  if (items.length === 0) {
    return (
      <Container className="py-16 text-center">
        <h1 className="font-display text-3xl tracking-tight">Usporedba vozila</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)] max-w-md mx-auto">
          Klikni &quot;Usporedi&quot; ikonu na karticama oglasa da dodaš auto u
          usporedbu. Možeš birati 2 do 4 vozila.
        </p>
        <Link
          href="/oglasi"
          className="mt-6 inline-flex h-11 px-5 rounded-md bg-[var(--color-ink)] text-white text-sm font-medium"
        >
          Pretraži oglase
        </Link>
      </Container>
    );
  }

  // Karlo 31.07: tablica je prikazivala SVE auto-retke za sve oglase, pa je
  // usporedba filtera za traktor imala "Karoserija / Vrata / Sjedala".
  // `key` veže redak uz polje sheme — redak se prikazuje samo ako ga barem
  // jedan uspoređivani oglas stvarno ima (lib/listing-fields.ts).
  type Row = { label: string; key?: string; render: (l: Listing) => React.ReactNode };
  const allRows: Row[] = [
    { label: "Cijena", render: (l) => <span className="font-display text-lg">{formatPrice(l.priceEur)}</span> },
    { label: "Godina", render: (l) => `${l.year}.` },
    { label: "Kilometri", key: "km", render: (l) => formatKm(l.km) },
    { label: "Snaga", key: "powerKw", render: (l) => formatPower(l.powerKw) },
    { label: "Gorivo", key: "fuel", render: (l) => l.fuel },
    { label: "Mjenjač", key: "transmission", render: (l) => l.transmission },
    { label: "Pogon", key: "drive", render: (l) => l.drive },
    { label: "Karoserija", key: "bodyType", render: (l) => l.bodyType },
    { label: "Boja", key: "color", render: (l) => l.color },
    { label: "Vrata", key: "doors", render: (l) => l.doors },
    { label: "Sjedala", key: "seats", render: (l) => l.seats },
    { label: "Lokacija", render: (l) => `${l.city}, ${l.county}` },
    { label: "Stanje", render: (l) => l.condition },
    { label: "Prodavač", render: (l) => l.sellerName },
    {
      label: "Oprema",
      render: (l) => (
        <div className="flex flex-wrap gap-1">
          {l.features.slice(0, 8).map((f) => (
            <Badge key={f} variant="neutral">{f}</Badge>
          ))}
          {l.features.length > 8 && (
            <span className="text-[10px] text-[var(--color-muted)] self-center">
              +{l.features.length - 8}
            </span>
          )}
        </div>
      ),
    },
  ];

  // Redak bez `key` je univerzalan (cijena, lokacija, prodavač). Redak s `key`
  // ostaje samo ako ga barem jedan uspoređivani oglas stvarno ima.
  const baseRows = allRows.filter(
    (r) => !r.key || items.some((l) => listingHasField(l, r.key!))
  );

  /**
   * ⚠️ Karlo 13.08.2026 (st. 2): "kod usporedbe stavi rubrike sve kao što je na
   * oglasu da bude usporedba potpuna". Gore je bilo 15 FIKSNIH redaka, dok
   * detaljna stranica gradi rubrike iz sheme (`specGroupsFor`), pa su nedostajali
   * Stanje vozila, Povijest, Dodatne opcije i svi atributi po kategoriji
   * (nosivost viličara, širina gume, broj ležišta kampera…).
   * Sad se dodaju SVE rubrike koje uspoređivani oglasi stvarno imaju — isti
   * izvor kao detalj, pa se usporedba i oglas ne mogu razići.
   */
  // ⚠️ Shema ista polja imenuje drukčije nego fiksni redci gore ("Oblik
  // karoserije" = "Karoserija", "Boja vozila" = "Boja"). Bez ovoga se rubrika
  // pojavi DVAPUT i Karlu to izgleda kao greška.
  const ISTO: Record<string, string> = {
    "oblik karoserije": "karoserija",
    "boja vozila": "boja",
    "obujam motora": "obujam",
    "snaga motora": "snaga",
    "prijeđeni kilometri": "kilometri",
    "godina proizvodnje": "godina",
  };
  const kanon = (s: string) => ISTO[s.toLowerCase()] ?? s.toLowerCase();
  const seen = new Set(baseRows.map((r) => kanon(r.label)));
  const specRows: Row[] = [];
  for (const l of items) {
    for (const grupa of specGroupsFor(l)) {
      for (const it of grupa.items) {
        const k = kanon(it.label);
        if (seen.has(k)) continue;
        seen.add(k);
        specRows.push({
          label: it.label,
          render: (x: Listing) =>
            specGroupsFor(x)
              .flatMap((g) => g.items)
              .find((y) => y.label === it.label)?.value ?? "—",
        });
      }
    }
  }
  const rows = [...baseRows, ...specRows];

  return (
    <Container className="py-8 md:py-12">
      <header className="mb-6">
        <h1 className="font-display text-3xl md:text-4xl tracking-tight">Usporedba</h1>
        <p className="text-sm text-[var(--color-muted)] mt-1">
          {items.length} {items.length === 1 ? "vozilo" : "vozila"} bok uz bok
        </p>
      </header>

      <div className="overflow-x-auto -mx-4 md:mx-0">
        <table className="min-w-full text-sm border-collapse">
          <thead>
            <tr>
              <th className="px-3 py-2 sticky left-0 bg-[var(--color-bg)]"></th>
              {items.map((l) => (
                <th
                  key={l.id}
                  className="px-3 py-2 align-bottom text-left min-w-[200px] font-normal"
                >
                  <div className="relative aspect-[4/3] rounded-md overflow-hidden bg-[var(--color-line)] mb-2">
                    <Image
                      src={l.images[0]}
                      alt={l.title}
                      fill
                      sizes="200px"
                      /* ⚠️ Karlo 13.08.2026 (st. 1): cijelo vozilo mora stati u
                         okvir — `object-cover` je rezao rubove (isti popravak
                         kao na detaljnoj 09.08.). */
                      className="object-contain"
                    />
                  </div>
                  <Link
                    href={`/oglasi/${l.slug}`}
                    className="font-medium hover:text-[var(--color-accent-dark)] block"
                  >
                    {l.make} {l.model}
                  </Link>
                  {l.variant && (
                    <div className="text-xs text-[var(--color-muted)] italic">{l.variant}</div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={row.label}
                className={
                  i % 2 === 0
                    ? "bg-[var(--color-surface)]"
                    : ""
                }
              >
                <td className="px-3 py-3 text-xs uppercase tracking-wider font-semibold text-[var(--color-muted)] sticky left-0 bg-inherit min-w-[120px]">
                  {row.label}
                </td>
                {items.map((l) => (
                  <td key={l.id} className="px-3 py-3 align-top">
                    {row.render(l)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Container>
  );
}
