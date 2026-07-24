import React from "react";
import type { ReactNode } from "react";
import { cn } from "../lib/utils";
import { Card } from "../components/card";
import { Label } from "../components/label";
import { Stack } from "../components/stack";

export type FormPanelWidth = "md" | "lg" | "xl" | "full";

const panelWidthClass: Record<FormPanelWidth, string> = {
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
  full: "max-w-none w-full",
};

export type FormPanelProps = {
  children: ReactNode;
  title?: ReactNode;
  /**
   * Default xl for settings panels in a fluid console.
   * Use md/lg inside SplitLayout formAside or dialogs.
   */
  width?: FormPanelWidth;
  className?: string;
};

/**
 * Settings / create form surface — platform density.
 * Input/Select stay w-full inside FormField; panel caps reading width when set.
 */
export function FormPanel({
  children,
  title,
  width = "xl",
  className,
}: FormPanelProps) {
  return (
    <Card variant="panel" className={cn(panelWidthClass[width], className)}>
      {title ? (
        <h2 className="text-sm font-semibold text-[var(--foreground)]">{title}</h2>
      ) : null}
      <Stack gap="sm">{children}</Stack>
    </Card>
  );
}

export type FormFieldSize = "sm" | "md" | "lg" | "full";

const fieldSizeClass: Record<FormFieldSize, string> = {
  sm: "max-w-xs",
  md: "max-w-sm",
  lg: "max-w-xl",
  full: "w-full max-w-none",
};

export type FormFieldProps = {
  children: ReactNode;
  label?: ReactNode;
  htmlFor?: string;
  size?: FormFieldSize;
  hint?: ReactNode;
  className?: string;
};

/** Label + control with capped width (size). Control itself remains w-full of this box. */
export function FormField({
  children,
  label,
  htmlFor,
  size = "md",
  hint,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1", fieldSizeClass[size], className)}>
      {label ? <Label htmlFor={htmlFor}>{label}</Label> : null}
      {children}
      {hint ? (
        <p className="text-xs text-[var(--muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}

export type FormRowProps = {
  children: ReactNode;
  cols?: 2 | 3;
  className?: string;
};

/** Responsive field cluster (colors, price/stock, etc.). */
export function FormRow({ children, cols = 2, className }: FormRowProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        cols === 2 && "sm:grid-cols-2",
        cols === 3 && "sm:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type FormActionsProps = {
  children: ReactNode;
  className?: string;
};

/** Action row — buttons keep natural width (no Stack stretch). */
export function FormActions({ children, className }: FormActionsProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 pt-1", className)}>
      {children}
    </div>
  );
}
