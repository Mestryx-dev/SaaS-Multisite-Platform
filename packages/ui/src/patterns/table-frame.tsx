import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";

export type TableFrameMaxWidth = "2xl" | "full";

const maxWidthClass: Record<TableFrameMaxWidth, string> = {
  "2xl": "max-w-2xl",
  full: "max-w-none w-full",
};

export type TableFrameProps = {
  children: ReactNode;
  maxWidth?: TableFrameMaxWidth;
  /** Sticky table header when scrolling inside the frame */
  stickyHeader?: boolean;
  className?: string;
};

/**
 * Bordered list/table chrome — platform density.
 * Inner overflow-x-auto keeps wide tables usable on narrow viewports.
 */
export function TableFrame({
  children,
  maxWidth = "full",
  stickyHeader = true,
  className,
}: TableFrameProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]/60",
        maxWidthClass[maxWidth],
        className,
      )}
    >
      <div
        className={cn(
          "overflow-x-auto",
          stickyHeader &&
            "[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10 [&_thead]:bg-[var(--glass-bg)] [&_thead]:backdrop-blur-[var(--glass-blur)] [&_thead]:supports-[backdrop-filter]:bg-[var(--glass-bg)]",
        )}
      >
        {children}
      </div>
    </div>
  );
}
