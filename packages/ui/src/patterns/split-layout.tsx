import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";

export type SplitLayoutVariant = "formAside" | "listDetail";

export type SplitLayoutProps = {
  primary: ReactNode;
  aside: ReactNode;
  /**
   * formAside (default): wide primary + narrow create/edit form (~22rem).
   * listDetail: narrow list rail + wide detail/settings (Sites-style).
   */
  variant?: SplitLayoutVariant;
  className?: string;
};

/**
 * Master / detail (or list | form) grid — platform console.
 */
export function SplitLayout({
  primary,
  aside,
  variant = "formAside",
  className,
}: SplitLayoutProps) {
  return (
    <div
      className={cn(
        "grid gap-4 lg:items-start",
        variant === "listDetail"
          ? "lg:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)]"
          : "lg:grid-cols-[minmax(0,1fr)_min(22rem,100%)]",
        className,
      )}
    >
      <div className="min-w-0">{primary}</div>
      <aside className="min-w-0" aria-label="Secondary panel">
        {aside}
      </aside>
    </div>
  );
}
