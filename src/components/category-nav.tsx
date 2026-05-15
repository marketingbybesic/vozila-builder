"use client";

import Link from "next/link";
import { Car, Bike, Truck, Wrench, Tent, Cog } from "lucide-react";
import { cn } from "@/lib/utils";

type Category = {
  slug: string;
  label: string;
  Icon: typeof Car;
  href: string;
  comingSoon?: boolean;
};

const CATEGORIES: Category[] = [
  { slug: "auto", label: "Auto", Icon: Car, href: "/oglasi?category=auto" },
  { slug: "moto", label: "Moto", Icon: Bike, href: "/oglasi?category=moto" },
  { slug: "gospodarska", label: "Gospodarska", Icon: Truck, href: "/oglasi?category=gospodarska" },
  { slug: "mehanizacija", label: "Mehanizacija", Icon: Cog, href: "/oglasi?category=mehanizacija" },
  { slug: "prosti-cas", label: "Slobodno vrijeme", Icon: Tent, href: "/oglasi?category=prosti-cas" },
  { slug: "dijelovi", label: "Dijelovi i oprema", Icon: Wrench, href: "/oglasi?category=dijelovi" },
];

export function CategoryNav() {
  return (
    <nav aria-label="Kategorije vozila">
      <ul className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {CATEGORIES.map((cat) => {
          const { Icon } = cat;
          const disabled = !!cat.comingSoon;
          return (
            <li key={cat.slug}>
              <Link
                href={cat.href}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                onClick={(e) => {
                  if (disabled) e.preventDefault();
                }}
                className={cn(
                  "group relative flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-[var(--radius-md)] border transition-all",
                  disabled
                    ? "border-white/10 bg-white/[0.03] text-white/40 cursor-not-allowed"
                    : "border-white/15 bg-white/[0.06] text-white hover:bg-white/10 hover:border-white/30"
                )}
              >
                <Icon className="size-5 shrink-0" />
                <span className="text-[11px] uppercase tracking-wider font-medium whitespace-nowrap">
                  {cat.label}
                </span>
                {disabled && (
                  <span className="absolute top-1 right-1 text-[8px] uppercase tracking-wider font-semibold bg-[var(--color-accent)]/80 text-[var(--color-ink)] rounded px-1 py-0.5">
                    Uskoro
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
