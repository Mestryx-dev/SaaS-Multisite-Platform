import * as React from "react";
import { cn } from "../lib/utils";

export type SpinnerSize = "sm" | "md" | "lg";

const sizeClass: Record<SpinnerSize, string> = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

const ringClass: Record<SpinnerSize, string> = {
  sm: "border",
  md: "border-2",
  lg: "border-[2.5px]",
};

export type SpinnerProps = React.HTMLAttributes<HTMLDivElement> & {
  size?: SpinnerSize;
  /** Accessible name (default Loading). */
  label?: string;
};

/**
 * Dual-arc loading indicator — platform density.
 * CSS spin; static ring when prefers-reduced-motion.
 */
export function Spinner({
  className,
  size = "md",
  label = "Loading",
  ...props
}: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center",
        sizeClass[size],
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full border-muted/45",
          ringClass[size],
        )}
      />
      <span
        aria-hidden
        className={cn(
          "absolute inset-0 rounded-full border-transparent border-t-primary border-r-primary/40",
          "animate-spin motion-reduce:animate-none motion-reduce:border-r-primary motion-reduce:opacity-60",
          ringClass[size],
        )}
      />
    </div>
  );
}
