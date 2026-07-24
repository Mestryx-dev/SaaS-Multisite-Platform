import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";

export type PageHeaderProps = {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Optional breadcrumb row above the title block (detail routes). */
  breadcrumb?: ReactNode;
  className?: string;
};

/**
 * Admin / dense list page chrome — single title source of truth (shell top bar is utilities-only).
 * Vertical spacing owned by parent Stack — no bottom margin here.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  breadcrumb,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {breadcrumb ? <div className="mb-2">{breadcrumb}</div> : null}
        {eyebrow ? (
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted-foreground)]">
            {eyebrow}
          </p>
        ) : null}
        <h1
          className="text-2xl font-semibold tracking-[-0.02em] text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-[var(--muted-foreground)]">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2 sm:pt-1">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
