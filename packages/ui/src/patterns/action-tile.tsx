import React, { type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "../lib/utils";

export type ActionTileProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
  title: ReactNode;
  description?: ReactNode;
};

/**
 * Maintenance / tools grid card — icon + title + short description.
 * Dark platform surface (Stalwart action grid adapted).
 */
export function ActionTile({
  icon,
  title,
  description,
  className,
  type = "button",
  ...rest
}: ActionTileProps) {
  return (
    <button
      type={type}
      className={cn(
        "flex w-full flex-col gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]/50 p-4 text-left transition-colors",
        "hover:border-[var(--ring)]/40 hover:bg-[var(--card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...rest}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 flex size-5 shrink-0 items-center justify-center text-[var(--foreground)] [&_svg]:size-5"
          aria-hidden
        >
          {icon}
        </span>
        <span className="min-w-0 text-sm font-semibold text-[var(--foreground)]">
          {title}
        </span>
      </div>
      {description ? (
        <p className="pl-8 text-xs leading-relaxed text-[var(--muted-foreground)]">
          {description}
        </p>
      ) : null}
    </button>
  );
}

export type ActionTileGridProps = {
  children: ReactNode;
  className?: string;
};

export function ActionTileGrid({ children, className }: ActionTileGridProps) {
  return (
    <div
      className={cn(
        "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
