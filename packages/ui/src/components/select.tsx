import React from "react";
import type { SelectHTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

/** Native select — keeps option children API used by admin/web. */
export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  children: ReactNode;
};

export function Select({ children, className, ...rest }: SelectProps) {
  return (
    <select
      className={cn(
        "flex h-10 w-full appearance-auto rounded-[var(--radius)] border border-[var(--input)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--foreground)] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}
