import React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../lib/utils";

type RootProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>;

export type CheckboxProps = Omit<RootProps, "type"> & {
  label?: ReactNode;
  /** Native-style change handler (admin compatibility). */
  onChange?: (event: { target: { checked: boolean } }) => void;
};

export function Checkbox({
  label,
  className,
  id,
  onChange,
  onCheckedChange,
  ...rest
}: CheckboxProps) {
  const control = (
    <CheckboxPrimitive.Root
      id={id}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-[calc(var(--radius)*0.5+2px)] border border-[var(--border)] bg-[var(--card)] shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] data-[state=checked]:text-[var(--primary-foreground)]",
        className,
      )}
      onCheckedChange={(value) => {
        onCheckedChange?.(value);
        onChange?.({ target: { checked: value === true } });
      }}
      {...rest}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current">
        <Check className="h-3 w-3" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );

  if (label == null) return control;

  return (
    <label
      className="flex cursor-pointer items-center gap-2 text-sm text-[var(--foreground)]"
      htmlFor={id}
    >
      {control}
      <span>{label}</span>
    </label>
  );
}
