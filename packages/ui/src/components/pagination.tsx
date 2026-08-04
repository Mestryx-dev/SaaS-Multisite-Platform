import React, { type ButtonHTMLAttributes, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { Button } from "./button";

export type PaginationProps = {
  children: ReactNode;
  className?: string;
};

export function Pagination({ children, className }: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      {children}
    </nav>
  );
}

export function PaginationContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-row items-center gap-1", className)}>
      {children}
    </ul>
  );
}

export function PaginationItem({ children }: { children: ReactNode }) {
  return <li>{children}</li>;
}

export type PaginationLinkProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  isActive?: boolean;
  children: ReactNode;
};

export function PaginationLink({
  className,
  isActive,
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      type="button"
      variant={isActive ? "primary" : "outline"}
      size="icon"
      className={cn("h-9 w-9", className)}
      aria-current={isActive ? "page" : undefined}
      {...props}
    >
      {children}
    </Button>
  );
}

export function PaginationPrevious(
  props: ButtonHTMLAttributes<HTMLButtonElement>,
) {
  return (
    <Button type="button" variant="outline" size="sm" {...props}>
      <ChevronLeft className="size-3.5" aria-hidden />
      Prev
    </Button>
  );
}

export function PaginationNext(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <Button type="button" variant="outline" size="sm" {...props}>
      Next
      <ChevronRight className="size-3.5" aria-hidden />
    </Button>
  );
}

export type PaginationPrevNextProps = {
  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  className?: string;
};

/**
 * Compact Prev | Next cluster (Stalwart list footer).
 */
export function PaginationPrevNext({
  onPrevious,
  onNext,
  previousDisabled,
  nextDisabled,
  className,
}: PaginationPrevNextProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center overflow-hidden rounded-[var(--radius)] border border-[var(--border)]",
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-none border-0"
        disabled={previousDisabled}
        onClick={onPrevious}
      >
        <ChevronLeft className="size-3.5" aria-hidden />
        Prev
      </Button>
      <span
        className="h-6 w-px shrink-0 bg-[var(--border)]"
        aria-hidden
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="rounded-none border-0"
        disabled={nextDisabled}
        onClick={onNext}
      >
        Next
        <ChevronRight className="size-3.5" aria-hidden />
      </Button>
    </div>
  );
}
