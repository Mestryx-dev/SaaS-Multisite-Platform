import * as ProgressPrimitive from "@radix-ui/react-progress";
import React, { type ComponentPropsWithoutRef } from "react";
import { cn } from "../lib/utils";

export function Progress({
  className,
  value,
  "aria-label": ariaLabel = "Progress",
  ...props
}: ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-[var(--secondary)]",
        className,
      )}
      {...props}
      aria-label={ariaLabel}
      value={value}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full flex-1 bg-[var(--primary)] transition-all"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
