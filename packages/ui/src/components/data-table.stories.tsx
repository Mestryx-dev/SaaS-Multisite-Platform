import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge";
import { DataTable } from "./data-table";
import { FilterBar } from "../patterns/filter-bar";
import { Input } from "./input";
import { platformGlobals } from "../../.storybook/theme";

type Row = { id: string; order: string; status: string; total: string };

const rows: Row[] = [
  { id: "1", order: "ORD-1042", status: "paid", total: "€84.00" },
  { id: "2", order: "ORD-1041", status: "fulfilled", total: "€32.50" },
  { id: "3", order: "ORD-1040", status: "pending", total: "€120.00" },
];

const meta = {
  title: "Components/DataTable",
  component: DataTable,
  globals: platformGlobals,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
} satisfies Meta<typeof DataTable>;

export default meta;
type Story = StoryObj<typeof DataTable>;

export const Orders: Story = {
  render: () => (
    <DataTable
      rows={rows}
      getRowId={(r) => r.id}
      toolbar={
        <FilterBar>
          <Input placeholder="Search orders…" className="max-w-xs" />
        </FilterBar>
      }
      columns={[
        { id: "order", header: "Order", cell: (r) => r.order },
        {
          id: "status",
          header: "Status",
          cell: (r) => <Badge>{r.status}</Badge>,
        },
        { id: "total", header: "Total", cell: (r) => r.total },
      ]}
    />
  ),
};

export const Loading: Story = {
  render: () => (
    <DataTable
      rows={[]}
      getRowId={(r: Row) => r.id}
      loading
      columns={[
        { id: "order", header: "Order", cell: (r) => r.order },
        { id: "total", header: "Total", cell: (r) => r.total },
      ]}
    />
  ),
};

export const Empty: Story = {
  render: () => (
    <DataTable
      rows={[]}
      getRowId={(r: Row) => r.id}
      emptyTitle="No orders yet"
      emptyDescription="Create an order to see it here."
      columns={[
        { id: "order", header: "Order", cell: (r) => r.order },
        { id: "total", header: "Total", cell: (r) => r.total },
      ]}
    />
  ),
};
