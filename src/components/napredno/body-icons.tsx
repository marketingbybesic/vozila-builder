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
};
