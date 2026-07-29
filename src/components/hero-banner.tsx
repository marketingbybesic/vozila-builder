import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Karlo 29.07: reklamni banner ispod pretrage i trgovaca.
 * Desktop: pun raspon hero-a, nizak profil (16:9 se drži preko aspect-ratio,
 * ali je ograničen visinom da hero i dalje stane u jedan ekran).
 * Mobitel: na kraju sekcije, pun 16:9.
 *
 * Grafika je CSS/SVG, bez vanjskih slika — stock URL-ovi znaju vratiti 404
 * (već se dogodilo s 8 Unsplash slika), a banner mora uvijek raditi.
 */
export function HeroBanner() {
  return (
    <Link
      href="/oglasi?category=dijelovi&subcategory=gume"
      className="group relative block w-full overflow-hidden rounded-[var(--radius-lg)] border border-white/10 shadow-xl
                 aspect-[16/9] lg:aspect-auto lg:h-[112px]"
      aria-label="Akcija na gume — do 40% popusta u Gumi Centru"
    >
      {/* Podloga: tamni gradijent + suptilni uzorak protektora */}
      <div className="absolute inset-0 bg-[linear-gradient(105deg,#0A1628_0%,#132844_55%,#1B3A63_100%)]" />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, #fff 0 3px, transparent 3px 13px)",
        }}
      />
      {/* Topli odsjaj iza gume — u cijelosti unutar okvira. `overflow-hidden`
          na roditelju ga ionako reže, ali ovako ne izlazi ni geometrijski. */}
      <div
        aria-hidden
        className="absolute right-0 top-1/2 -translate-y-1/2 size-[220px] rounded-full blur-3xl
                   bg-[var(--color-accent)]/25 lg:size-[180px]"
      />

      <div className="relative h-full flex items-center justify-between gap-4 px-5 sm:px-7 lg:px-8">
        {/* Tekst */}
        <div className="min-w-0">
          <span className="inline-flex items-center rounded-full bg-[var(--color-accent)] px-2.5 py-0.5
                           text-[10px] sm:text-[11px] font-bold uppercase tracking-widest text-[var(--color-ink)]">
            Akcija · do 30. 9.
          </span>

          <p className="mt-2 font-display text-white leading-[1.05]
                        text-[clamp(1.35rem,4.2vw,2.15rem)] lg:text-[1.7rem]">
            Gume do <span className="text-[var(--color-accent)]">−40 %</span>
          </p>

          <p className="mt-1 text-white/70 text-[11px] sm:text-xs lg:text-[11px] truncate">
            Ljetne i zimske · montaža i balansiranje gratis · Gumi Centar Zagreb
          </p>

          <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-[var(--radius-md)]
                           bg-white px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-[var(--color-ink)]
                           transition-transform group-hover:translate-x-0.5">
            Pogledaj ponudu
            <ArrowRight className="size-3.5" />
          </span>
        </div>

        {/* Guma — čisti CSS, bez vanjskih resursa */}
        <div aria-hidden className="relative shrink-0">
          <div className="relative grid place-items-center rounded-full bg-[#111820] shadow-2xl
                          size-[110px] sm:size-[150px] lg:size-[84px]
                          ring-[7px] sm:ring-[10px] lg:ring-[6px] ring-[#0c1118]">
            {/* protektor */}
            <div
              className="absolute inset-0 rounded-full opacity-70"
              style={{
                background:
                  "repeating-conic-gradient(from 0deg, #23303d 0deg 7deg, #131b24 7deg 14deg)",
              }}
            />
            {/* naplatak */}
            <div className="relative grid place-items-center rounded-full bg-[linear-gradient(140deg,#e9edf2,#9aa6b4)]
                            size-[56px] sm:size-[76px] lg:size-[44px]">
              <div className="rounded-full bg-[var(--color-ink)] size-[16px] sm:size-[22px] lg:size-[12px]" />
            </div>
          </div>
          {/* postotak */}
          <div className="absolute -left-2 -top-1 rounded-full bg-[var(--color-accent)] px-2 py-1
                          text-[11px] sm:text-sm lg:text-[11px] font-extrabold text-[var(--color-ink)] shadow-lg">
            −40%
          </div>
        </div>
      </div>
    </Link>
  );
}
