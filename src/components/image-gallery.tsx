"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export function ImageGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const many = images.length > 1;

  const prev = useCallback(
    () => setActive((a) => (a === 0 ? images.length - 1 : a - 1)),
    [images.length],
  );
  const next = useCallback(
    () => setActive((a) => (a === images.length - 1 ? 0 : a + 1)),
    [images.length],
  );

  /**
   * Tipkovnica u lightboxu: ←/→ listaju, Esc zatvara.
   * ⚠️ Prije NIJE postojala — jedini način navigacije bili su gumbi mišem.
   */
  /**
   * Strelice se kratko pokažu pri otvaranju lightboxa, pa nestanu (Dino 04.08.).
   * Bez toga korisnik ne zna da su bočne polovice slike klikabilne.
   *
   * ⚠️ SAMO DESKTOP (`hover: hover` + `pointer: fine`) — na dodir hovera nema,
   * pa bi strelice ostale zauvijek preko slike. Detekcija ide po vrsti
   * pokazivača, ne po širini ekrana (tablet s mišem nije "mobitel").
   */
  const [hint, setHint] = useState(false);
  useEffect(() => {
    if (!lightbox || !many) return;
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine) return;
    setHint(true);
    const t = setTimeout(() => setHint(false), 2500);
    return () => { clearTimeout(t); setHint(false); };
  }, [lightbox, many]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      else if (e.key === "ArrowLeft" && many) prev();
      else if (e.key === "ArrowRight" && many) next();
    };
    window.addEventListener("keydown", onKey);
    // Pozadina se ne smije skrolati dok je lightbox otvoren.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightbox, many, prev, next]);

  /**
   * Swipe na dodir — native touch eventi, bez nove biblioteke.
   * Prag 50 px vodoravno + zahtjev da je gesta pretežno vodoravna, inače bi
   * okomiti scroll ili običan tap slučajno prebacili sliku.
   */
  const touch = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.changedTouches[0];
    touch.current = { x: t.clientX, y: t.clientY };
    swiped.current = false;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current || !many) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.current.x;
    const dy = t.clientY - touch.current.y;
    touch.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) <= Math.abs(dy)) return;
    swiped.current = true;
    if (dx > 0) prev();
    else next();
  };
  /**
   * ⚠️ Glavna slika je `<button>` koji otvara lightbox — swipe po njoj bi ga
   * inače otvorio na kraju geste. Otvaramo samo ako swipe NIJE prepoznat.
   */
  const openLightbox = () => {
    if (swiped.current) { swiped.current = false; return; }
    setLightbox(true);
  };

  return (
    <>
      <div className="space-y-3">
        <button
          type="button"
          onClick={openLightbox}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
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
          {/* ⚠️ Klik-zone su UNUTAR slike (Dino 04.08.), ne na rubu ekrana:
              lijeva polovica = prethodna, desna = sljedeća. Strelica se pojavi
              na hover (fade-in). `stopPropagation` je nužan — bez njega klik
              propada na pozadinu koja zatvara lightbox. */}
          <div
            className="relative w-full h-full max-w-6xl max-h-[85vh] mx-4"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <Image
              src={images[active]}
              alt={alt}
              fill
              sizes="100vw"
              className="object-contain select-none"
              draggable={false}
            />
            {many && (
              <>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); prev(); }}
                  aria-label="Prethodna slika"
                  className="group/nav absolute inset-y-0 left-0 w-1/3 flex items-center justify-start pl-3 sm:pl-5 focus:outline-none"
                >
                  <span
                    className={
                      "size-11 rounded-full bg-black/40 backdrop-blur-sm text-white grid place-items-center transition-all ease-out group-hover/nav:opacity-100 group-hover/nav:translate-x-0 group-hover/nav:duration-200 group-focus-visible/nav:opacity-100 group-focus-visible/nav:translate-x-0 " +
                      // Pojavljivanje 500 ms, gašenje 1000 ms (sporije = nježnije).
                      // Hover uvijek pregazi s brzih 200 ms.
                      (hint ? "opacity-100 translate-x-0 duration-500" : "opacity-0 translate-x-1 duration-1000")
                    }
                  >
                    <ChevronLeft className="size-6" />
                  </span>
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); next(); }}
                  aria-label="Sljedeća slika"
                  className="group/nav absolute inset-y-0 right-0 w-1/3 flex items-center justify-end pr-3 sm:pr-5 focus:outline-none"
                >
                  <span
                    className={
                      "size-11 rounded-full bg-black/40 backdrop-blur-sm text-white grid place-items-center transition-all ease-out group-hover/nav:opacity-100 group-hover/nav:translate-x-0 group-hover/nav:duration-200 group-focus-visible/nav:opacity-100 group-focus-visible/nav:translate-x-0 " +
                      (hint ? "opacity-100 translate-x-0 duration-500" : "opacity-0 -translate-x-1 duration-1000")
                    }
                  >
                    <ChevronRight className="size-6" />
                  </span>
                </button>
              </>
            )}
          </div>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm">
            {active + 1} / {images.length}
          </div>
        </div>
      )}
    </>
  );
}
