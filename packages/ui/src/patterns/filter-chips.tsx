import React, { type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "../components/button";

export type FilterChip = {
  id: string;
  label: ReactNode;
};

export type FilterChipsProps = {
  chips: FilterChip[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  clearAllLabel?: string;
  className?: string;
};

/**
 * Active filter chips for list toolbars (SaaS 2026 visible filter context).
 * Pair with FilterBar; URL sync is app-owned.
 */
export function FilterChips({
  chips,
  onRemove,
  onClearAll,
  clearAllLabel = "Clear filters",
  className,
}: FilterChipsProps) {
  if (chips.length === 0) return null;
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2", className)}
      role="list"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <button
          key={chip.id}
          type="button"
          role="listitem"
          className="inline-flex items-center gap-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--muted)] px-2 py-1 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--secondary)]"
          onClick={() => onRemove(chip.id)}
        >
          <span>{chip.label}</span>
          <X className="size-3 opacity-70" aria-hidden />
          <span className="sr-only">Remove {String(chip.label)}</span>
        </button>
      ))}
      {onClearAll ? (
        <Button type="button" variant="ghost" size="sm" onClick={onClearAll}>
          {clearAllLabel}
        </Button>
      ) : null}
    </div>
  );
}
