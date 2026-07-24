import React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../lib/utils";

export type LabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

export function Label({ className, ...rest }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "mb-1 block text-sm font-medium leading-none text-[var(--muted-foreground)] peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className,
      )}
      {...rest}
    />
  );
}
