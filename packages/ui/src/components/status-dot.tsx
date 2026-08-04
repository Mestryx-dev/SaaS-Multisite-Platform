import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "../lib/utils";

const statusDotVariants = cva("inline-block size-2 shrink-0 rounded-full", {
  variants: {
    tone: {
      ok: "bg-[oklch(0.72_0.14_155)]",
      warn: "bg-[oklch(0.78_0.12_75)]",
      danger: "bg-[var(--destructive)]",
      idle: "bg-[var(--muted-foreground)]/45",
      info: "bg-[var(--primary)]",
    },
  },
  defaultVariants: { tone: "idle" },
});

export type StatusDotProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: NonNullable<VariantProps<typeof statusDotVariants>["tone"]>;
  /** Accessible label (required for meaning). */
  label: string;
};

/** Dokploy-style status indicator — pair with text, never color-only. */
export function StatusDot({
  tone = "idle",
  label,
  className,
  ...rest
}: StatusDotProps) {
  return (
    <span
      className={cn(statusDotVariants({ tone }), className)}
      role="img"
      aria-label={label}
      title={label}
      {...rest}
    />
  );
}
