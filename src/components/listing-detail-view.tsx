import { Calendar, Gauge, Fuel, Cog } from "lucide-react";
import { listingHasField, specGroupsFor, isVehicle } from "@/lib/listing-fields";
import { formatKm, formatPower } from "@/lib/utils";
import type { Listing } from "@/lib/types";

/**
 * ListingDetailView — TIJELO oglasa (specifikacije + opis).
 *
 * ⚠️ Dino 04.08.2026: "Pregled oglasa" u objavi mora izgledati 100 % isto kao
 * objavljeni oglas. Prije su to bila DVA odvojena UI-ja koja su se razilazila
 * pri svakoj izmjeni. Sad oba prikaza renderiraju OVU komponentu:
 *   - `/oglasi/[slug]` hrani je zapisom iz baze
 *   - korak 6 u `/objavi` hrani je nacrtom iz forme (`Listing`-oblik)
 *
 * Sadrži samo ono što je zajedničko. NIJE ovdje: galerija, cijena/kontakt panel,
 * kredit-kalkulator, "Prije nego što platiš" i slični oglasi — to su dijelovi
 * stranice koji trebaju bazu ili nemaju smisla u pregledu.
 *
 * Izvor istine za polja je `src/lib/listing-fields.ts` (poštuje `scope`).
 * Pravilo prikaza: uredni redci oznaka/vrijednost, BEZ pill/badge elemenata.
 */
export function ListingDetailView({ listing }: { listing: Listing }) {
  const specGroups = specGroupsFor(listing);

  // Rubrike Karoserija / Osnovno / Motor / Vrata i sjedala / Boja spajaju se u
  // "Osnovne podatke"; "Stanje vozila" je zasebna sekcija ispod Dokumenata.
  const MERGE_INTO_BASIC = new Set([
    "Karoserija", "Osnovno", "Motor", "Vrata i sjedala", "Boja",
  ]);
  // Duplikat se prepoznaje po VRIJEDNOSTI, ne po oznaci — hardkodirana sekcija
  // kaže "Karoserija: Hatchback", a shema "Oblik karoserije: Hatchback".
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
        if (shownValues.has(it.value)) continue;
        if (extraBasics.some((e) => e.value === it.value)) continue;
        extraBasics.push(it);
      }
    } else {
      otherGroups.push(g);
    }
  }
  // "Tip boje" pripada uz "Boju" — inače završi na kraju rubrike.
  const colorTypeItem = extraBasics.find((e) => e.label === "Tip boje");
  const extraBasicsRest = extraBasics.filter((e) => e !== colorTypeItem);

  const povijestGroups = otherGroups.filter((g) => g.name === "Povijest");
  const dokumentiGroups = otherGroups.filter((g) => g.name === "Dokumenti");
  const stanjeGroups = otherGroups.filter((g) => g.name === "Stanje vozila");
  const opcijeGroups = otherGroups.filter(
    (g) => g.name !== "Povijest" && g.name !== "Dokumenti" && g.name !== "Stanje vozila",
  );

  return (
    <>
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
          {extraBasicsRest.map((it) => (
            <SpecItem key={it.label} label={it.label} value={it.value} />
          ))}
        </dl>
      </section>

      {/* Redoslijed: OSNOVNI PODACI → DOKUMENTI → STANJE VOZILA → POVIJEST →
          DODATNE OPCIJE → OPIS. */}
      {dokumentiGroups.map((g) => (
        <section key={g.name}>
          <h2 className="font-display text-2xl mb-4">{g.name}</h2>
          {/* VIN je 17 znakova bez razmaka → vlastiti puni red + `break-all`. */}
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

      {stanjeGroups.map((g) => (
        <section key={g.name}>
          <h2 className="font-display text-2xl mb-4">{g.name}</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-4 bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5">
            {g.items.map((it) => (
              <SpecItem key={it.label} label={it.label} value={it.value} />
            ))}
          </dl>
        </section>
      ))}

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

      {/* Svaka dodatna opcija u SVOJ red s bullet pointom. */}
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

      {listing.description && (
        <section>
          <h2 className="font-display text-2xl mb-4">Opis</h2>
          <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow-flat)] p-5 text-[var(--color-ink-soft)] leading-relaxed whitespace-pre-line">
            {listing.description}
          </div>
        </section>
      )}
    </>
  );
}

/**
 * Rubrika opreme: naslov + svaka stavka u SVOM redu s bullet pointom.
 *
 * ⚠️ Dijeli SAMO zareze izvan zagrada — naziv opcije često sadrži vlastiti
 * zarez: "USB priključak (iPod, HD, …)" bi se naivnim `split(",")` razbio
 * u tri besmislena retka.
 */
export function OptionBlock({ label, value }: { label: string; value: string }) {
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
            <li key={it} className="text-sm text-[var(--color-ink)] leading-snug flex gap-2">
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

export function SpecItem({
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
