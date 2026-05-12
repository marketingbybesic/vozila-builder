import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-[var(--color-line)]/60 text-[var(--color-ink-soft)]",
        accent: "bg-[var(--color-accent)]/20 text-[var(--color-accent-dark)]",
        ink: "bg-[var(--color-ink)] text-white",
        success: "bg-[var(--color-success)]/15 text-[var(--color-success)]",
        outline: "border border-[var(--color-line)] text-[var(--color-ink-soft)]",
      },
    },
    defaultVariants: { variant: "neutral" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
