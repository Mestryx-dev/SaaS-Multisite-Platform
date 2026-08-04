import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { prefersReducedMotion } from "../patterns/motion/reduced-motion";
import { MotionPress, MotionPresence } from "../patterns/motion";
import {
  AppShell,
  navLinkClassName,
  AuthShell,
  Sidebar,
} from "../patterns/app-shell";
import {
  Flash,
  ProductGallery,
  PromoBanners,
  PdpLayout,
  StoreFooter,
} from "../patterns/storefront";
import { Dropzone } from "../patterns/dropzone";
import { FormField, FormPanel, FormRow } from "../patterns/form-layout";
import { PageHeader } from "../patterns/page-header";
import { PageContent } from "../patterns/page-content";
import { TableFrame } from "../patterns/table-frame";
import { SplitLayout } from "../patterns/split-layout";
import { FilterChips } from "../patterns/filter-chips";
import { DensityToggle } from "../patterns/density-toggle";
import { BulkActionBar } from "../patterns/bulk-action-bar";
import { Button } from "../components/button";
import { Checkbox } from "../components/checkbox";
import {
  Command,
  CommandEmpty,
  CommandList,
  CommandSeparator,
} from "../components/command";
import { Separator } from "../components/separator";
import { Progress } from "../components/progress";
import { ScrollArea, ScrollBar } from "../components/scroll-area";
import { DataTable } from "../components/data-table";
import { Spinner } from "../components/spinner";
import { TableSkeleton } from "../patterns/loading";
import { Input } from "../components/input";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "../components/breadcrumb";

afterEach(() => {
  cleanup();
});

describe("prefersReducedMotion", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns false when matchMedia is missing", () => {
    vi.stubGlobal("window", { matchMedia: undefined });
    expect(prefersReducedMotion()).toBe(false);
  });

  it("returns true when reduce is preferred", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    expect(prefersReducedMotion()).toBe(true);
  });
});

describe("Motion reduced path", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("MotionPress renders static span when reduced", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    const { container } = render(
      <MotionPress className="mx-press">
        <button type="button">Go</button>
      </MotionPress>,
    );
    expect(container.querySelector("span.mx-press")).toBeTruthy();
    expect(container.querySelector("button")).toBeTruthy();
  });

  it("MotionPresence uses reduced transition when preferred", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({
      matches: q.includes("reduce"),
      media: q,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));
    render(
      <MotionPresence show>
        <p>Panel</p>
      </MotionPresence>,
    );
    expect(screen.getByText("Panel")).toBeTruthy();
  });

  it("MotionPresence hides when show is false", () => {
    const { container } = render(
      <MotionPresence show={false}>
        <p>Hidden</p>
      </MotionPresence>,
    );
    expect(container.textContent).not.toContain("Hidden");
  });
});

