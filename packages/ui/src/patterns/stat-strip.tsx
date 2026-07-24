import React, { type ReactNode } from "react";
import { KpiBullet } from "../components/kpi-bullet";
import { cn } from "../lib/utils";

export type StatTrend = {
  label: ReactNode;
  /** Visual tone for trend text. */
  tone?: "up" | "down" | "neutral";
};

export type StatItem = {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  trend?: StatTrend;
  /** Optional progress-vs-target bullet under the value. */
  bullet?: {
    current: number;
    target: number;
    caption?: string;
  };
  /** Optional footer (e.g. status breakdown). */
  footer?: ReactNode;
  /** Soft gold wash on this cell (highlight KPI). */
  accent?: boolean;
};

export type StatStripProps = {
  items: StatItem[];
  className?: string;
};

function gridColsClass(count: number): string {
  if (count <= 2) return "grid-cols-2";
  if (count === 3) return "grid-cols-2 sm:grid-cols-3";
  return "grid-cols-2 sm:grid-cols-4";
}

/**
 * Dashboard KPI strip — single shared surface, cells separated by gap-px.
 * Chrome glass shell only; cells stay solid surface (DESIGN.md Wave E).
 */
export function StatStrip({ items, className }: StatStripProps) {
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "grid gap-px overflow-hidden rounded-[var(--radius)] border border-[var(--glass-border)] bg-[var(--glass-border)]",
        gridColsClass(items.length),
        className,
      )}
      role="list"
    >
      {items.map((item) => (
        <div
          key={item.label}
          role="listitem"
          className={cn(
            "flex min-w-0 flex-col gap-0.5 bg-[var(--card)]/90 px-3 py-2.5 sm:px-4",
            item.accent &&
              "bg-gradient-to-br from-[var(--primary-muted)] to-[var(--card)]/90",
          )}
        >
          <p className="type-kpi-label text-[10px] leading-tight sm:text-xs">
            {item.label}
          </p>
          <p className="type-kpi-value text-[var(--foreground)]">{item.value}</p>
          {item.trend ? (
            <p
              className={cn(
                "text-xs font-medium",
                item.trend.tone === "up" && "text-[oklch(0.72_0.14_155)]",
                item.trend.tone === "down" && "text-[var(--destructive)]",
                (!item.trend.tone || item.trend.tone === "neutral") &&
                  "text-[var(--muted-foreground)]",
              )}
            >
              {item.trend.label}
            </p>
          ) : null}
          {item.bullet ? (
            <KpiBullet
              current={item.bullet.current}
              target={item.bullet.target}
              caption={item.bullet.caption}
            />
          ) : null}
          {item.hint ? (
            <p className="truncate text-[10px] leading-tight text-[var(--muted-foreground)] sm:text-xs">
              {item.hint}
            </p>
          ) : null}
          {item.footer ? <div className="mt-1">{item.footer}</div> : null}
        </div>
      ))}
    </div>
  );
}
