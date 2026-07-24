import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";

export type PageContentMaxWidth = "default" | "wide" | "full";

const maxWidthClass: Record<PageContentMaxWidth, string> = {
  default: "max-w-6xl",
  wide: "max-w-7xl",
  full: "max-w-none",
};

export type PageContentProps = {
  children: ReactNode;
  /** default = max-w-6xl; wide = max-w-7xl; full = unconstrained */
  maxWidth?: PageContentMaxWidth;
  className?: string;
};

/**
 * Constrained main column for platform console pages.
 * AppShell main stays full-bleed; wrap page body with PageContent.
 */
export function PageContent({
  children,
  maxWidth = "default",
  className,
}: PageContentProps) {
  return (
    <div className={cn("mx-auto w-full", maxWidthClass[maxWidth], className)}>
      {children}
    </div>
  );
}
