import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Select } from "../components/select";
import { platformGlobals } from "../../.storybook/theme";
import { FilterBar } from "./filter-bar";

const meta = {
  title: "Patterns/FilterBar",
  component: FilterBar,
  globals: platformGlobals,
} satisfies Meta<typeof FilterBar>;

export default meta;
type Story = StoryObj<typeof FilterBar>;

export const AdminList: Story = {
  render: () => (
    <FilterBar trailing={<Button size="sm">Export</Button>}>
      <Input placeholder="Search orders…" className="max-w-xs" />
      <Select defaultValue="all" aria-label="Status">
        <option value="all">All statuses</option>
        <option value="paid">Paid</option>
        <option value="fulfilled">Fulfilled</option>
      </Select>
    </FilterBar>
  ),
};
