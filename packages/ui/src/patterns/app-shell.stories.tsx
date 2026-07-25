import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  FileText,
  Globe,
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
} from "lucide-react";
import { platformGlobals } from "../../.storybook/theme";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { Table, Tbody, Td, Th, Thead, Tr } from "../components/table";
import { PageHeader } from "./page-header";
import { StatStrip } from "./stat-strip";
import { AppShell, AuthShell, NavLink, NavSection, Sidebar } from "./app-shell";

const meta = {
  title: "Patterns/AppShell",
  component: AppShell,
  globals: platformGlobals,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AppShell>;

export default meta;
type Story = StoryObj<typeof AppShell>;

export const PlatformIA: Story = {
  name: "Platform IA (unified header)",
  render: () => (
    <div className="-m-6">
      <AppShell
        brand="mestryx-platform"
        brandActions={
          <Button type="button" variant="ghost" size="icon" className="size-8">
            ≡
          </Button>
        }
        topBarLeading={
          <Button type="button" variant="ghost" size="icon" className="size-9 md:hidden">
            ☰
          </Button>
        }
        nav={
          <>
            <NavSection label="Overview">
              <NavLink href="#" active icon={<LayoutDashboard />}>
                Dashboard
              </NavLink>
            </NavSection>
            <NavSection label="Workspace">
              <NavLink href="#" icon={<Globe />}>
                Sites
              </NavLink>
            </NavSection>
            <NavSection label="Content">
              <NavLink href="#" icon={<FileText />}>
                Pages
              </NavLink>
              <NavLink href="#" icon={<FileText />}>
                Media
              </NavLink>
              <NavLink href="#" icon={<FileText />}>
                Menus
              </NavLink>
            </NavSection>
            <NavSection
              label="Commerce"
              collapsible
              defaultOpen={false}
              storageKey="story-nav-commerce"
            >
              <NavLink href="#" icon={<ShoppingBag />}>
                Products
              </NavLink>
              <NavLink href="#" icon={<Package />}>
                Orders
              </NavLink>
            </NavSection>
            <NavSection label="Organization">
              <NavLink href="#" icon={<Users />}>
                Members
              </NavLink>
            </NavSection>
          </>
        }
        topBar={
          <>
            <Button variant="secondary" size="sm">
              ⌘K
            </Button>
            <Button size="sm" variant="primary">
              Sign in
            </Button>
          </>
        }
        sidebarFooter={
          <div className="space-y-2">
            <p className="truncate text-[11px] font-medium">Luna Bijoux</p>
            <p className="truncate text-xs">demo@lunabijoux.local</p>
          </div>
        }
      >
        <PageHeader
          eyebrow="Overview"
          title="Dashboard"
          description="Unified full-bleed header; sidebar starts below --app-header-height."
        />
        <StatStrip
          items={[
            {
              label: "Organizations",
              value: "2",
              bullet: { current: 2, target: 2, caption: "2 / 2" },
            },
            {
              label: "Pending payment",
              value: "3",
              hint: "12 orders total",
              bullet: { current: 3, target: 12, caption: "3 pending of 12" },
            },
            {
              label: "Low stock",
              value: "1",
              hint: "24 products",
              bullet: { current: 1, target: 24, caption: "1 alert of 24" },
            },
            { label: "Theme", value: "Platform" },
          ]}
        />
        <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
          <div className="overflow-hidden rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]/60">
            <Table>
              <Thead>
                <Tr>
                  <Th>Organization</Th>
                  <Th>Role</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                <Tr>
                  <Td>Luna Bijoux</Td>
                  <Td>owner</Td>
                  <Td>
                    <Badge tone="success">active</Badge>
                  </Td>
                </Tr>
                <Tr>
                  <Td>Demo Org</Td>
                  <Td>admin</Td>
                  <Td>
                    <Badge tone="success">active</Badge>
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </div>
          <Card variant="panel">
            <p className="text-sm font-semibold">Create organization</p>
            <p className="text-xs text-[var(--muted-foreground)]">
              Single panel Card — list stays tabular.
            </p>
            <Button size="sm">Create</Button>
          </Card>
        </div>
      </AppShell>
    </div>
  ),
};

/** @deprecated Prefer PlatformIA */
export const Default: Story = PlatformIA;

export const Auth: Story = {
  render: () => (
    <AuthShell
      mark={
        <span className="flex size-12 items-center justify-center rounded-lg border border-[var(--primary)]/35 bg-[var(--card)] text-lg font-bold text-[var(--primary)]">
          M
        </span>
      }
      productName="mestryx-platform"
    >
      <Card variant="panel" className="w-full space-y-3">
        <h1 className="text-lg font-semibold">Sign in</h1>
        <Button className="w-full">Continue</Button>
      </Card>
    </AuthShell>
  ),
};

export const SidebarOnly: Story = {
  render: () => (
    <Sidebar className="min-h-[12rem] w-56 p-3">
      <NavSection label="Workspace">
        <NavLink href="#" active icon={<Globe />}>
          Sites
        </NavLink>
        <NavLink href="#" icon={<Users />}>
          Members
        </NavLink>
      </NavSection>
    </Sidebar>
  ),
};
