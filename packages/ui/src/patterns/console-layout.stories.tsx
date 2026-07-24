import type { Meta, StoryObj } from "@storybook/react-vite";
import { platformGlobals } from "../../.storybook/theme";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Input } from "../components/input";
import { Table, Tbody, Td, Th, Thead, Tr } from "../components/table";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/breadcrumb";
import { FilterBar } from "./filter-bar";
import { FormActions, FormField, FormPanel } from "./form-layout";
import { PageContent } from "./page-content";
import { PageHeader } from "./page-header";
import { SplitLayout } from "./split-layout";
import { Stack } from "../components/stack";
import { TableFrame } from "./table-frame";

const meta = {
  title: "Patterns/ConsoleLayout",
  globals: platformGlobals,
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const List: Story = {
  name: "List — header · filter · table",
  render: () => (
    <PageContent className="p-4 md:p-5">
      <Stack gap="md">
        <PageHeader
          eyebrow="Commerce"
          title="Orders"
          description="List template: FilterBar + TableFrame."
          actions={
            <Button size="sm" variant="secondary">
              Export
            </Button>
          }
        />
        <FilterBar>
          <Input placeholder="Search…" className="max-w-xs" aria-label="Search" />
        </FilterBar>
        <TableFrame>
          <Table>
            <Thead>
              <Tr>
                <Th>Order</Th>
                <Th>Status</Th>
                <Th>Total</Th>
              </Tr>
            </Thead>
            <Tbody>
              <Tr>
                <Td>ORD-1042</Td>
                <Td>
                  <Badge>paid</Badge>
                </Td>
                <Td>€84.00</Td>
              </Tr>
              <Tr>
                <Td>ORD-1041</Td>
                <Td>
                  <Badge tone="success">fulfilled</Badge>
                </Td>
                <Td>€32.50</Td>
              </Tr>
            </Tbody>
          </Table>
        </TableFrame>
      </Stack>
    </PageContent>
  ),
};

export const Settings: Story = {
  name: "Settings — header · FormPanel",
  render: () => (
    <PageContent className="p-4 md:p-5">
      <Stack gap="md">
        <PageHeader
          eyebrow="Workspace"
          title="Site settings"
          description="Settings template: capped FormPanel."
        />
        <FormPanel title="Theme" width="lg">
          <FormField label="Preset" htmlFor="preset" size="md">
            <Input id="preset" defaultValue="luna" />
          </FormField>
          <FormActions>
            <Button size="sm">Save</Button>
          </FormActions>
        </FormPanel>
      </Stack>
    </PageContent>
  ),
};

export const Split: Story = {
  name: "Split — list | aside form",
  render: () => (
    <PageContent maxWidth="wide" className="p-4 md:p-5">
      <Stack gap="md">
        <PageHeader
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#">Orders</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Detail</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
          title="Organizations"
          description="SplitLayout: primary table + aside FormPanel."
        />
        <SplitLayout
          primary={
            <TableFrame>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Name</Th>
                    <Th>Role</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  <Tr>
                    <Td>Luna Bijoux</Td>
                    <Td>owner</Td>
                  </Tr>
                </Tbody>
              </Table>
            </TableFrame>
          }
          aside={
            <FormPanel title="Create organization" width="full">
              <FormField label="Name" htmlFor="n" size="full">
                <Input id="n" />
              </FormField>
              <FormActions>
                <Button size="sm">Create</Button>
              </FormActions>
            </FormPanel>
          }
        />
      </Stack>
    </PageContent>
  ),
};
