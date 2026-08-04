import * as React from "react";
import { cn } from "../lib/utils";

export type SkeletonVariant = "pulse" | "shimmer";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  /** pulse = Tailwind animate-pulse; shimmer = sliding highlight (CSS). */
  variant?: SkeletonVariant;
};

/**
 * Base skeleton atom. Respects prefers-reduced-motion via CSS
 * (`@media (prefers-reduced-motion: reduce)` disables animation).
 */
export function Skeleton({
  className,
  variant = "pulse",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] bg-[var(--muted)]",
        variant === "pulse" && "animate-pulse motion-reduce:animate-none",
        variant === "shimmer" && "ui-skeleton-shimmer",
        className,
      )}
      {...props}
    />
  );
}
