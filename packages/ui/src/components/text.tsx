import React from "react";
import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../lib/utils";

export type TextProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: ElementType;
};

export function Text({
  children,
  className,
  as: Comp = "p",
  ...rest
}: TextProps) {
  return (
    <Comp className={cn("text-sm text-[var(--foreground)]", className)} {...rest}>
      {children}
    </Comp>
  );
}

export function Muted({
  children,
  className,
  as: Comp = "p",
  ...rest
}: TextProps) {
  return (
    <Comp
      className={cn("text-sm text-[var(--muted-foreground)]", className)}
      {...rest}
    >
      {children}
    </Comp>
  );
}
