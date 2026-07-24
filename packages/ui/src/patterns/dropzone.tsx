import React, { type InputHTMLAttributes, ReactNode } from "react";
import { Upload } from "lucide-react";
import { cn } from "../lib/utils";

export type DropzoneProps = {
  label?: ReactNode;
  hint?: ReactNode;
  className?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
};

/**
 * Media upload surface — refs: Studio file-upload block.
 */
export function Dropzone({
  label = "Drop files or click to upload",
  hint = "PNG, JPG, WebP up to 5MB",
  className,
  inputProps,
}: DropzoneProps) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col items-center justify-center gap-2 border border-dashed border-[var(--border)] bg-[var(--muted)]/40 px-6 py-10 text-center transition-colors hover:bg-[var(--muted)]/70 focus-within:ring-2 focus-within:ring-[var(--ring)]",
        className,
      )}
      style={{ borderRadius: "var(--radius)" }}
    >
      <Upload className="size-6 text-[var(--muted-foreground)]" aria-hidden />
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {hint ? (
        <span className="text-xs text-[var(--muted-foreground)]">{hint}</span>
      ) : null}
      <input
        type="file"
        className="absolute inset-0 cursor-pointer opacity-0"
        {...inputProps}
      />
    </label>
  );
}
