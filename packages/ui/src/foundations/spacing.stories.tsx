import type { Meta, StoryObj } from "@storybook/react-vite";
import { storefrontGlobals } from "../../.storybook/theme";

const meta = {
  title: "Foundations/Spacing",
  globals: storefrontGlobals,
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** 8 / 16 / 24 / 32 + radius token (Soft boutique storefront 8px / platform 8px). */
export const Scale: Story = {
  render: () => (
    <div className="space-y-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
          Spacing
        </p>
        {[8, 16, 24, 32].map((px) => (
          <div key={px} className="flex items-center gap-4">
            <span className="w-12 text-xs text-[var(--muted-foreground)]">{px}px</span>
            <div
              className="h-4 bg-[var(--primary)]"
              style={{ width: px * 4, borderRadius: "var(--radius)" }}
            />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
          Radius — var(--radius)
        </p>
        <div className="flex gap-4">
          <div
            className="flex h-16 w-16 items-center justify-center border border-[var(--border)] bg-[var(--card)] text-xs"
            style={{ borderRadius: "var(--radius)" }}
          >
            lg
          </div>
          <div
            className="flex h-16 w-16 items-center justify-center border border-[var(--border)] bg-[var(--card)] text-xs"
            style={{ borderRadius: "calc(var(--radius) * 0.6)" }}
          >
            sm
          </div>
        </div>
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">
        Decision: <code>shared</code> scale; radius differs by theme. Refs: DESIGN.md spacing.
      </p>
    </div>
  ),
};
