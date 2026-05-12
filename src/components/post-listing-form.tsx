"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Check, ChevronLeft, ChevronRight, Upload, X, Sparkles } from "lucide-react";
import { Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MAKES, getMake } from "@/data/makes";
import { HR_LOCATIONS, COUNTIES } from "@/data/locations";
import { FEATURE_CATEGORIES } from "@/data/features";
import {
  FUEL_TYPES,
  TRANSMISSIONS,
  BODY_TYPES,
  DRIVES,
  COLORS,
  CONDITIONS,
} from "@/lib/types";
import { formatPrice, formatKm } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Osnovno", subtitle: "Marka, model, godina" },
  { id: 2, title: "Tehnički", subtitle: "Specifikacije i oprema" },
  { id: 3, title: "Fotografije", subtitle: "Slike vozila" },
  { id: 4, title: "Cijena i opis", subtitle: "Detalji oglasa" },
  { id: 5, title: "Pregled", subtitle: "Provjera i objava" },
];

type State = {
  make: string;
  model: string;
  variant: string;
  year: string;
  condition: string;
  fuel: string;
  transmission: string;
  bodyType: string;
  drive: string;
  color: string;
  km: string;
  engineCc: string;
  powerKw: string;
  doors: string;
  seats: string;
  features: string[];
  photos: string[];
  priceEur: string;
  description: string;
  county: string;
  city: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
};

const empty: State = {
  make: "", model: "", variant: "", year: "", condition: "Rabljeno",
  fuel: "", transmission: "", bodyType: "", drive: "", color: "",
  km: "", engineCc: "", powerKw: "", doors: "5", seats: "5",
  features: [], photos: [],
  priceEur: "", description: "",
  county: "", city: "",
  firstName: "", lastName: "", phone: "", email: "",
};

