import type { Meta, StoryObj } from "@storybook/react-vite";
import { storefrontGlobals } from "../../.storybook/theme";

const meta = {
  title: "Foundations/Typography",
  globals: storefrontGlobals,
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** Specimens — toggle theme: platform = Plus Jakarta display + Inter; storefront = Fraunces + Plex. */
export const Specimens: Story = {
  render: () => (
    <div className="max-w-xl space-y-8">
      <div>
        <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
          Display — var(--font-display)
        </p>
        <p
          className="type-display mt-1 text-4xl tracking-tight"
          style={{ fontFamily: "var(--font-display)" }}
        >
          The quick brown fox
        </p>
      </div>
      <div className="space-y-2" style={{ fontFamily: "var(--font-sans)" }}>
        <p className="text-xs uppercase tracking-wide text-[var(--muted-foreground)]">
          Body — var(--font-sans)
        </p>
        <p className="text-3xl font-semibold tracking-tight">Heading 1 / 1.875rem</p>
        <p className="text-2xl font-semibold tracking-tight">Heading 2 / 1.5rem</p>
        <p className="text-xl font-medium">Heading 3 / 1.25rem</p>
        <p className="text-base leading-relaxed">
          Body — precise, calm product copy. Platform: Inter; storefront: IBM Plex Sans.
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">Muted / secondary text</p>
        <p className="text-xs text-[var(--muted-foreground)]">Caption / meta</p>
      </div>
      <div className="space-y-2">
        <p className="type-kpi-label text-[10px]">KPI label</p>
        <p className="type-kpi-value">1,284</p>
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">
        Decision: platform night-gold uses Plus Jakarta for display/KPI; storefront keeps Fraunces.
        Refs: DESIGN.md, ADR-0003.
      </p>
    </div>
  ),
};
