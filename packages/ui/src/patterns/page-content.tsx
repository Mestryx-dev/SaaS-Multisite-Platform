import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";

export type PageContentMaxWidth = "default" | "wide" | "full";

const maxWidthClass: Record<PageContentMaxWidth, string> = {
  /** Rare: prose-heavy or single-column setup flows */
  default: "max-w-5xl",
  /**
   * Console lists / dashboards — fill the AppShell main column.
   * (Previously max-w-7xl, which left large empty gutters on desktop.)
   */
  wide: "max-w-none",
  full: "max-w-none",
};

export type PageContentProps = {
  children: ReactNode;
  /** default = max-w-5xl; wide/full = fluid main column */
  maxWidth?: PageContentMaxWidth;
  className?: string;
};

/**
 * Main column for platform console pages.
 * AppShell main stays full-bleed; wrap page body with PageContent.
 * Prefer `wide` or `full` for admin list/settings (SaaS density).
 */
export function PageContent({
  children,
  maxWidth = "wide",
  className,
}: PageContentProps) {
  return (
    <div className={cn("mx-auto w-full", maxWidthClass[maxWidth], className)}>
      {children}
    </div>
  );
}
