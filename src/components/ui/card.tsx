import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Površina sadržaja.
 *
 * `flat` (zadano) nosi formu elevationom, bez vidljivog ruba — to je magazinski
 * izgled gdje sadržaj "leži" na stranici. `outlined` zadržava okvir za mjesta gdje
 * je rub informacija, a ne ukras (gusta admin tablica, lebdeći sloj na bijelom).
 */
export function Card({
  className,
  variant = "flat",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "flat" | "outlined" }) {
  return (
    <div
      className={cn(
        "bg-[var(--color-surface)] rounded-[var(--radius-lg)]",
        variant === "outlined"
          ? "border border-[var(--color-line)]"
          : "shadow-[var(--shadow-flat)]",
        className
      )}
      {...props}
    />
  );
}
