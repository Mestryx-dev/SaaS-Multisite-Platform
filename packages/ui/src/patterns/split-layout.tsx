import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";

export type SplitLayoutProps = {
  primary: ReactNode;
  aside: ReactNode;
  className?: string;
};

/**
 * Master / detail (or list | form) grid — platform console.
 * Aside caps near 20rem on large screens.
 */
export function SplitLayout({ primary, aside, className }: SplitLayoutProps) {
  return (
    <div
      className={cn(
        "grid gap-4 lg:grid-cols-[minmax(0,1fr)_min(20rem,100%)] lg:items-start",
        className,
      )}
    >
      <div className="min-w-0">{primary}</div>
      <aside className="min-w-0">{aside}</aside>
    </div>
  );
}
