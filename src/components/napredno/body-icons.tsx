/**
 * Prave bočne siluete karoserija (avto.net/mobile.de stil).
 * Lucide nema točne siluete pa su Limuzina/SUV/Coupe izgledali isto (Karlo, 22.06).
 * Sve dijele viewBox 0 0 48 24, stroke=currentColor, iste proporcije → konzistentan set.
 * Prihvaćaju `className` (kao lucide) da BodyTypePicker/dropdown rade bez izmjena.
 */
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function Silhouette({ children, className, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 48 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      {children}
      {/* kotači — zajednički za sve auto tipove */}
      <circle cx="13" cy="20" r="2.6" />
      <circle cx="35" cy="20" r="2.6" />
    </svg>
  );
}

// ── AUTO tipovi ─────────────────────────────────────────────────────────
export const IconLimuzina = (p: IconProps) => (
  <Silhouette {...p}>
    {/* 3-box: motor + kabina + prtljažnik, blagi nagib */}
    <path d="M3 17 L6 17 C7 13 10 11 15 10.5 L27 10 C31 10 34 12 37 14 L44 15 C45 15 45 17 44 17 L38 17 M31 17 L17 17 M10 17 L6.5 17" />
    <path d="M15 10.5 L18 7.5 L28 7.3 L31.5 10.3" />
    <path d="M23 7.4 L23 10.2" />
  </Silhouette>
);

export const IconHatchback = (p: IconProps) => (
  <Silhouette {...p}>
    {/* kraća stražnja, strmi hatch */}
    <path d="M3 17 L6 17 C7 13 10 11 15 10.5 L26 10 C31 10.2 35 13 37 17 L38 17 M31 17 L17 17 M10 17 L6.5 17" />
    <path d="M15 10.5 L18 7.5 L27 7.4 L34 12" />
    <path d="M23 7.5 L23 10.1" />
  </Silhouette>
);

export const IconKaravan = (p: IconProps) => (
  <Silhouette {...p}>
    {/* dugačak ravan krov do kraja */}
    <path d="M3 17 L6 17 C7 13 10 11 15 10.5 L36 10 C39 10 40 12 40 14 L40 17 M33 17 L17 17 M10 17 L6.5 17" />
    <path d="M15 10.5 L18 7.4 L37 7.3 L39.5 10.2" />
    <path d="M23 7.4 L23 10.1 M31 7.35 L31 10.05" />
  </Silhouette>
);

export const IconSUV = (p: IconProps) => (
  <Silhouette {...p}>
    {/* visok, uspravan, veći razmak od tla */}
    <path d="M3 16 L6 16 C7 11 10 9 15 8.5 L34 8 C38 8 40 11 40 14 L40 16 M33 16 L17 16 M10 16 L6.5 16" />
    <path d="M15 8.5 L18 5.4 L36 5.3 L39 8.2" />
    <path d="M24 5.35 L24 8.1" />
  </Silhouette>
);

export const IconCoupe = (p: IconProps) => (
  <Silhouette {...p}>
    {/* niska, sportska, jedna kontinuirana krovna linija */}
    <path d="M3 17 L7 17 C8 13 11 11 16 10.5 C22 8 28 8 33 11 C36 12.5 38 14.5 40 17 L38 17 M31 17 L18 17 M11 17 L7.5 17" />
    <path d="M16 10.4 C22 6.8 28 6.8 33 10.9" />
  </Silhouette>
);

export const IconCabrio = (p: IconProps) => (
  <Silhouette {...p}>
    {/* otvoreni krov — vjetrobran + linija bez krova */}
    <path d="M3 17 L7 17 C8 13 11 11 16 10.5 L32 10.2 C36 10.5 38 14 40 17 L38 17 M31 17 L18 17 M11 17 L7.5 17" />
    <path d="M17 10.5 L20 8" />
    <path d="M20 8 L31 9.6" strokeDasharray="2 2" />
  </Silhouette>
);

export const IconMonovolumen = (p: IconProps) => (
  <Silhouette {...p}>
    {/* jednovolumenski — zaobljen kontinuiran krov */}
    <path d="M3 17 L6 17 C6 10 9 6.5 16 6 L32 6 C38 6.5 40 11 40 15 L40 17 M33 17 L17 17 M10 17 L6.5 17" />
    <path d="M16 6 L16 10 M24 6 L24 9.8 M32 6 L32 9.8" />
    <path d="M16 10 L33 9.8" />
  </Silhouette>
);

export const IconMicrocar = (p: IconProps) => (
  <Silhouette {...p}>
    {/* kratak, kockast gradski */}
    <path d="M6 17 L8 17 C8 12 10 10 15 9.8 L28 9.8 C32 10 33 13 33 17 L31 17 M25 17 L18 17 M12 17 L8.5 17" />
    <path d="M15 9.8 L17 7 L27 7 L31 11" />
    <path d="M22 7 L22 9.7" />
  </Silhouette>
);

export const IconPickup = (p: IconProps) => (
  <Silhouette {...p}>
    {/* kabina naprijed + otvoreni tovarni sanduk */}
    <path d="M3 17 L6 17 C7 13 9 11 13 10.5 L20 10.3 L21 14 L40 14 L40 17 M33 17 L17 17 M10 17 L6.5 17" />
    <path d="M13 10.5 L15.5 7.5 L20 7.4 L20.5 10.3" />
  </Silhouette>
);

