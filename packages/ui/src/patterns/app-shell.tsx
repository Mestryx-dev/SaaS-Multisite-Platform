import React, { useEffect, useId, useState } from "react";
import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../lib/utils";

export type AppShellProps = {
  brand: ReactNode;
  nav: ReactNode;
  /**
   * Optional left top-bar context (rare). Prefer PageHeader for page titles —
   * shell top bar is utilities-only by default.
   */
  breadcrumb?: ReactNode;
  /** Right top-bar actions (Cmd+K, auth). */
  topBar?: ReactNode;
  /** Leading control in the top bar (mobile menu). Shown on all breakpoints when set. */
  topBarLeading?: ReactNode;
  sidebarFooter?: ReactNode;
  /** Collapse sidebar to icon rail (Dokploy-style). Desktop only. */
  sidebarCollapsed?: boolean;
  onSidebarCollapsedChange?: (collapsed: boolean) => void;
  /** Optional control rendered next to brand in the unified header (e.g. collapse toggle). */
  brandActions?: ReactNode;
  children: ReactNode;
};

export function AppShell({
  brand,
  nav,
  breadcrumb,
  topBar,
  topBarLeading,
  sidebarFooter,
  sidebarCollapsed = false,
  brandActions,
  children,
}: AppShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-[image:var(--background-ambient)] bg-[var(--background)] text-[var(--foreground)]">
      <header className="glass-chrome sticky top-0 z-40 flex h-[var(--app-header-height)] shrink-0 items-center gap-2 border-b border-[var(--border)] px-3 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 shrink-0 items-center gap-2">
          {topBarLeading}
          <span
            className="min-w-0 truncate text-[0.95rem] font-semibold tracking-[-0.02em] text-[var(--foreground)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {brand}
          </span>
          {brandActions}
          {breadcrumb ? (
            <div className="hidden min-w-0 truncate text-sm text-[var(--muted-foreground)] md:block">
              {breadcrumb}
            </div>
          ) : null}
        </div>
        {topBar ? (
          <div className="ml-auto flex shrink-0 items-center gap-2">{topBar}</div>
        ) : null}
      </header>

      <div className="relative flex min-h-0 min-w-0 flex-1">
        <aside
          className={cn(
            "hidden min-h-0 flex-col border-[var(--sidebar-border)] bg-[var(--sidebar)] md:sticky md:top-[var(--app-header-height)] md:flex md:h-[calc(100svh-var(--app-header-height))] md:shrink-0 md:border-r",
            sidebarCollapsed ? "md:w-14 md:items-stretch" : "md:w-64",
          )}
        >
          <nav
            className="ui-sidebar-nav-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 pb-3 pt-4"
            aria-label="Primary"
          >
            <div className="flex flex-col gap-3">{nav}</div>
          </nav>
          {sidebarFooter && !sidebarCollapsed ? (
            <div className="mt-auto shrink-0 border-t border-[var(--sidebar-border)] p-3 text-xs text-[var(--muted-foreground)]">
              {sidebarFooter}
            </div>
          ) : null}
        </aside>
        <main className="min-w-0 flex-1 p-4 md:p-6 xl:px-8 xl:py-6">{children}</main>
      </div>
    </div>
  );
}

export type AuthShellProps = {
  children: ReactNode;
  /** Optional brand glyph above the auth form (e.g. monogram). */
  mark?: ReactNode;
  /** Product / console name under the mark. */
  productName?: ReactNode;
  className?: string;
};

export function AuthShell({
  children,
  mark,
  productName,
  className,
}: AuthShellProps) {
  return (
    <main
      className={cn(
        "mx-auto flex min-h-screen max-w-md flex-col justify-center bg-[image:var(--background-ambient)] bg-[var(--background)] px-4 py-10 text-[var(--foreground)]",
        className,
      )}
    >
      {mark || productName ? (
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          {mark ? <div className="shrink-0">{mark}</div> : null}
          {productName ? (
            <p
              className="text-base font-semibold tracking-[-0.03em] text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {productName}
            </p>
          ) : null}
        </div>
      ) : null}
      {children}
    </main>
  );
}

function readStoredOpen(key: string | undefined, fallback: boolean): boolean {
  if (!key || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === "1") return true;
    if (raw === "0") return false;
  } catch {
    /* ignore */
  }
  return fallback;
}

