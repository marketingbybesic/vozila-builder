"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Zaštita od slučajnog izlaska iz forme s nespremljenim unosom (Dino 04.08.2026).
 *
 * ⚠️ Next.js App Router NEMA `useBlocker` ni `router.events` (to je bio Pages
 * Router). Zato se presreću tri stvarna izlaza:
 *   1. `beforeunload` — zatvaranje taba / osvježavanje / vanjski link
 *      (preglednik prikazuje svoj tekst, naš se ne može ubaciti — to je namjerno
 *      ograničenje preglednika, ne propust)
 *   2. klik na `<a href>` unutar stranice — hvata se u fazi CAPTURE, prije nego
 *      Next preuzme navigaciju
 *   3. `popstate` — gumb "Nazad"; povijest se odmah gura natrag da stranica
 *      ostane, a odluka se traži modalom
 *
 * `onAttempt(nastavi)` dobiva funkciju koja izvodi izvornu navigaciju kad
 * korisnik potvrdi izlazak.
 */
export function useUnsavedGuard(active: boolean, onAttempt: (proceed: () => void) => void) {
  const cb = useRef(onAttempt);
  cb.current = onAttempt;
  // Kad korisnik potvrdi izlazak, guard se mora ugasiti da ne uhvati sam sebe.
  const [bypass, setBypass] = useState(false);

  useEffect(() => {
    if (!active || bypass) return;

    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    const onClick = (e: MouseEvent) => {
      // Novi tab / srednji klik / preuzimanje — pusti kako jest.
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || a.target === "_blank" || a.hasAttribute("download")) return;
      // Ista stranica → nije izlazak.
      if (href === window.location.pathname + window.location.search) return;

      e.preventDefault();
      e.stopPropagation();
      cb.current(() => {
        setBypass(true);
        // Sljedeći tick: guard je ugašen, navigacija prolazi.
        setTimeout(() => { window.location.href = href; }, 0);
      });
    };

    const onPopState = () => {
      // Vrati korisnika na formu i pitaj ga modalom.
      window.history.pushState(null, "", window.location.href);
      cb.current(() => {
        setBypass(true);
        setTimeout(() => window.history.back(), 0);
      });
    };

    // Bez ovog unosa prvi "Nazad" nema što poništiti.
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true); // capture
    window.addEventListener("popstate", onPopState);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, [active, bypass]);
}
