import React from "react";
import { cn } from "../lib/utils";

export type KpiBulletProps = {
  /** Current metric (always announced as text via aria). */
  current: number;
  /** Target / capacity for the progress fill. */
  target: number;
  className?: string;
  /** Optional visible caption under the bar. */
  caption?: string;
};

/**
 * Compact progress-vs-target bar for StatStrip KPIs.
 * Numbers remain visible as text on the parent StatItem — this is visual only.
 */
export function KpiBullet({
  current,
  target,
  className,
  caption,
}: KpiBulletProps) {
  const max = Math.max(target, 0);
  const pct =
    max <= 0 ? 0 : Math.min(100, Math.round((Math.max(current, 0) / max) * 100));

  return (
    <div className={cn("mt-2 space-y-1", className)}>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--muted)]"
        role="meter"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={max || undefined}
        aria-label={caption ?? `${current} of ${max}`}
      >
        <div
          className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-200 motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
      {caption ? (
        <p className="text-[10px] text-[var(--muted-foreground)]">{caption}</p>
      ) : null}
    </div>
  );
}
