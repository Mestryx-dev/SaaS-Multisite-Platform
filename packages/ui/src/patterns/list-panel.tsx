import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";

export type ListPanelProps = {
  /** Title + description block (left). */
  title: ReactNode;
  description?: ReactNode;
  /** Search / Delete / Create (right of header). */
  actions?: ReactNode;
  children: ReactNode;
  /** Footer — typically PaginationPrevNext. */
  footer?: ReactNode;
  className?: string;
};

/**
 * Stalwart-style list chrome: header (title + toolbar) + body + optional footer.
 * Use inside PageContent; wrap tables / EmptyState / skeletons as children.
 */
export function ListPanel({
  title,
  description,
  actions,
  children,
  footer,
  className,
}: ListPanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]/60",
        className,
      )}
    >
      <div className="flex flex-col gap-3 border-b border-[var(--border)] px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            {title}
          </h2>
          {description ? (
            <p className="text-sm text-[var(--muted-foreground)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      <div className="min-h-[12rem]">{children}</div>
      {footer ? (
        <div className="border-t border-[var(--border)] px-4 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