function writeStoredOpen(key: string | undefined, open: boolean) {
  if (!key || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, open ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export type NavSectionProps = {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
  /**
   * Dokploy default: false = static group label + flat links.
   * true = optional accordion (e.g. long Commerce group).
   */
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  active?: boolean;
  storageKey?: string;
  /** When sidebar is icon-rail, hide the group label. */
  collapsed?: boolean;
};

/** Sidebar group — Dokploy flat labels by default; optional accordion. */
export function NavSection({
  label,
  children,
  className,
  icon,
  collapsible = false,
  defaultOpen = true,
  open: openControlled,
  onOpenChange,
  active = false,
  storageKey,
  collapsed = false,
}: NavSectionProps) {
  const reactId = useId();
  const panelId = `nav-section-${reactId}`;
  const isControlled = openControlled !== undefined;
  const [openUncontrolled, setOpenUncontrolled] = useState(() =>
    active ? true : readStoredOpen(storageKey, defaultOpen),
  );

  const open = isControlled ? Boolean(openControlled) : openUncontrolled;

  function setOpen(next: boolean) {
    if (!isControlled) {
      setOpenUncontrolled(next);
      writeStoredOpen(storageKey, next);
    }
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!active || !collapsible) return;
    if (isControlled) {
      onOpenChange?.(true);
      return;
    }
    setOpenUncontrolled(true);
    writeStoredOpen(storageKey, true);
  }, [active, collapsible, isControlled, onOpenChange, storageKey]);

  if (!collapsible) {
    return (
      <div className={cn("flex flex-col", className)}>
        {!collapsed ? (
          <p className="ui-sidebar-section-label mb-1 px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em]">
            {label}
          </p>
        ) : null}
        <div className="flex flex-col gap-0.5">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col", className)}
      data-open={open ? "true" : "false"}
    >
      <button
        type="button"
        className={cn(
          "ui-sidebar-section-trigger mb-1 flex w-full items-center justify-between gap-2 rounded-md px-2.5 py-1.5 text-left transition-colors",
          active && "ui-sidebar-section-trigger-active",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-ring)]",
          collapsed && "justify-center px-2",
        )}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
        title={typeof label === "string" ? label : undefined}
      >
        {icon ? (
          <span
            className="flex size-3.5 shrink-0 items-center justify-center [&_svg]:size-3.5"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        {!collapsed ? (
          <>
            <span className="ui-sidebar-section-label min-w-0 flex-1 truncate text-[11px] font-semibold uppercase tracking-[0.14em]">
              {label}
            </span>
            <ChevronDown
              className={cn(
                "size-3.5 shrink-0 opacity-80 transition-transform duration-200 motion-reduce:transition-none",
                open ? "rotate-0" : "-rotate-90",
              )}
              aria-hidden
            />
          </>
        ) : null}
      </button>
      <div
        id={panelId}
        role="region"
        hidden={!open}
        className={cn("flex flex-col gap-0.5", !open && "hidden")}
      >
        {children}
      </div>
    </div>
  );
}

export type NavLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  active?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  /** Icon-only rail mode. */
  collapsed?: boolean;
};

export function NavLink({
  active = false,
  className,
  children,
  icon,
  collapsed = false,
  ...rest
}: NavLinkProps) {
  return (
    <a
      className={cn(
        navLinkClassName(active),
        collapsed && "justify-center px-2",
        className,
      )}
      data-active={active ? "true" : "false"}
      title={collapsed && typeof children === "string" ? children : undefined}
      {...rest}
    >
      {icon ? (
        <span
          className="flex size-4 shrink-0 items-center justify-center [&_svg]:size-4"
          aria-hidden
        >
          {icon}
        </span>
      ) : null}
      {!collapsed ? children : <span className="sr-only">{children}</span>}
    </a>
  );
}

/** Night-gold sidebar link — gap/type/padding aligned to platform chrome lock. */
export function navLinkClassName(active: boolean, className = "") {
  return cn(
    "ui-sidebar-link group flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--sidebar-ring)]",
    active ? "ui-sidebar-link-active" : null,
    className,
  );
}

export function Sidebar({
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <aside
      className={cn(
        "flex flex-col border-r border-[var(--border)] bg-[var(--sidebar)]",
        className,
      )}
      {...rest}
    >
      {children}
    </aside>
  );
}
