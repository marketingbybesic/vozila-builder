import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-line)]",
        className
      )}
      {...props}
    />
  );
}
