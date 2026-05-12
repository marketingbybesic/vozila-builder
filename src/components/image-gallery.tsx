"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  const prev = () => setActive((a) => (a === 0 ? images.length - 1 : a - 1));
  const next = () => setActive((a) => (a === images.length - 1 ? 0 : a + 1));

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setLightbox(true)}
          className="relative block w-full aspect-[16/10] bg-[var(--color-line)] rounded-[var(--radius-lg)] overflow-hidden group"
          aria-label="Otvori sliku u punoj veličini"
        >
          <Image
            src={images[active]}
            alt={alt}
            fill
            sizes="(max-width: 1024px) 100vw, 60vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.01]"
            priority
          />
          <span className="absolute bottom-3 right-3 text-xs bg-black/60 text-white px-2 py-1 rounded">
            {active + 1} / {images.length}
          </span>
        </button>
        {images.length > 1 && (
          <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
            {images.map((img, i) => (
              <button
                key={`${img}-${i}`}
                type="button"
                onClick={() => setActive(i)}
                className={
                  "relative aspect-[4/3] rounded-md overflow-hidden bg-[var(--color-line)] transition-all " +
                  (i === active
                    ? "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-bg)]"
                    : "opacity-70 hover:opacity-100")
                }
                aria-label={`Slika ${i + 1}`}
              >
                <Image src={img} alt="" fill sizes="120px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 grid place-items-center animate-fade-in"
          onClick={() => setLightbox(false)}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
            aria-label="Zatvori"
            className="absolute top-4 right-4 size-11 rounded-full bg-white/10 text-white hover:bg-white/20 grid place-items-center"
          >
            <X className="size-5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); prev(); }}
            aria-label="Prethodna"
            className="absolute left-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/10 text-white hover:bg-white/20 grid place-items-center"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); next(); }}
            aria-label="Sljedeća"
            className="absolute right-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/10 text-white hover:bg-white/20 grid place-items-center"
          >
            <ChevronRight className="size-5" />
          </button>
          <div className="relative w-full h-full max-w-6xl max-h-[85vh] mx-4">
            <Image
              src={images[active]}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain"
            />
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {active + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