// ── DOSTAVNA (gospodarska) tipovi ──────────────────────────────────────
// ⚠️ Karlo 19.09.2026 (st.145): svih 6 "Oblik karoserije" opcija za Dostavna
// vozila je do sad dijelilo ISTI generički Truck lucide ikon (BODY_ICON u
// controls.tsx) — nerazlučivo na oko, isti problem kao Limuzina/SUV/Coupe
// prije ovog sustava (Karlo, 22.06). Iste proporcije/stil kao AUTO tipovi
// gore (viewBox 48×24, isti kotači), samo visoka kockasta silueta dostavnjaka
// umjesto niske automobilske.
export const IconFurgon = (p: IconProps) => (
  <Silhouette {...p}>
    {/* visok zatvoreni kombi-sanduk — ravan krov od vjetrobrana do repa */}
    <path d="M3 17 L6 17 C6 8 8 6 12 6 L38 6 C40 6 40 8 40 12 L40 17 M33 17 L17 17 M10 17 L6.5 17" />
    <path d="M12 6 L12 17 M22 6 L22 17" />
  </Silhouette>
);

export const IconMaliFurgon = (p: IconProps) => (
  <Silhouette {...p}>
    {/* isti oblik kao Furgon, kraći i niži (Caddy/Doblo klasa, ne Sprinter/Transit) */}
    <path d="M5 17 L8 17 C8 10 10 8 13 8 L34 8 C37 8 38 10 38 13 L38 17 M31 17 L18 17 M12 17 L8.5 17" />
    <path d="M13 8 L13 17 M22 8 L22 17" />
  </Silhouette>
);

export const IconKombi = (p: IconProps) => (
  <Silhouette {...p}>
    {/* putnički dostavnjak — zaobljenija linija krova + bočni prozori */}
    <path d="M3 17 L6 17 C6.5 9 9 6.5 13 6.3 L37 6.5 C39.5 6.7 40 9 40 12 L40 17 M33 17 L17 17 M10 17 L6.5 17" />
    <path d="M13.5 9.3 L13.5 12.3 M20 9 L20 12.2 M26.5 8.9 L26.5 12.1 M33 9 L33 12" />
  </Silhouette>
);

export const IconKamionet = (p: IconProps) => (
  <Silhouette {...p}>
    {/* odvojena kabina + niži ravan tovarni sanduk iza (za razliku od Pickupa: sanduk je viši, zatvoreniji) */}
    <path d="M3 17 L6 17 C7 12 9 9.5 13 9.3 L19 9.2 L19.5 13 L39 13 C40 13 40 14.5 40 17 M33 17 L17 17 M10 17 L6.5 17" />
    <path d="M13 9.3 L15 6.8 L19 6.8 L19.3 9.2" />
    <path d="M39 13 L39 17" />
  </Silhouette>
);

export const IconSasijaKabinom = (p: IconProps) => (
  <Silhouette {...p}>
    {/* SAMO kabina naprijed — golo šasijsko postolje otvoreno iza, bez nadgradnje */}
    <path d="M3 17 L6 17 C7 12 9 9.5 13 9.3 L19 9.2 L19.5 13 L40 13" />
    <path d="M13 9.3 L15 6.8 L19 6.8 L19.3 9.2" />
    <path d="M22 15.3 L40 15.3" strokeDasharray="1.6 1.8" />
  </Silhouette>
);

export const IconSasijaNadgradnjom = (p: IconProps) => (
  <Silhouette {...p}>
    {/* kabina naprijed + kockasta nadogradnja (kontejner) jasno odvojena razmakom */}
    <path d="M3 17 L6 17 C7 12 9 9.5 13 9.3 L18.5 9.2 L19 13 L20.5 13" />
    <path d="M13 9.3 L15 6.8 L18.5 6.8 L18.8 9.2" />
    <path d="M23 7 L39 7 C40 7 40 8 40 9 L40 17 M33 17 L17 17 M10 17 L6.5 17" />
    <path d="M23 7 L23 17" />
  </Silhouette>
);

/** Mapa hrvatskih auto-labela → prava silueta. */
export const AUTO_BODY_ICON: Record<string, (p: IconProps) => React.ReactElement> = {
  Limuzina: IconLimuzina,
  Hatchback: IconHatchback,
  Karavan: IconKaravan,
  SUV: IconSUV,
  Coupe: IconCoupe,
  Cabrio: IconCabrio,
  Monovolumen: IconMonovolumen,
  Microcar: IconMicrocar,
  Pickup: IconPickup,
  // Karlo 19.09.2026 (st.145): "Pick up" (Dostavna) treba ISTU siluetu kao
  // "Pickup" (Auto) — dodan pod oba ključa jer se labele razlikuju razmakom.
  "Pick up": IconPickup,
  Furgon: IconFurgon,
  "Mali furgon": IconMaliFurgon,
  Kombi: IconKombi,
  Kamionet: IconKamionet,
  "Šasija s kabinom": IconSasijaKabinom,
  "Šasija s nadgradnjom": IconSasijaNadgradnjom,
};