export function PostListingForm() {
  const [step, setStep] = useState(1);
  const [s, setS] = useState<State>(empty);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof State>(k: K, v: State[K]) => setS((p) => ({ ...p, [k]: v }));
  const toggleFeature = (f: string) => set("features", s.features.includes(f) ? s.features.filter((x) => x !== f) : [...s.features, f]);

  const makeObj = s.make ? getMake(s.make) : undefined;
  const cities = useMemo(() => {
    const loc = HR_LOCATIONS.find((l) => l.county === s.county);
    return loc?.cities ?? [];
  }, [s.county]);

  const stepValid = useMemo(() => {
    if (step === 1) return !!(s.make && s.model && s.year && s.condition);
    if (step === 2) return !!(s.fuel && s.transmission && s.bodyType && s.drive && s.color && s.km && s.powerKw);
    if (step === 3) return s.photos.length >= 1;
    if (step === 4) return !!(s.priceEur && s.description.length >= 30 && s.county && s.city && s.firstName && s.phone);
    return true;
  }, [step, s]);

  if (submitted) {
    return (
      <div className="mt-10 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-10 text-center">
        <div className="size-16 rounded-full bg-[var(--color-success)]/15 text-[var(--color-success)] grid place-items-center mx-auto">
          <Check className="size-7" />
        </div>
        <h2 className="font-display text-2xl mt-5">Oglas je objavljen</h2>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)] max-w-md mx-auto">
          Tvoj oglas ide na pregled. Dobit ćeš e-mail kad bude objavljen — obično unutar 30 minuta radnim danom.
        </p>
        <div className="mt-6 flex gap-3 justify-center">
          <Button asChild variant="outline">
            <a href="/moj-racun/oglasi">Moji oglasi</a>
          </Button>
          <Button asChild variant="primary">
            <a href="/oglasi">Pregledaj oglase</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <ol className="mt-8 grid grid-cols-5 gap-2">
        {STEPS.map((st) => {
          const done = st.id < step;
          const active = st.id === step;
          return (
            <li key={st.id} className="flex flex-col items-center text-center gap-1.5">
              <div
                className={
                  "size-9 rounded-full grid place-items-center text-xs font-semibold border-2 transition-all " +
                  (active
                    ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]"
                    : done
                    ? "bg-[var(--color-success)] text-white border-[var(--color-success)]"
                    : "bg-[var(--color-surface)] text-[var(--color-muted)] border-[var(--color-line)]")
                }
              >
                {done ? <Check className="size-4" /> : st.id}
              </div>
              <div className="hidden sm:block">
                <div className={"text-xs font-medium " + (active ? "text-[var(--color-ink)]" : "text-[var(--color-muted)]")}>
                  {st.title}
                </div>
                <div className="text-[10px] text-[var(--color-muted)] hidden md:block">{st.subtitle}</div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-2 h-1 bg-[var(--color-line)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-accent)] transition-all duration-300"
          style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
        />
      </div>

      <div className="mt-8 bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)] p-6 md:p-8 animate-fade-in" key={step}>
        {step === 1 && (
          <div className="space-y-5">
            <FormHeader title="Osnovni podaci" desc="Što prodaješ?" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Marka">
                <Select value={s.make} onChange={(e) => { set("make", e.target.value); set("model", ""); }}>
                  <option value="">Odaberi marku</option>
                  {MAKES.map((m) => <option key={m.slug} value={m.slug}>{m.name}</option>)}
                </Select>
              </Field>
              <Field label="Model">
                <Select value={s.model} onChange={(e) => set("model", e.target.value)} disabled={!makeObj}>
                  <option value="">{makeObj ? "Odaberi model" : "Prvo odaberi marku"}</option>
                  {makeObj?.models.map((m) => <option key={m} value={m}>{m}</option>)}
                </Select>
              </Field>
              <Field label="Izvedba (opcionalno)">
                <Input value={s.variant} onChange={(e) => set("variant", e.target.value)} placeholder="npr. 2.0 TDI Style DSG" />
              </Field>
              <Field label="Godina proizvodnje">
                <Select value={s.year} onChange={(e) => set("year", e.target.value)}>
                  <option value="">Odaberi godinu</option>
                  {Array.from({ length: 37 }, (_, i) => 2026 - i).map((y) => <option key={y} value={y}>{y}.</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Stanje">
              <div className="grid grid-cols-3 gap-2">
                {CONDITIONS.map((c) => (
                  <button
                    type="button"
                    key={c}
                    onClick={() => set("condition", c)}
                    className={"h-11 rounded-md border text-sm transition-all " + (s.condition === c ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]" : "border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <FormHeader title="Tehnički podaci" desc="Što imaš pod haubom?" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Gorivo">
                <Select value={s.fuel} onChange={(e) => set("fuel", e.target.value)}>
                  <option value="">Odaberi</option>
                  {FUEL_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </Field>
              <Field label="Mjenjač">
                <Select value={s.transmission} onChange={(e) => set("transmission", e.target.value)}>
                  <option value="">Odaberi</option>
                  {TRANSMISSIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </Field>
              <Field label="Karoserija">
                <Select value={s.bodyType} onChange={(e) => set("bodyType", e.target.value)}>
                  <option value="">Odaberi</option>
                  {BODY_TYPES.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </Field>
              <Field label="Pogon">
                <Select value={s.drive} onChange={(e) => set("drive", e.target.value)}>
                  <option value="">Odaberi</option>
                  {DRIVES.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </Field>
              <Field label="Boja">
                <Select value={s.color} onChange={(e) => set("color", e.target.value)}>
                  <option value="">Odaberi</option>
                  {COLORS.map((f) => <option key={f} value={f}>{f}</option>)}
                </Select>
              </Field>
              <Field label="Kilometraža (km)">
                <Input type="number" inputMode="numeric" value={s.km} onChange={(e) => set("km", e.target.value)} placeholder="npr. 95000" />
              </Field>
              <Field label="Obujam motora (cm³)">
                <Input type="number" inputMode="numeric" value={s.engineCc} onChange={(e) => set("engineCc", e.target.value)} placeholder="npr. 1968" />
              </Field>
              <Field label="Snaga (kW)">
                <Input type="number" inputMode="numeric" value={s.powerKw} onChange={(e) => set("powerKw", e.target.value)} placeholder="npr. 110" />
              </Field>
              <Field label="Broj vrata">
                <Select value={s.doors} onChange={(e) => set("doors", e.target.value)}>
                  {[2, 3, 4, 5].map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </Field>
              <Field label="Broj sjedala">
                <Select value={s.seats} onChange={(e) => set("seats", e.target.value)}>
                  {[2, 4, 5, 6, 7, 8, 9].map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </Field>
            </div>

            <div>
              <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-3">
                Oprema ({s.features.length} odabrano)
              </div>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1 scrollbar-thin">
                {FEATURE_CATEGORIES.map((cat) => (
                  <div key={cat.name}>
                    <div className="text-xs font-medium text-[var(--color-ink-soft)] mb-2">{cat.name}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.items.map((it) => {
                        const active = s.features.includes(it);
                        return (
                          <button
                            type="button"
                            key={it}
                            onClick={() => toggleFeature(it)}
                            className={"text-xs px-2.5 py-1.5 rounded-full border transition-all " + (active ? "bg-[var(--color-ink)] text-white border-[var(--color-ink)]" : "bg-transparent text-[var(--color-ink-soft)] border-[var(--color-line)] hover:border-[var(--color-ink-soft)]")}
                          >
                            {it}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <FormHeader title="Fotografije" desc="Prva slika je naslovna - odaberi najljepši kut" />
            <PhotoUploader photos={s.photos} onChange={(p) => set("photos", p)} />
            <div className="text-xs text-[var(--color-muted)] bg-[var(--color-bg)] rounded-md p-3 leading-relaxed">
              <strong className="text-[var(--color-ink)]">Savjet:</strong> kvalitetne fotografije pri dnevnom svjetlu povećavaju šansu prodaje. Slikaj iz svih kutova - prednja strana, bok, stražnja, interijer, prtljažnik, kotači. Izbjegavaj filtere.
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <FormHeader title="Cijena, opis i kontakt" desc="Što kupac mora znati?" />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Cijena (€)">
                <Input type="number" inputMode="numeric" value={s.priceEur} onChange={(e) => set("priceEur", e.target.value)} placeholder="npr. 15900" />
              </Field>
              <div className="self-end">
                <div className="text-xs text-[var(--color-muted)] leading-relaxed">
                  Provjeri cijene sličnih vozila prije objave. Realna cijena = brža prodaja.
                </div>
              </div>
            </div>
            <Field label={`Opis (${s.description.length}/2000)`}>
              <Textarea
                value={s.description}
                onChange={(e) => set("description", e.target.value.slice(0, 2000))}
                placeholder="Stanje vozila, povijest servisiranja, što je novo zamijenjeno, da li je iz prvog vlasništva, garažirano, registracija..."
                className="min-h-[160px]"
              />
              {s.description.length < 30 && (
                <div className="text-xs text-[var(--color-muted)] mt-1">Minimalno 30 znakova</div>
              )}
            </Field>

            <div className="border-t border-[var(--color-line)] pt-5">
              <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-3">Lokacija</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Županija">
                  <Select value={s.county} onChange={(e) => { set("county", e.target.value); set("city", ""); }}>
                    <option value="">Odaberi županiju</option>
                    {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>
                <Field label="Grad">
                  <Select value={s.city} onChange={(e) => set("city", e.target.value)} disabled={!s.county}>
                    <option value="">{s.county ? "Odaberi grad" : "Prvo odaberi županiju"}</option>
                    {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                  </Select>
                </Field>
              </div>
            </div>

            <div className="border-t border-[var(--color-line)] pt-5">
              <div className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)] mb-3">Tvoji kontakt podaci</div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Ime">
                  <Input value={s.firstName} onChange={(e) => set("firstName", e.target.value)} />
                </Field>
                <Field label="Prezime">
                  <Input value={s.lastName} onChange={(e) => set("lastName", e.target.value)} />
                </Field>
                <Field label="Telefon">
                  <Input type="tel" value={s.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+385 91 234 5678" />
                </Field>
                <Field label="E-mail">
                  <Input type="email" value={s.email} onChange={(e) => set("email", e.target.value)} placeholder="ime@primjer.hr" />
                </Field>
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-5">
            <FormHeader title="Pregled prije objave" desc="Provjeri sve podatke" icon={<Sparkles className="size-5" />} />
            <ReviewPreview state={s} />
            <div className="bg-[var(--color-accent)]/10 border border-[var(--color-accent)]/30 rounded-md p-4 text-sm">
              <div className="font-medium text-[var(--color-ink)] mb-1">Prvi oglas — besplatno</div>
              <p className="text-[var(--color-ink-soft)] text-xs leading-relaxed">
                Ova objava se ne naplaćuje. Sljedeći oglasi iz tvog računa naplaćuju se prema cjeniku (od 4,90 €).
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-3 pt-6 border-t border-[var(--color-line)]">
          <Button
            variant="ghost"
            onClick={() => setStep((p) => Math.max(1, p - 1))}
            disabled={step === 1}
          >
            <ChevronLeft className="size-4" />
            Natrag
          </Button>

          {step < STEPS.length ? (
            <Button variant="primary" onClick={() => setStep((p) => p + 1)} disabled={!stepValid}>
              Nastavi
              <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button variant="accent" size="lg" onClick={() => setSubmitted(true)}>
              <Check className="size-4" />
              Objavi oglas
            </Button>
          )}
        </div>
      </div>
    </>
  );
}

function FormHeader({ title, desc, icon }: { title: string; desc: string; icon?: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-2xl flex items-center gap-2">
        {icon}
        {title}
      </h2>
      <p className="text-sm text-[var(--color-muted)] mt-0.5">{desc}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest font-semibold text-[var(--color-muted)]">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function PhotoUploader({ photos, onChange }: { photos: string[]; onChange: (p: string[]) => void }) {
  const [busy, setBusy] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setBusy(true);
    const remaining = Math.max(0, 10 - photos.length);
    const arr = Array.from(files).slice(0, remaining);
    let done = 0;
    const next = [...photos];
    arr.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") next.push(reader.result);
        done++;
        if (done === arr.length) {
          onChange(next);
          setBusy(false);
        }
      };
      reader.onerror = () => {
        done++;
        if (done === arr.length) {
          onChange(next);
          setBusy(false);
        }
      };
      reader.readAsDataURL(file);
    });
    if (arr.length === 0) setBusy(false);
  };

  const removeAt = (i: number) => onChange(photos.filter((_, idx) => idx !== i));

  return (
    <div>
      <label className="block border-2 border-dashed border-[var(--color-line)] hover:border-[var(--color-accent)] rounded-[var(--radius-lg)] p-8 text-center cursor-pointer transition-colors bg-[var(--color-bg)]">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
          disabled={photos.length >= 10}
        />
        <Upload className="size-8 mx-auto text-[var(--color-muted)]" />
        <div className="mt-3 font-medium">
          {photos.length >= 10 ? "Maksimalno 10 fotografija" : "Klikni za upload ili povuci datoteke"}
        </div>
        <div className="text-xs text-[var(--color-muted)] mt-1">
          {photos.length}/10 · JPG, PNG, WebP · max 10 MB svaka
        </div>
        {busy && <Badge variant="outline" className="mt-3 animate-pulse">Obrada...</Badge>}
      </label>

      {photos.length > 0 && (
        <div className="mt-4 grid grid-cols-3 sm:grid-cols-5 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative aspect-[4/3] rounded-md overflow-hidden bg-[var(--color-line)] group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p} alt="" className="w-full h-full object-cover" />
              {i === 0 && (
                <Badge variant="accent" className="absolute top-1 left-1 text-[10px] px-1.5 py-0">
                  Naslovna
                </Badge>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 size-6 rounded-full bg-black/70 text-white grid place-items-center hover:bg-[var(--color-danger)] transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Ukloni fotografiju"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewPreview({ state: s }: { state: State }) {
  const price = s.priceEur ? formatPrice(Number(s.priceEur)) : "—";
  const km = s.km ? formatKm(Number(s.km)) : "—";
  const make = s.make ? getMake(s.make)?.name ?? s.make : "—";

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-line)] overflow-hidden">
      {s.photos[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={s.photos[0]} alt="" className="w-full aspect-[16/9] object-cover" />
      )}
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-display text-2xl">
            {make} {s.model} {s.variant && <span className="italic text-[var(--color-ink-soft)] font-normal">{s.variant}</span>}
          </h3>
          <p className="text-sm text-[var(--color-muted)]">{s.year && `${s.year}. · `}{s.city || "—"}, {s.county || "—"}</p>
        </div>
        <div className="font-display text-3xl">{price}</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 text-xs pt-3 border-t border-[var(--color-line)]">
          <Spec k="Kilometraža" v={km} />
          <Spec k="Gorivo" v={s.fuel || "—"} />
          <Spec k="Mjenjač" v={s.transmission || "—"} />
          <Spec k="Karoserija" v={s.bodyType || "—"} />
          <Spec k="Pogon" v={s.drive || "—"} />
          <Spec k="Snaga" v={s.powerKw ? `${s.powerKw} kW` : "—"} />
        </div>
        {s.description && (
          <p className="text-sm text-[var(--color-ink-soft)] pt-3 border-t border-[var(--color-line)] line-clamp-4">
            {s.description}
          </p>
        )}
        {s.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-3 border-t border-[var(--color-line)]">
            {s.features.slice(0, 8).map((f) => <Badge key={f} variant="neutral">{f}</Badge>)}
            {s.features.length > 8 && <Badge variant="outline">+ {s.features.length - 8}</Badge>}
          </div>
        )}
      </div>
    </div>
  );
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}
