import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";

export type MetaPillProps = {
  label?: ReactNode;
  children: ReactNode;
  className?: string;
};

/** Compact top-bar capsule (e.g. server time) — Dokploy-inspired. */
export function MetaPill({ label, children, className }: MetaPillProps) {
  return (
    <div
      className={cn(
        "inline-flex max-w-full items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/50 px-3 py-1 text-xs text-[var(--muted-foreground)]",
        className,
      )}
    >
      {label ? (
        <span className="shrink-0 font-medium text-[var(--foreground)]/80">
          {label}
        </span>
      ) : null}
      <span className="truncate font-mono tabular-nums">{children}</span>
    </div>
  );
}
