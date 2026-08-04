import React from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export type EmptyStateProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> & {
  /** Optional icon (Lucide) — rendered in a soft rounded square. */
  icon?: ReactNode;
  /** Short headline (optional). */
  title?: ReactNode;
  /** Supporting copy; falls back to `children` when omitted. */
  description?: ReactNode;
  /** Primary action (Button / ButtonLink). */
  action?: ReactNode;
  /** Legacy: used as description when `description` is unset. */
  children?: ReactNode;
  /**
   * `panel` — solid subtle border (default).
   * `dashed` — dashed inset (optional emphasis).
   * `plain` — no border (inside ListPanel body).
   */
  variant?: "panel" | "dashed" | "plain";
};

/**
 * Empty list / panel placeholder (Stalwart-inspired).
 * Prefer icon + title + description + action. `children` remains supported.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  children,
  variant = "panel",
  className,
  ...rest
}: EmptyStateProps) {
  const body = description ?? children;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-10 text-center",
        variant === "panel" &&
          "rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]/40",
        variant === "dashed" &&
          "rounded-[var(--radius)] border border-dashed border-[var(--border)] bg-[var(--card)]/40",
        className,
      )}
      role="status"
      {...rest}
    >
      {icon ? (
        <div
          className="mb-1 flex size-14 items-center justify-center rounded-[calc(var(--radius)+2px)] bg-[var(--muted)] text-[var(--muted-foreground)] [&_svg]:size-7"
          aria-hidden
        >
          {icon}
        </div>
      ) : null}
      {title ? (
        <p className="text-base font-semibold tracking-tight text-[var(--foreground)]">
          {title}
        </p>
      ) : null}
      {body ? (
        <p className="max-w-sm text-sm text-[var(--muted-foreground)]">{body}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
