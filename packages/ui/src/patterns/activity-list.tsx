import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";
import { StatusDot, type StatusDotProps } from "../components/status-dot";

export type ActivityItem = {
  id: string;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  statusTone?: StatusDotProps["tone"];
  statusLabel?: string;
  href?: string;
};

export type ActivityListProps = {
  items: ActivityItem[];
  className?: string;
  empty?: ReactNode;
};

/**
 * Recent activity / deployments list — Dokploy-inspired dense rows.
 */
export function ActivityList({ items, className, empty }: ActivityListProps) {
  if (items.length === 0) {
    return empty ? <>{empty}</> : null;
  }

  return (
    <ul
      className={cn(
        "divide-y divide-[var(--border)] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]/60",
        className,
      )}
    >
      {items.map((item) => {
        const inner = (
          <>
            {item.statusTone || item.statusLabel ? (
              <StatusDot
                tone={item.statusTone ?? "idle"}
                label={item.statusLabel ?? "Status"}
                className="mt-1.5"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--foreground)]">
                {item.title}
              </p>
              {item.subtitle ? (
                <p className="truncate text-xs text-[var(--muted-foreground)]">
                  {item.subtitle}
                </p>
              ) : null}
            </div>
            {item.meta ? (
              <span className="hidden shrink-0 text-xs text-[var(--muted-foreground)] sm:inline">
                {item.meta}
              </span>
            ) : null}
            {item.trailing ? (
              <span className="shrink-0 text-xs font-medium text-[var(--muted-foreground)]">
                {item.trailing}
              </span>
            ) : null}
          </>
        );

        return (
          <li key={item.id}>
            {item.href ? (
              <a
                href={item.href}
                className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[var(--muted)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--ring)]"
              >
                {inner}
              </a>
            ) : (
              <div className="flex items-start gap-3 px-4 py-3">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
