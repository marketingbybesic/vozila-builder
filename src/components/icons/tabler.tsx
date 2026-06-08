// Custom kategorijske ikone preuzete iz Tabler Icons (MIT licenca).
// Lucide nema bager/felgu pa koristimo Tabler "backhoe" i "wheel".
// Renderiraju se kao inline SVG (currentColor), API kompatibilan s lucide.
import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

function base({ size = 24, ...props }: IconProps) {
  return {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

// Tabler "backhoe" — bager / građevinski stroj
export function Backhoe(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M2 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M11 17a2 2 0 1 0 4 0a2 2 0 1 0 -4 0" />
      <path d="M13 19l-9 0" />
      <path d="M4 15l9 0" />
      <path d="M8 12v-5h2a3 3 0 0 1 3 3v5" />
      <path d="M5 15v-2a1 1 0 0 1 1 -1h7" />
      <path d="M21.12 9.88l-3.12 -4.88l-5 5" />
      <path d="M21.12 9.88a3 3 0 0 1 -2.12 5.12a3 3 0 0 1 -2.12 -.88l4.24 -4.24" />
    </svg>
  );
}

// Tabler "wheel" — felga / kotač
export function Wheel(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 12a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
      <path d="M3 12h6" />
      <path d="M15 12h6" />
      <path d="M13.6 9.4l3.4 -4.8" />
      <path d="M10.4 14.6l-3.4 4.8" />
      <path d="M7 4.6l3.4 4.8" />
      <path d="M13.6 14.6l3.4 4.8" />
    </svg>
  );
}
