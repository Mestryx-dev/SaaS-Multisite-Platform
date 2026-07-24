import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius)] text-sm font-semibold transition-[colors,box-shadow,opacity] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_0_24px_var(--glow-accent)] hover:opacity-95 hover:shadow-[0_0_32px_var(--glow-accent)]",
        secondary:
          "border border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--foreground)] backdrop-blur-sm hover:bg-[var(--secondary)]",
        ghost:
          "bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)]",
        destructive: "bg-[var(--destructive)] text-white hover:opacity-90",
        outline:
          "border border-[var(--border)] bg-transparent text-[var(--foreground)] hover:bg-[var(--secondary)]",
        /** Near-white CTA for rare light contrast; prefer primary gold for page actions. */
        inverse:
          "bg-[oklch(0.96_0.01_250)] text-[oklch(0.28_0.02_260)] hover:bg-[oklch(0.92_0.01_250)]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-[var(--radius)] px-3 text-xs",
        lg: "h-11 rounded-[var(--radius)] px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export type ButtonVariant = NonNullable<VariantProps<typeof buttonVariants>["variant"]>;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: VariantProps<typeof buttonVariants>["size"];
  asChild?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "default",
      className,
      type = "button",
      asChild = false,
      ...rest
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size }), className)}
        {...rest}
      >
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export type ButtonLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: VariantProps<typeof buttonVariants>["size"];
};

export function ButtonLink({
  children,
  variant = "primary",
  size = "default",
  className,
  ...rest
}: ButtonLinkProps) {
  return (
    <a className={cn(buttonVariants({ variant, size }), className)} {...rest}>
      {children}
    </a>
  );
}

export { buttonVariants };
