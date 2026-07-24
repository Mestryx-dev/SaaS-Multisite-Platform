import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { AlertTriangle, Info, X } from "lucide-react";
import { cn } from "../lib/utils";

const alertVariants = cva(
  "relative w-full rounded-[var(--radius)] border px-4 py-3 text-sm",
  {
    variants: {
      tone: {
        error:
          "border-[var(--destructive)]/40 bg-[var(--destructive)]/10 text-[var(--foreground)]",
        info: "border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
        /** Soft amber banner (upsell / enterprise) — dark-safe. */
        warning:
          "ui-alert-warning border text-[var(--foreground)]",
      },
    },
    defaultVariants: { tone: "error" },
  },
);

export type AlertProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  tone?: NonNullable<VariantProps<typeof alertVariants>["tone"]>;
  /** Optional bold title row (Stalwart “Enterprise feature”). */
  title?: ReactNode;
  /** Show leading tone icon. Default true when title is set. */
  showIcon?: boolean;
  /** Dismiss control — caller owns visibility state. */
  onDismiss?: () => void;
};

export function Alert({
  children,
  tone = "error",
  title,
  showIcon,
  onDismiss,
  className,
  role = "alert",
  ...rest
}: AlertProps) {
  const withIcon = showIcon ?? Boolean(title);
  const Icon = tone === "warning" ? AlertTriangle : Info;

  return (
    <div
      role={role}
      className={cn(alertVariants({ tone }), className)}
      {...rest}
    >
      <div className="flex gap-3">
        {withIcon ? (
          <span
            className={cn(
              "mt-0.5 shrink-0 [&_svg]:size-4",
              tone === "warning" && "ui-alert-warning-icon",
              tone === "error" && "text-[var(--destructive)]",
              tone === "info" && "text-[var(--muted-foreground)]",
            )}
            aria-hidden
          >
            <Icon />
          </span>
        ) : null}
        <div className="min-w-0 flex-1 space-y-0.5 pr-6">
          {title ? (
            <p className="font-semibold leading-snug text-[var(--foreground)]">
              {title}
            </p>
          ) : null}
          <div
            className={cn(
              "leading-snug",
              title
                ? "text-[var(--muted-foreground)]"
                : "text-[var(--foreground)]",
            )}
          >
            {children}
          </div>
        </div>
        {onDismiss ? (
          <button
            type="button"
            className="absolute right-2 top-2 rounded-[var(--radius)] p-1 text-[var(--muted-foreground)] transition-colors hover:bg-[var(--muted)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
            aria-label="Dismiss"
            onClick={onDismiss}
          >
            <X className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}
