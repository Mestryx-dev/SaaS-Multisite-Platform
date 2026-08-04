import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";

export type FilterBarProps = {
  children: ReactNode;
  className?: string;
  trailing?: ReactNode;
};

/**
 * Shared list / PLP toolbar — platform density or storefront filters.
 * Refs: AdminCN datatable toolbar · Shopix category-filter.
 */
export function FilterBar({ children, trailing, className }: FilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">{children}</div>
      {trailing ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div>
      ) : null}
    </div>
  );
}
