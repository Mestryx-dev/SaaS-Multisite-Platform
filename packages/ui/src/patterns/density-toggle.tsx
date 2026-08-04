import React, { useEffect, useState } from "react";
import { cn } from "../lib/utils";

export type TableDensity = "comfortable" | "compact";

const STORAGE_KEY = "mx-admin-table-density";

export function readTableDensity(): TableDensity {
  if (typeof window === "undefined") return "comfortable";
  const v = window.localStorage.getItem(STORAGE_KEY);
  return v === "compact" ? "compact" : "comfortable";
}

export function writeTableDensity(density: TableDensity) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, density);
}

export type DensityToggleProps = {
  value?: TableDensity;
  defaultValue?: TableDensity;
  onChange?: (density: TableDensity) => void;
  className?: string;
  /** Persist to localStorage (default true). */
  persist?: boolean;
};

/**
 * Comfortable | compact row density for admin tables.
 */
export function DensityToggle({
  value,
  defaultValue,
  onChange,
  className,
  persist = true,
}: DensityToggleProps) {
  const [internal, setInternal] = useState<TableDensity>(
    () => defaultValue ?? (persist ? readTableDensity() : "comfortable"),
  );
  const density = value ?? internal;

  useEffect(() => {
    if (persist && value === undefined) {
      writeTableDensity(internal);
    }
  }, [internal, persist, value]);

  function setDensity(next: TableDensity) {
    if (value === undefined) setInternal(next);
    if (persist) writeTableDensity(next);
    onChange?.(next);
  }

  return (
    <div
      className={cn(
        "inline-flex rounded-[var(--radius)] border border-[var(--border)] p-0.5",
        className,
      )}
      role="group"
      aria-label="Table density"
    >
      {(
        [
          ["comfortable", "Comfortable"],
          ["compact", "Compact"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={density === id}
          className={cn(
            "rounded-[calc(var(--radius)-2px)] px-2 py-1 text-xs font-medium transition-colors",
            density === id
              ? "bg-[var(--primary)]/15 text-[var(--foreground)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
          )}
          onClick={() => setDensity(id)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function tableDensityClass(density: TableDensity): string {
  return density === "compact"
    ? "[&_td]:py-1.5 [&_th]:py-1.5 text-xs"
    : "[&_td]:py-2.5 [&_th]:py-2.5";
}
