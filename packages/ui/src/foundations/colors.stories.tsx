import type { Meta, StoryObj } from "@storybook/react-vite";
import { storefrontGlobals } from "../../.storybook/theme";

const meta = {
  title: "Foundations/Colors",
  globals: storefrontGlobals,
} satisfies Meta;

export default meta;
type Story = StoryObj;

const core = [
  ["background", "var(--background)"],
  ["foreground", "var(--foreground)"],
  ["card", "var(--card)"],
  ["primary", "var(--primary)"],
  ["secondary", "var(--secondary)"],
  ["muted", "var(--muted)"],
  ["muted-fg", "var(--muted-foreground)"],
  ["accent", "var(--accent)"],
  ["destructive", "var(--destructive)"],
  ["border", "var(--border)"],
  ["ring", "var(--ring)"],
] as const;

const chrome = [
  ["glass-bg", "var(--glass-bg)"],
  ["glass-border", "var(--glass-border)"],
  ["glow-accent", "var(--glow-accent)"],
  ["primary-muted", "var(--primary-muted)"],
] as const;

const sidebar = [
  ["sidebar", "var(--sidebar)"],
  ["sidebar-primary", "var(--sidebar-primary)"],
  ["sidebar-accent", "var(--sidebar-accent)"],
  ["sidebar-border", "var(--sidebar-border)"],
] as const;

const charts = [
  ["chart-1", "var(--chart-1)"],
  ["chart-2", "var(--chart-2)"],
  ["chart-3", "var(--chart-3)"],
  ["chart-4", "var(--chart-4)"],
  ["chart-5", "var(--chart-5)"],
] as const;

function SwatchGrid({
  title,
  items,
}: {
  title: string;
  items: readonly (readonly [string, string])[];
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
        {title}
      </p>
      <div className="flex flex-wrap gap-3">
        {items.map(([name, color]) => (
          <div key={name} className="w-24">
            <div
              className="h-12 rounded-[var(--radius)] border border-[var(--border)] shadow-sm"
              style={{ background: color }}
            />
            <p className="mt-1 text-xs text-[var(--muted-foreground)]">{name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Full shadcn lexicon — toggle theme toolbar (shared decision). */
export const Palette: Story = {
  render: () => (
    <div className="space-y-8">
      <SwatchGrid title="Core" items={core} />
      <SwatchGrid title="Chrome glass" items={chrome} />
      <SwatchGrid title="Sidebar" items={sidebar} />
      <SwatchGrid title="Charts" items={charts} />
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Ambient (F-03 / F-04)
        </p>
        <div
          className="h-24 w-full max-w-md rounded-[var(--radius)] border border-[var(--border)]"
          style={{ backgroundImage: "var(--background-ambient)", backgroundColor: "var(--background)" }}
        />
      </div>
      <div className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
          Glass panel
        </p>
        <div className="glass-panel max-w-md rounded-[var(--radius)] px-4 py-3 text-sm">
          Chrome only — top bar / sticky panels / KPI shell
        </div>
      </div>
      <p className="text-sm text-[var(--muted-foreground)]">
        Decision: <code>shared</code> — values from tokens / presets only. Platform Obsidian Soft;
        storefront Soft boutique. Refs: DESIGN.md, ADR-0003.
      </p>
    </div>
  ),
};
