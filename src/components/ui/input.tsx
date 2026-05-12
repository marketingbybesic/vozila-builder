import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 text-sm placeholder:text-[var(--color-muted)] disabled:opacity-50 transition-colors hover:border-[var(--color-ink-soft)]/40 focus:border-[var(--color-ink)]",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "min-h-[120px] w-full rounded-[var(--radius-md)] border border-[var(--color-line)] bg-[var(--color-surface)] px-3.5 py-3 text-sm placeholder:text-[var(--color-muted)] disabled:opacity-50 transition-colors hover:border-[var(--color-ink-soft)]/40 focus:border-[var(--color-ink)]",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
