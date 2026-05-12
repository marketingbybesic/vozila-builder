import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 ease-out disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--color-ink)] text-white hover:bg-[var(--color-ink-soft)] active:scale-[0.98]",
        accent:
          "bg-[var(--color-accent)] text-[var(--color-ink)] hover:bg-[var(--color-accent-dark)] hover:text-white active:scale-[0.98] font-semibold",
        outline:
          "border border-[var(--color-line)] bg-transparent hover:bg-[var(--color-surface)] hover:border-[var(--color-ink)]",
        ghost:
          "hover:bg-[var(--color-line)]/40 text-[var(--color-ink-soft)]",
        link:
          "text-[var(--color-ink-soft)] underline-offset-4 hover:underline hover:text-[var(--color-ink)]",
        danger:
          "bg-[var(--color-danger)] text-white hover:bg-red-700 active:scale-[0.98]",
      },
      size: {
        sm: "h-9 px-3 text-xs",
        md: "h-11 px-5",
        lg: "h-13 px-7 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { buttonVariants };
