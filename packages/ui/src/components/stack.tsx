import React from "react";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export type StackProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  gap?: "sm" | "md" | "lg";
};

const gapClass = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
} as const;

export function Stack({
  children,
  gap = "md",
  className,
  ...rest
}: StackProps) {
  return (
    <div className={cn("flex flex-col", gapClass[gap], className)} {...rest}>
      {children}
    </div>
  );
}
