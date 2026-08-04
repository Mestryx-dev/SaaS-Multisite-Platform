import React from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export type CardVariant = "panel" | "ghost";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /** panel = bordered surface; ghost = padding only (anti card-in-card). Default panel. */
  variant?: CardVariant;
};

export function Card({
  children,
  className,
  variant = "panel",
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius)] text-[var(--card-foreground)]",
        variant === "panel" &&
          "border border-[var(--border)] bg-[var(--card)] shadow-sm",
        variant === "ghost" && "bg-transparent",
        className,
      )}
      {...rest}
    >
      <div className="flex flex-col gap-3 p-4">{children}</div>
    </div>
  );
}
