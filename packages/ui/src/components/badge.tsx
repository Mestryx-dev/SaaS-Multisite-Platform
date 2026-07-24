import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
  {
    variants: {
      tone: {
        default:
          "border-transparent bg-[var(--secondary)] text-[var(--foreground)]",
        success:
          "border-transparent bg-[oklch(0.72_0.14_155_/0.2)] text-[oklch(0.82_0.12_155)]",
        danger:
          "border-transparent bg-[var(--destructive)]/20 text-[var(--destructive)]",
        muted:
          "border-[var(--border)] bg-transparent text-[var(--muted-foreground)]",
        info: "border-transparent bg-[var(--primary)]/15 text-[var(--primary)]",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: NonNullable<VariantProps<typeof badgeVariants>["tone"]>;
};

export function Badge({
  children,
  tone = "default",
  className,
  ...rest
}: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ tone }), className)} {...rest}>
      {children}
    </span>
  );
}
