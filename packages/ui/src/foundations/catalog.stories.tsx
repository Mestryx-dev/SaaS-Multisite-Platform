import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ReactNode } from "react";
import { storefrontGlobals } from "../../.storybook/theme";
import { Alert } from "../components/alert";
import { Avatar, AvatarFallback } from "../components/avatar";
import { Badge } from "../components/badge";
import { Button } from "../components/button";
import { Card } from "../components/card";
import { Checkbox } from "../components/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu";
import { EmptyState } from "../components/empty-state";
import { Input } from "../components/input";
import { Label } from "../components/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../components/sheet";
import { Select } from "../components/select";
import { Separator } from "../components/separator";
import { Skeleton } from "../components/skeleton";
import { Stack } from "../components/stack";
import { Table, Tbody, Td, Th, Thead, Tr } from "../components/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/tabs";
import { Text, Muted } from "../components/text";
import { Textarea } from "../components/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/tooltip";

/**
 * Scrollable listing of shared atoms — complements per-component stories under Components/.
 * Inspired by All-Aboard Documentation/Catalog; Mestryx-owned content and APIs.
 */
const meta = {
  title: "Foundations/Catalog",
  globals: storefrontGlobals,
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

function CatalogSection({
  index,
  name,
  storyPath,
  children,
}: {
  index: number;
  name: string;
  storyPath: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[var(--border)] px-6 py-10 last:border-b-0">
      <p className="m-0 text-xs font-bold tracking-widest text-[var(--primary)] uppercase">
        {String(index).padStart(2, "0")} · Atom
      </p>
      <h2 className="mt-2 mb-1 text-2xl font-semibold text-[var(--foreground)]">{name}</h2>
      <p className="mb-6 font-mono text-xs text-[var(--muted-foreground)]">
        Detail: {storyPath}
      </p>
      <div className="max-w-2xl">{children}</div>
    </section>
  );
}

export const Components: Story = {
  name: "Components",
  render: () => (
    <div
      className="min-h-screen"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <header className="border-b border-[var(--border)] px-6 py-8">
        <h1 className="m-0 text-3xl font-semibold">Component catalog</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
          Shared atoms in the default <strong className="text-[var(--foreground)]">Vitrine</strong>{" "}
          (storefront) theme. Switch the toolbar to Platform for admin. E-commerce walkthrough:{" "}
          <strong className="text-[var(--foreground)]">Storefront/Vitrine</strong>. Variant detail
          lives under <code className="text-[var(--foreground)]">Components/</code>.
        </p>
      </header>

      <CatalogSection index={1} name="Button" storyPath="Components/Button">
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Delete</Button>
        </div>
      </CatalogSection>

      <CatalogSection index={2} name="Input / Label / Textarea / Select" storyPath="Components/Input">
        <Stack gap="md">
          <div>
            <Label htmlFor="cat-email">Email</Label>
            <Input id="cat-email" placeholder="you@example.com" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="cat-notes">Notes</Label>
            <Textarea id="cat-notes" placeholder="Optional notes" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="cat-role">Role</Label>
            <Select id="cat-role" defaultValue="editor" className="mt-1 max-w-sm">
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
              <option value="viewer">Viewer</option>
            </Select>
          </div>
        </Stack>
      </CatalogSection>

      <CatalogSection index={3} name="Checkbox" storyPath="Components/Checkbox">
        <Checkbox id="cat-invite" label="Send invite email" defaultChecked />
      </CatalogSection>

      <CatalogSection index={4} name="Card / Stack / Text" storyPath="Components/Card">
        <Card>
          <Text>Card title</Text>
          <Muted>Supporting copy for dense admin layouts.</Muted>
          <Button size="sm">Action</Button>
        </Card>
      </CatalogSection>

      <CatalogSection index={5} name="Alert / Badge / EmptyState" storyPath="Components/Alert">
        <Stack gap="md">
          <Alert tone="info">Informational notice</Alert>
          <Alert tone="error">Something went wrong</Alert>
          <div className="flex gap-2">
            <Badge>Default</Badge>
            <Badge tone="success">Live</Badge>
            <Badge tone="danger">Failed</Badge>
          </div>
          <EmptyState>No sites yet</EmptyState>
        </Stack>
      </CatalogSection>

      <CatalogSection index={6} name="Table" storyPath="Components/Table">
        <Table>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Status</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>Luna Bijoux</Td>
              <Td>Live</Td>
            </Tr>
            <Tr>
              <Td>Demo Site</Td>
              <Td>Draft</Td>
            </Tr>
          </Tbody>
        </Table>
      </CatalogSection>

      <CatalogSection index={7} name="Separator / Skeleton / Avatar" storyPath="Components/Separator">
        <Stack gap="md">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>MX</AvatarFallback>
            </Avatar>
            <Muted>mestryx</Muted>
          </div>
          <Separator />
          <Skeleton className="h-4 w-48" />
        </Stack>
      </CatalogSection>

      <CatalogSection index={8} name="Tabs" storyPath="Components/Tabs">
        <Tabs defaultValue="account" className="max-w-md">
          <TabsList>
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          <TabsContent value="account">Account settings</TabsContent>
          <TabsContent value="billing">Billing settings</TabsContent>
        </Tabs>
      </CatalogSection>

      <CatalogSection index={9} name="Dialog / Sheet / Dropdown / Tooltip" storyPath="Components/Dialog">
        <TooltipProvider>
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm invite</DialogTitle>
                  <DialogDescription>Sends an email to the member.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="secondary">Cancel</Button>
                  <Button>Send</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary">Open sheet</Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Cart</SheetTitle>
                  <SheetDescription>2 items</SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Workspace</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="secondary">Hover tip</Button>
              </TooltipTrigger>
              <TooltipContent>Helpful hint</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </CatalogSection>
    </div>
  ),
};

export const Patterns: Story = {
  name: "Patterns",
  render: () => (
    <div
      className="min-h-screen px-6 py-8"
      style={{ background: "var(--background)", color: "var(--foreground)" }}
    >
      <h1 className="m-0 text-3xl font-semibold">Pattern catalog</h1>
      <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
        Default theme is <strong className="text-[var(--foreground)]">Vitrine</strong>. Full
        e-commerce presentation under{" "}
        <code className="text-[var(--foreground)]">Storefront/Vitrine</code>.
      </p>

      <div className="mt-10 space-y-8 text-sm">
        <section>
          <h2 className="mb-2 text-base font-semibold">Storefront / Vitrine (e-commerce)</h2>
          <ul className="list-disc space-y-1 pl-5 text-[var(--muted-foreground)]">
            <li>
              <strong className="text-[var(--foreground)]">Vitrine</strong> — home → PLP → PDP →
              checkout · Storefront/Vitrine
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Hero / Header / ProductCard</strong> —
              Storefront/*
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Commerce</strong> — gallery, trust,
              cart · Storefront/Commerce
            </li>
            <li>
              <strong className="text-[var(--foreground)]">Loading</strong> — Soft boutique splash,
              cart inline, PLP skeleton · Storefront/Loading
            </li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold">Platform (admin)</h2>
          <ul className="list-disc space-y-1 pl-5 text-[var(--muted-foreground)]">
            <li>
              <strong className="text-[var(--foreground)]">AppShell</strong> — locked{" "}
              <code>platform</code> · Patterns/AppShell
            </li>
            <li>
              <strong className="text-[var(--foreground)]">FormLayout / PageHeader</strong> —
              Patterns/*
            </li>
          </ul>
        </section>
        <section>
          <h2 className="mb-2 text-base font-semibold">Shared</h2>
          <ul className="list-disc space-y-1 pl-5 text-[var(--muted-foreground)]">
            <li>
              <strong className="text-[var(--foreground)]">Motion</strong> — toolbar theme ·
              Patterns/Motion
            </li>
            <li>Dual-theme proof — Foundations/Themes → SideBySide</li>
          </ul>
        </section>
      </div>
    </div>
  ),
};
