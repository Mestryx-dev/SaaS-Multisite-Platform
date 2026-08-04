import React, { type ReactNode } from "react";
import { cn } from "../lib/utils";
import { Skeleton } from "../components/skeleton";

export type StoreLoadingProps = {
  /** Brand / shop name (display font). */
  brand?: string;
  /** Status line under the brand. */
  label?: string;
  className?: string;
  /** Full viewport splash vs compact block. */
  variant?: "page" | "inline";
  /** Optional mark (initial letter or custom node). */
  mark?: ReactNode;
};

/**
 * Soft boutique storefront loading — light ambient, Fraunces brand, calm spin.
 * Use `variant="page"` for full-bleed waits; `inline` for cart / panel.
 */
export function StoreLoading({
  brand,
  label = "Loading…",
  className,
  variant = "inline",
  mark,
}: StoreLoadingProps) {
  const initial =
    typeof brand === "string" && brand.trim()
      ? brand.trim().charAt(0).toUpperCase()
      : null;

  return (
    <div
      className={cn(
        "ui-store-loading",
        variant === "page" && "ui-store-loading--page",
        variant === "inline" && "ui-store-loading--inline",
        className,
      )}
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
    >
      <div className="ui-store-loading__stage">
        <div className="ui-store-loading__mark" aria-hidden>
          <span className="ui-store-loading__ring" />
          <span className="ui-store-loading__orbit" />
          <span className="ui-store-loading__core">
            {mark ?? initial ?? "·"}
          </span>
        </div>
        {(brand || label) && (
          <div className="ui-store-loading__copy">
            {brand ? <p className="ui-store-loading__brand">{brand}</p> : null}
            {label ? <p className="ui-store-loading__status">{label}</p> : null}
          </div>
        )}
        <div className="ui-store-loading__track" aria-hidden>
          <span className="ui-store-loading__bar" />
        </div>
      </div>
    </div>
  );
}

export type StoreProductGridSkeletonProps = {
  cards?: number;
  className?: string;
  shimmer?: boolean;
};

/** PLP-shaped skeleton — Soft boutique product grid while catalog loads. */
export function StoreProductGridSkeleton({
  cards = 6,
  className,
  shimmer = true,
}: StoreProductGridSkeletonProps) {
  const variant = shimmer ? "shimmer" : "pulse";
  return (
    <div
      className={cn("ui-store-grid-skeleton", className)}
      role="status"
      aria-label="Loading products"
      aria-busy="true"
    >
      {Array.from({ length: cards }, (_, i) => (
        <div key={i} className="ui-store-grid-skeleton__card" style={{ "--i": i } as React.CSSProperties}>
          <Skeleton variant={variant} className="aspect-[4/5] w-full rounded-[var(--radius)]" />
          <Skeleton variant={variant} className="mt-3 h-3 w-2/3" />
          <Skeleton variant={variant} className="mt-2 h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

/** Escape text for safe insertion into HTML attribute / text nodes. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Markup string for vanilla `store-chrome.js` inline loader.
 * Pass the localized label from the chrome dictionary — this helper is CSS/structure only, not copy SSOT.
 */
export function storeLoadingInlineHtml(label: string): string {
  const safe = escapeHtml(label);
  return `<div class="ui-store-loading ui-store-loading--inline" role="status" aria-busy="true" aria-live="polite" aria-label="${safe}"><div class="ui-store-loading__stage"><div class="ui-store-loading__mark" aria-hidden="true"><span class="ui-store-loading__ring"></span><span class="ui-store-loading__orbit"></span><span class="ui-store-loading__core">·</span></div><div class="ui-store-loading__copy"><p class="ui-store-loading__status">${safe}</p></div><div class="ui-store-loading__track" aria-hidden="true"><span class="ui-store-loading__bar"></span></div></div></div>`;
}

/**
 * @deprecated Use {@link storeLoadingInlineHtml} with an explicit label.
 * Hardcoded EN string kept only for transitional callers — not copy SSOT.
 */
export const STORE_LOADING_INLINE_HTML = storeLoadingInlineHtml("Loading cart…");
