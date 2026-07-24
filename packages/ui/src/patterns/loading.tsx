import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";
import { Skeleton } from "../components/skeleton";
import { Spinner } from "../components/spinner";

export type TableSkeletonProps = {
  rows?: number;
  columns?: number;
  className?: string;
  /** Use shimmer variant on bars */
  shimmer?: boolean;
};

/** Structured table-shaped skeleton for list loading states. */
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className,
  shimmer = false,
}: TableSkeletonProps) {
  const variant = shimmer ? "shimmer" : "pulse";
  return (
    <div
      className={cn("w-full p-3", className)}
      role="status"
      aria-label="Loading table"
      aria-busy="true"
    >
      <div
        className="mb-3 grid gap-2 border-b border-[var(--border)] pb-3"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: columns }, (_, i) => (
          <Skeleton key={`h-${i}`} variant={variant} className="h-3 w-3/4" />
        ))}
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }, (_, r) => (
          <div
            key={`r-${r}`}
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }, (_, c) => (
              <Skeleton
                key={`c-${r}-${c}`}
                variant={variant}
                className={cn("h-8 w-full", c === 0 && "max-w-[80%]")}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export type FormSkeletonProps = {
  fields?: number;
  className?: string;
  shimmer?: boolean;
};

/** FormPanel-like skeleton (title + fields + actions). */
export function FormSkeleton({
  fields = 3,
  className,
  shimmer = false,
}: FormSkeletonProps) {
  const variant = shimmer ? "shimmer" : "pulse";
  return (
    <div
      className={cn(
        "space-y-4 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]/40 p-4",
        className,
      )}
      role="status"
      aria-label="Loading form"
      aria-busy="true"
    >
      <Skeleton variant={variant} className="h-4 w-40" />
      <div className="space-y-3">
        {Array.from({ length: fields }, (_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton variant={variant} className="h-3 w-24" />
            <Skeleton variant={variant} className="h-9 w-full max-w-sm" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Skeleton variant={variant} className="h-8 w-20" />
        <Skeleton variant={variant} className="h-8 w-16" />
      </div>
    </div>
  );
}

export type PageSkeletonProps = {
  className?: string;
  shimmer?: boolean;
  tableRows?: number;
};

/** Console list page chrome: header + filter + table skeleton. */
export function PageSkeleton({
  className,
  shimmer = false,
  tableRows = 5,
}: PageSkeletonProps) {
  const variant = shimmer ? "shimmer" : "pulse";
  return (
    <div
      className={cn("space-y-4", className)}
      role="status"
      aria-label="Loading page"
      aria-busy="true"
    >
      <div className="space-y-2 border-b border-[var(--border)] pb-6">
        <Skeleton variant={variant} className="h-3 w-20" />
        <Skeleton variant={variant} className="h-7 w-48" />
        <Skeleton variant={variant} className="h-3 w-72 max-w-full" />
      </div>
      <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-4">
        <Skeleton variant={variant} className="h-9 w-40" />
        <Skeleton variant={variant} className="h-9 w-32" />
      </div>
      <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)]">
        <TableSkeleton rows={tableRows} shimmer={shimmer} />
      </div>
    </div>
  );
}

export type LoadingBlockProps = {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
};

/** Centered spinner + optional label (detail / empty wait). */
export function LoadingBlock({
  label = "Loading…",
  className,
  size = "md",
}: LoadingBlockProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3.5 py-12",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center">
        <span
          aria-hidden
          className="absolute size-12 rounded-full bg-primary/10 blur-md motion-reduce:hidden"
        />
        <Spinner size={size} label={label} className="relative" />
      </div>
      {label ? (
        <p className="text-sm font-medium tracking-tight text-[var(--muted-foreground)]">
          {label}
        </p>
      ) : null}
    </div>
  );
}

export type LoadingOverlayProps = {
  label?: string;
  className?: string;
  children?: ReactNode;
};

/**
 * Relative parent overlay — spinner over muted backdrop.
 * Wrap a panel: `<div className="relative"><LoadingOverlay />…</div>`
 */
export function LoadingOverlay({
  label = "Loading",
  className,
  children,
}: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 rounded-[inherit] bg-[var(--background)]/70 backdrop-blur-[2px]",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <Spinner size="md" label={label} />
      {children}
    </div>
  );
}
