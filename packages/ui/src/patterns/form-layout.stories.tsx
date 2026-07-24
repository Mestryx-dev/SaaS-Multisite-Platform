import type { Meta, StoryObj } from "@storybook/react-vite";
import { platformGlobals } from "../../.storybook/theme";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Select } from "../components/select";
import {
  FormActions,
  FormField,
  FormPanel,
  FormRow,
} from "./form-layout";

const meta = {
  title: "Patterns/FormLayout",
  component: FormPanel,
  globals: platformGlobals,
} satisfies Meta<typeof FormPanel>;

export default meta;
type Story = StoryObj<typeof FormPanel>;

export const SiteSettingsDemo: Story = {
  name: "Site settings density",
  render: () => (
    <FormPanel title="Site settings — Luna Bijoux" width="lg">
      <FormField label="Cookie policy path" htmlFor="policy" size="sm">
        <Input id="policy" defaultValue="/privacy" className="font-mono text-xs" />
      </FormField>
      <FormActions>
        <Button type="button" variant="secondary" size="sm">
          Ensure legal pages
        </Button>
        <span className="text-xs text-[var(--muted-foreground)]">
          Edit copy under Pages.
        </span>
      </FormActions>
      <p className="text-sm font-semibold">Theme</p>
      <FormField label="Theme preset" htmlFor="preset" size="md">
        <Select id="preset" defaultValue="luna">
          <option value="storefront-base">Storefront base</option>
          <option value="luna">Luna</option>
        </Select>
      </FormField>
      <FormRow cols={3}>
        <FormField label="Primary" htmlFor="primary" size="full">
          <Input id="primary" defaultValue="#c45d8a" className="font-mono text-xs" />
        </FormField>
        <FormField label="Accent" htmlFor="accent" size="full">
          <Input id="accent" defaultValue="#c45d8a" className="font-mono text-xs" />
        </FormField>
        <FormField label="Background" htmlFor="bg" size="full">
          <Input id="bg" defaultValue="#f4f0e8" className="font-mono text-xs" />
        </FormField>
      </FormRow>
      <FormField label="Logo URL" htmlFor="logo" size="lg" hint="Optional CDN URL">
        <Input id="logo" placeholder="https://…" className="font-mono text-xs" />
      </FormField>
      <FormActions>
        <Button type="button" variant="secondary" size="sm">
          Save theme
        </Button>
      </FormActions>
    </FormPanel>
  ),
};

export const CompactWidths: Story = {
  render: () => (
    <div className="grid gap-4">
      <FormPanel width="md">
        <FormField size="sm">
          <Input aria-label="md panel" defaultValue="md / no label" />
        </FormField>
      </FormPanel>
      <FormPanel width="xl" title="XL panel">
        <FormRow>
          <FormField label="Left" htmlFor="l" size="full">
            <Input id="l" />
          </FormField>
          <FormField label="Right" htmlFor="r" size="full">
            <Input id="r" />
          </FormField>
        </FormRow>
      </FormPanel>
      <FormPanel width="full">
        <FormField label="Full width" htmlFor="f" size="full">
          <Input id="f" />
        </FormField>
      </FormPanel>
    </div>
  ),
};
