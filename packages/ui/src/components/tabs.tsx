import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({
  className,
  variant = "muted",
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & {
  /** `pills` — Dokploy segmented control (bordered group). */
  variant?: "muted" | "pills";
}) {
  return (
    <TabsPrimitive.List
      className={cn(
        "inline-flex items-center justify-center text-[var(--muted-foreground)]",
        variant === "muted" &&
          "h-10 rounded-[var(--radius)] bg-[var(--muted)] p-1",
        variant === "pills" &&
          "h-9 gap-0.5 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]/60 p-0.5",
        className,
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-[calc(var(--radius)-2px)] px-3 py-1.5 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:pointer-events-none disabled:opacity-50",
        "data-[state=active]:bg-[var(--card)] data-[state=active]:text-[var(--foreground)] data-[state=active]:shadow-sm",
        "data-[state=inactive]:hover:text-[var(--foreground)]",
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "mt-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]",
        className,
      )}
      {...props}
    />
  );
}