describe("app-shell helpers", () => {
  it("navLinkClassName covers active and idle", () => {
    expect(navLinkClassName(true)).toContain("ui-sidebar-link-active");
    expect(navLinkClassName(false, "extra")).toContain("extra");
  });

  it("renders AuthShell and Sidebar", () => {
    render(
      <AuthShell>
        <p>Sign in</p>
      </AuthShell>,
    );
    expect(screen.getByText("Sign in")).toBeTruthy();
    render(
      <Sidebar className="w-48">
        <p>Nav</p>
      </Sidebar>,
    );
    expect(screen.getByText("Nav")).toBeTruthy();
  });

  it("AppShell without topBar or sidebarFooter", () => {
    render(
      <AppShell brand="Brand" nav={<a href="/dash">Dashboard</a>}>
        <p>Content</p>
      </AppShell>,
    );
    expect(screen.getByText("Content")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Dashboard" })).toBeTruthy();
  });
});

describe("storefront branches", () => {
  it("PromoBanners returns null when empty", () => {
    const { container } = render(<PromoBanners banners={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("PromoBanners covers image, href, and plain variants", () => {
    render(
      <PromoBanners
        banners={[
          {
            id: "1",
            title: "Linked",
            subtitle: "Sub",
            imageUrl: "https://example.com/a.jpg",
            href: "/sale",
          },
          { id: "2", title: "Plain" },
        ]}
      />,
    );
    expect(screen.getByText("Linked").closest("a")).toHaveAttribute(
      "href",
      "/sale",
    );
    expect(screen.getByText("Plain")).toBeTruthy();
  });

  it("renders PdpLayout", () => {
    render(
      <PdpLayout media={<img alt="m" src="/m.jpg" />}>
        <h1>Product</h1>
      </PdpLayout>,
    );
    expect(screen.getByText("Product")).toBeTruthy();
  });

  it("StoreFooter legacy items, Flash, empty ProductGallery", () => {
    render(
      <>
        <StoreFooter
          brand="Shop"
          items={[
            { label: "Privacy", href: "/privacy" },
            { label: "Terms", href: "/terms" },
          ]}
        />
        <Flash>Saved</Flash>
        <ProductGallery images={[]} productName="Empty" />
      </>,
    );
    expect(screen.getByRole("link", { name: "Privacy" })).toBeTruthy();
    expect(screen.getByText("Saved")).toBeTruthy();
    expect(document.getElementById("mx-gallery-main")).toBeTruthy();
  });
});

describe("dropzone hint branch", () => {
  it("omits hint when falsy", () => {
    render(<Dropzone hint={null} label="Upload" />);
    expect(screen.getByText("Upload")).toBeTruthy();
    expect(screen.queryByText("PNG, JPG")).toBeNull();
  });
});

describe("form + page header branches", () => {
  it("FormPanel widths and FormField hint / no label", () => {
    render(
      <>
        <FormPanel title="T" width="md">
          <FormField hint="Help text" size="sm">
            <Input aria-label="bare" />
          </FormField>
        </FormPanel>
        <FormPanel width="xl">
          <FormRow cols={2}>
            <FormField label="A" htmlFor="a" size="full">
              <Input id="a" />
            </FormField>
          </FormRow>
        </FormPanel>
        <FormPanel width="full">
          <span>Full</span>
        </FormPanel>
      </>,
    );
    expect(screen.getByText("Help text")).toBeTruthy();
    expect(screen.getByText("Full")).toBeTruthy();
  });

  it("PageHeader title only", () => {
    render(<PageHeader title="Bare title" />);
    expect(screen.getByRole("heading", { name: "Bare title" })).toBeTruthy();
  });

  it("PageContent, TableFrame, SplitLayout, breadcrumb slot", () => {
    render(
      <PageContent maxWidth="wide">
        <PageHeader title="T" breadcrumb={<nav aria-label="Breadcrumb">Crumb</nav>} />
        <SplitLayout
          primary={<TableFrame maxWidth="2xl">Table</TableFrame>}
          aside={<p>Aside</p>}
        />
      </PageContent>,
    );
    expect(screen.getByText("Table")).toBeTruthy();
    expect(screen.getByText("Aside")).toBeTruthy();
    expect(screen.getByText("Crumb")).toBeTruthy();
  });
});

describe("Wave B patterns", () => {
  it("FilterChips, DensityToggle, BulkActionBar", async () => {
    const user = userEvent.setup();
    const onRemove = vi.fn();
    const onClear = vi.fn();
    const onDensity = vi.fn();
    render(
      <>
        <FilterChips
          chips={[{ id: "s", label: "Status: paid" }]}
          onRemove={onRemove}
          onClearAll={onClear}
        />
        <DensityToggle persist={false} onChange={onDensity} />
        <BulkActionBar count={2}>
          <button type="button">Act</button>
        </BulkActionBar>
      </>,
    );
    await user.click(screen.getByRole("listitem"));
    expect(onRemove).toHaveBeenCalledWith("s");
    await user.click(screen.getByRole("button", { name: "Compact" }));
    expect(onDensity).toHaveBeenCalledWith("compact");
    expect(screen.getByText("2 selected")).toBeTruthy();
  });
});

describe("component branch coverage", () => {
  it("Button asChild uses Slot", () => {
    render(
      <Button asChild>
        <a href="/x">Slotted</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Slotted" })).toHaveAttribute(
      "href",
      "/x",
    );
  });

  it("Checkbox without label and onChange", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Checkbox id="bare" onChange={onChange} aria-label="Bare" />);
    await user.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenCalled();
  });

  it("CommandEmpty and CommandSeparator mount", () => {
    render(
      <Command shouldFilter={false}>
        <CommandList>
          <CommandEmpty>Nothing</CommandEmpty>
        </CommandList>
        <CommandSeparator />
      </Command>,
    );
    expect(screen.getByText("Nothing")).toBeTruthy();
  });

  it("Separator vertical, Progress without value, ScrollBar horizontal", () => {
    const { container } = render(
      <>
        <Separator orientation="vertical" className="h-8" />
        <Progress aria-label="Loading" />
        <ScrollArea className="h-20 w-40">
          <div className="w-[400px]">Wide</div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </>,
    );
    expect(container.querySelector('[data-orientation="vertical"]')).toBeTruthy();
  });

  it("DataTable loading and empty", () => {
    const cols = [
      { id: "n", header: "Name", cell: (r: { n: string }) => r.n },
    ];
    const { rerender } = render(
      <DataTable
        columns={cols}
        rows={[]}
        getRowId={(r) => r.n}
        loading
      />,
    );
    expect(screen.getByLabelText("Loading table")).toBeTruthy();
    rerender(
      <DataTable
        columns={cols}
        rows={[]}
        getRowId={(r) => r.n}
        emptyTitle="Empty"
        emptyDescription="No data"
      />,
    );
    expect(screen.getByText("Empty")).toBeTruthy();
    expect(screen.getByText("No data")).toBeTruthy();
    rerender(
      <DataTable columns={cols} rows={[]} getRowId={(r) => r.n} />,
    );
    expect(screen.getByText("No rows")).toBeTruthy();
  });

  it("Spinner and TableSkeleton smoke", () => {
    const { rerender } = render(<Spinner size="sm" label="Busy" />);
    expect(screen.getByLabelText("Busy")).toBeTruthy();
    rerender(<TableSkeleton rows={2} columns={2} />);
    expect(screen.getByLabelText("Loading table")).toBeTruthy();
  });

  it("BreadcrumbLink asChild", () => {
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <a href="/home">Home</a>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>Here</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "href",
      "/home",
    );
  });
});
