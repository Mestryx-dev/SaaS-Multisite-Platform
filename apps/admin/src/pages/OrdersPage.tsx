import {
  Badge,
  BulkActionBar,
  Button,
  ButtonLink,
  DensityToggle,
  EmptyState,
  FilterBar,
  FilterChips,
  Input,
  Label,
  ListPanel,
  PageContent,
  PageHeader,
  SearchField,
  Select,
  TableSkeleton,
  Stack,
  Table,
  TableFrame,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  readTableDensity,
  tableDensityClass,
  type TableDensity,
} from "@mestryx/ui";
import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { downloadCsv, rowsToCsv } from "../lib/csv-export";
import { deleteSavedView, listSavedViews, saveView } from "../lib/saved-views";
import { orderStatusLabel, orderStatusTone } from "../lib/status-labels";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type Order = {
  id: string;
  publicId: string;
  email: string;
  status: string;
  totalCents: number;
  taxCents: number;
  currency: string;
  createdAt: string;
  siteId: string;
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function OrdersPage() {
  const { t } = useTranslation();
  const searchStr = useRouterState({ select: (s) => s.location.searchStr });
  const params = useMemo(() => new URLSearchParams(searchStr), [searchStr]);

  const [statusFilter, setStatusFilter] = useState(
    () => params.get("status") ?? "",
  );
  const [density, setDensity] = useState<TableDensity>(() => readTableDensity());
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewName, setViewName] = useState("");
  const [savedViews, setSavedViews] = useState(() => listSavedViews("orders"));
  const [query, setQuery] = useState("");
  const [viewsOpen, setViewsOpen] = useState(false);

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiFetch<{ organizations: Org[] }>("/v1/organizations"),
    retry: false,
  });

  const selectedOrgId = useSelectedOrgId(orgs.data?.organizations ?? []);

  useEffect(() => {
    if (!selectedOrgId) return;
    const next = new URLSearchParams();
    next.set("org", selectedOrgId);
    if (statusFilter) next.set("status", statusFilter);
    const qs = next.toString();
    const url = qs ? `/orders?${qs}` : "/orders";
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [selectedOrgId, statusFilter]);

  const orders = useQuery({
    queryKey: ["org-orders", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ orders: Order[] }>(`/v1/organizations/${selectedOrgId}/orders`),
  });

  const rows = useMemo(() => {
    const all = orders.data?.orders ?? [];
    const byStatus = statusFilter
      ? all.filter((o) => o.status === statusFilter)
      : all;
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (o) =>
        o.publicId.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q),
    );
  }, [orders.data, statusFilter, query]);

  const chips = useMemo(() => {
    const list: { id: string; label: string }[] = [];
    if (statusFilter) {
      list.push({
        id: "status",
        label: orderStatusLabel(statusFilter, t),
      });
    }
    return list;
  }, [statusFilter, t]);
  function toggleRow(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function toggleAll() {
    const ids = rows.map((r) => r.id);
    setSelectedIds((prev) =>
      ids.length > 0 && ids.every((id) => prev.includes(id)) ? [] : ids,
    );
  }

  const allSelected =
    rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));

  return (
    <PageContent maxWidth="full">
      <Stack gap="md">
        <PageHeader
          eyebrow={t("nav.section.commerce")}
          title={t("nav.orders")}
          actions={
            selectedOrgId ? (
              <ButtonLink
                size="sm"
                href={`/v1/organizations/${selectedOrgId}/exports/accounting.csv`}
              >
                {t("order.exportCsv")}
              </ButtonLink>
            ) : null
          }
        />

        {!selectedOrgId ? (
          <EmptyState
            title="No organization"
            description="Create an organization from the dashboard, then return here."
          />
        ) : (
          <>
            <FilterBar
              trailing={<DensityToggle value={density} onChange={setDensity} />}
            >
              <div className="min-w-[10rem]">
                <Label htmlFor="order-status">Status</Label>
                <Select
                  id="order-status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="pending_payment">
                    {t("order.status.pending_payment")}
                  </option>
                  <option value="paid">{t("order.status.paid")}</option>
                  <option value="fulfilled">{t("order.status.fulfilled")}</option>
                  <option value="cancelled">{t("order.status.cancelled")}</option>
                </Select>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="self-end"
                onClick={() => setViewsOpen((o) => !o)}
              >
                {viewsOpen ? "Hide saved views" : "Saved views"}
              </Button>
            </FilterBar>

            <FilterChips
              chips={chips}
              onRemove={(id) => {
                if (id === "status") setStatusFilter("");
              }}
              onClearAll={() => setStatusFilter("")}
            />

            {viewsOpen ? (
              <div className="flex flex-wrap items-end gap-2 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--card)]/40 px-3 py-2">
                <div className="min-w-[10rem]">
                  <Label htmlFor="save-view">Apply</Label>
                  <Select
                    id="save-view"
                    value=""
                    onChange={(e) => {
                      const v = savedViews.find((x) => x.id === e.target.value);
                      if (v?.payload.status !== undefined) {
                        setStatusFilter(v.payload.status);
                      }
                    }}
                  >
                    <option value="">Choose…</option>
                    {savedViews.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <Input
                  aria-label="New view name"
                  placeholder="View name"
                  className="max-w-[10rem]"
                  value={viewName}
                  onChange={(e) => setViewName(e.target.value)}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={!viewName.trim()}
                  onClick={() => {
                    saveView("orders", {
                      name: viewName.trim(),
                      payload: { status: statusFilter },
                    });
                    setSavedViews(listSavedViews("orders"));
                    setViewName("");
                  }}
                >
                  Save
                </Button>
                {savedViews[0] ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      deleteSavedView("orders", savedViews[0]!.id);
                      setSavedViews(listSavedViews("orders"));
                    }}
                  >
                    Delete last
                  </Button>
                ) : null}
              </div>
            ) : null}

            <ListPanel
              title={t("nav.orders")}
              actions={
                <SearchField
                  placeholder="Search ID or email…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search orders"
                />
              }
            >
              <div className="space-y-3 p-4">
                <BulkActionBar count={selectedIds.length}>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const selected = rows.filter((o) =>
                        selectedIds.includes(o.id),
                      );
                      const csv = rowsToCsv(
                        [
                          "id",
                          "publicId",
                          "email",
                          "status",
                          "totalCents",
                          "taxCents",
                          "currency",
                          "createdAt",
                        ],
                        selected.map((o) => [
                          o.id,
                          o.publicId,
                          o.email,
                          o.status,
                          o.totalCents,
                          o.taxCents,
                          o.currency,
                          o.createdAt,
                        ]),
                      );
                      downloadCsv(
                        `orders-selected-${selected.length}.csv`,
                        csv,
                      );
                    }}
                  >
                    Export selected CSV
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    disabled
                    title="Bulk cancel requires API — coming soon"
                  >
                    Cancel selected (soon)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedIds([])}
                  >
                    Clear
                  </Button>
                </BulkActionBar>

                {orders.isLoading ? (
                  <TableFrame>
                    <TableSkeleton />
                  </TableFrame>
                ) : rows.length === 0 ? (
                  <EmptyState
                    variant="plain"
                    title={t("order.empty")}
                    description={
                      statusFilter || query
                        ? "No orders match the current filters."
                        : "Orders appear here after storefront checkout."
                    }
                    action={
                      statusFilter || query ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setStatusFilter("");
                            setQuery("");
                          }}
                        >
                          Clear filters
                        </Button>
                      ) : null
                    }
                  />
                ) : (
                  <TableFrame>
                    <Table className={tableDensityClass(density)}>
                      <Thead>
                        <Tr>
                          <Th className="w-10">
                            <input
                              type="checkbox"
                              className="size-4 accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                              checked={allSelected}
                              onChange={toggleAll}
                              aria-label="Select all"
                            />
                          </Th>
                          <Th>ID</Th>
                          <Th>Email</Th>
                          <Th>Total</Th>
                          <Th>VAT</Th>
                          <Th>Status</Th>
                          <Th />
                        </Tr>
                      </Thead>
                      <Tbody>
                        {rows.map((o) => (
                            <Tr key={o.id}>
                              <Td>
                                <input
                                  type="checkbox"
                                  className="size-4 accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
                                  checked={selectedIds.includes(o.id)}
                                  onChange={() => toggleRow(o.id)}
                                  aria-label={`Select ${o.publicId}`}
                                />
                              </Td>
                              <Td>
                                <code>{o.publicId}</code>
                              </Td>
                              <Td>{o.email}</Td>
                              <Td>
                                {formatMoney(o.totalCents, o.currency)}
                              </Td>
                              <Td>
                                {formatMoney(o.taxCents, o.currency)}
                              </Td>
                              <Td>
                                <Badge tone={orderStatusTone(o.status).badge}>
                                  {orderStatusLabel(o.status, t)}
                                </Badge>
                              </Td>
                              <Td>
                                <Link
                                  to="/orders/$orderId"
                                  params={{ orderId: o.id }}
                                >
                                  {t("order.open")}
                                </Link>
                              </Td>
                            </Tr>
                          ))}
                      </Tbody>
                    </Table>
                  </TableFrame>
                )}
              </div>
            </ListPanel>
          </>
        )}
      </Stack>
    </PageContent>
  );
}
