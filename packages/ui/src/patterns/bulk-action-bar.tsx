import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";

export type BulkActionBarProps = {
  count: number;
  children: ReactNode;
  className?: string;
  label?: string;
};

/** Appears when table rows are selected — bulk action slot. */
export function BulkActionBar({
  count,
  children,
  className,
  label,
}: BulkActionBarProps) {
  if (count <= 0) return null;
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-[var(--primary)]/40 bg-[var(--primary)]/10 px-3 py-2 text-sm",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="font-medium text-[var(--foreground)]">
        {label ?? `${count} selected`}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
