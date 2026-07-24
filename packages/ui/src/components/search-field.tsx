import React from "react";
import type { InputHTMLAttributes } from "react";
import { Search } from "lucide-react";
import { cn } from "../lib/utils";

export type SearchFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  /** Fully rounded pill (Stalwart toolbar search). */
  pill?: boolean;
};

/**
 * Search input with leading Lucide icon — list toolbars / PageHeader actions.
 */
export function SearchField({
  className,
  pill = false,
  ...rest
}: SearchFieldProps) {
  return (
    <div className={cn("relative min-w-[10rem] max-w-xs flex-1", className)}>
      <Search
        className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[var(--muted-foreground)]"
        aria-hidden
      />
      <input
        type="search"
        className={cn(
          "flex h-9 w-full border border-[var(--input)] bg-[var(--card)] py-2 pl-8 pr-3 text-sm text-[var(--foreground)] shadow-sm transition-colors placeholder:text-[var(--muted-foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:cursor-not-allowed disabled:opacity-50",
          pill ? "rounded-full" : "rounded-[var(--radius)]",
        )}
        {...rest}
      />
    </div>
  );
}
