import React from "react";
import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react";
import { cn } from "../lib/utils";

export function Table({
  className,
  ...rest
}: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="relative w-full overflow-auto">
      <table
        className={cn("w-full caption-bottom text-sm", className)}
        {...rest}
      />
    </div>
  );
}

export function Thead({
  className,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b", className)} {...rest} />;
}

export function Tbody({
  className,
  ...rest
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={cn("[&_tr:last-child]:border-0", className)} {...rest} />
  );
}

export function Tr({
  className,
  ...rest
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--border)] transition-colors hover:bg-[var(--muted)]/50",
        className,
      )}
      {...rest}
    />
  );
}

export function Th({
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-9 px-3 text-left align-middle text-xs font-semibold text-[var(--muted-foreground)]",
        className,
      )}
      {...rest}
    />
  );
}

export function Td({
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-3 py-1.5 align-middle text-[var(--foreground)]",
        className,
      )}
      {...rest}
    />
  );
}
