import {
  ActivityList,
  Alert,
  Button,
  EmptyState,
  FormActions,
  FormField,
  FormPanel,
  Input,
  PageContent,
  PageHeader,
  StatStrip,
  StatusDot,
  Stack,
} from "@mestryx/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch, slugify } from "../lib/api";
import { orderStatusLabel, orderStatusTone } from "../lib/status-labels";
import { pickOrgId, useWorkspaceOrg } from "../lib/workspace";

type Org = { id: string; name: string; slug: string; role?: string };
type Order = {
  id: string;
  publicId?: string;
  email?: string;
  status: string;
  createdAt?: string;
};
type LowStock = { id: string; stock: number; lowStockThreshold: number };
type Product = { id: string };

function orderStatusDotTone(
  status: string,
): "ok" | "warn" | "danger" | "idle" | "info" {
  return orderStatusTone(status).dot;
}

export function DashboardPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { orgId: workspaceOrgId } = useWorkspaceOrg();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiFetch<{ organizations: Org[] }>("/v1/organizations"),
    retry: false,
  });

  const createOrg = useMutation({
    mutationFn: () =>
      apiFetch<{ organization: Org }>("/v1/organizations", {
        method: "POST",
        body: JSON.stringify({ name, slug: slug || slugify(name) }),
      }),
    onSuccess: async () => {
      setName("");
      setSlug("");
      setShowCreate(false);
      await qc.invalidateQueries({ queryKey: ["organizations"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const list = orgs.data?.organizations ?? [];
  const orgCount = list.length;
  const primaryOrgId = pickOrgId(workspaceOrgId, list);
  const greetName =
    list.find((o) => o.id === primaryOrgId)?.name?.split(" ")[0] ??
    list[0]?.name?.split(" ")[0] ??
    t("dashboard.greetFallback");
  const orders = useQuery({
    queryKey: ["org-orders", primaryOrgId, "dashboard"],
    enabled: Boolean(primaryOrgId),
    queryFn: () =>
      apiFetch<{ orders: Order[] }>(
        `/v1/organizations/${primaryOrgId}/orders`,
      ),
  });

  const stockAlerts = useQuery({
    queryKey: ["stock-alerts", primaryOrgId, "dashboard"],
    enabled: Boolean(primaryOrgId),
    queryFn: () =>
      apiFetch<{ products: LowStock[] }>(
        `/v1/organizations/${primaryOrgId}/stock-alerts`,
      ),
  });

  const products = useQuery({
    queryKey: ["org-products", primaryOrgId, "dashboard"],
    enabled: Boolean(primaryOrgId),
    queryFn: () =>
      apiFetch<{ products: Product[] }>(
        `/v1/organizations/${primaryOrgId}/products`,
      ),
  });

  const pendingOrders = useMemo(
    () =>
      (orders.data?.orders ?? []).filter((o) => o.status === "pending_payment")
        .length,
    [orders.data],
  );
  const paidOrders = useMemo(
    () =>
      (orders.data?.orders ?? []).filter(
        (o) => o.status === "paid" || o.status === "fulfilled",
      ).length,
    [orders.data],
  );
  const totalOrders = orders.data?.orders?.length ?? 0;
  const lowStockCount = stockAlerts.data?.products?.length ?? 0;
  const productCount = products.data?.products?.length ?? 0;

  const recentOrders = useMemo(() => {
    const rows = [...(orders.data?.orders ?? [])];
    rows.sort((a, b) => {
      const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
      const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
      return tb - ta;
    });
    return rows.slice(0, 6);
  }, [orders.data]);

  const kpiItems = [
    {
      label: t("dashboard.organizations"),
      value: String(orgCount),
      hint: orgCount === 0 ? t("dashboard.createFirstOrg") : undefined,
    },
    {
      label: t("dashboard.products"),
      value: String(productCount),
      trend:
        lowStockCount > 0
          ? {
              label: t("dashboard.lowStockTrend", { count: lowStockCount }),
              tone: "down" as const,
            }
          : undefined,
    },
    {
      label: t("dashboard.orders"),
      value: String(totalOrders),
      hint: t("dashboard.awaitingPaymentHint", { count: pendingOrders }),
      footer: (
        <div className="flex flex-col gap-1 text-xs text-[var(--muted-foreground)]">
          <span className="inline-flex items-center gap-2">
            <StatusDot tone="warn" label={t("dashboard.awaitingPayment")} />
            {t("dashboard.awaitingPaymentHint", { count: pendingOrders })}
          </span>
          <span className="inline-flex items-center gap-2">
            <StatusDot tone="ok" label={t("order.status.paid")} />
            {t("dashboard.paidFulfilled", { count: paidOrders })}
          </span>
        </div>
      ),
    },
    {
      label: t("dashboard.lowStock"),
      value: String(lowStockCount),
      hint: productCount
        ? t("dashboard.inCatalog", { count: productCount })
        : undefined,
    },
  ];

  const createOrgForm = (
    <FormPanel title={t("org.create")} width="full">
      <FormField label={t("org.name")} htmlFor="org-name" size="full">
        <Input
          id="org-name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSlug(slugify(e.target.value));
          }}
        />
      </FormField>
      <FormField label={t("org.slug")} htmlFor="org-slug" size="full">
        <Input
          id="org-slug"
          className="font-mono text-xs"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
        />
      </FormField>
      {error ? <Alert>{error}</Alert> : null}
      <FormActions>
        <Button
          size="sm"
          disabled={!name || createOrg.isPending}
          onClick={() => createOrg.mutate()}
        >
          {t("org.create")}
        </Button>
      </FormActions>
    </FormPanel>
  );

  return (
    <PageContent>
      <Stack gap="md">
        <PageHeader
          title={
            orgCount
              ? t("dashboard.welcomeBack", { name: greetName })
              : t("dashboard.setupTitle")
          }
          description={
            orgCount
              ? t("dashboard.attentionDescription")
              : t("dashboard.setupDescription")
          }
          actions={
            orgCount ? (
              <Button asChild size="sm" variant="secondary">
                <Link to="/sites">{t("nav.sites")}</Link>
              </Button>
            ) : null
          }
        />

        {orgs.isError ? (
          <EmptyState
            title={t("dashboard.loadOrgsError")}
            description={t("dashboard.loadOrgsErrorHint")}
          />
        ) : orgCount === 0 ? (
          createOrgForm
        ) : (
          <>
            <div className="md:hidden">
              <StatStrip items={kpiItems.slice(0, 2)} />
            </div>
            <div className="hidden md:block">
              <StatStrip items={kpiItems} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-[var(--foreground)]">
                  {t("dashboard.recentOrders")}
                </h2>
                <Link
                  to="/orders"
                  className="text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                >
                  {t("dashboard.viewAll")}
                </Link>
              </div>
              <ActivityList
                items={recentOrders.map((o) => ({
                  id: o.id,
                  title: o.publicId ?? o.id.slice(0, 8),
                  subtitle: o.email,
                  meta: orderStatusLabel(o.status, t),
                  statusTone: orderStatusDotTone(o.status),
                  statusLabel: orderStatusLabel(o.status, t),
                  trailing: (
                    <Link
                      to="/orders/$orderId"
                      params={{ orderId: o.id }}
                      className="hover:text-[var(--foreground)]"
                    >
                      {t("order.open")}
                    </Link>
                  ),
                }))}
                empty={
                  <EmptyState
                    variant="plain"
                    title={t("order.empty")}
                    description={t("dashboard.noOrdersHint")}
                  />
                }
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowCreate((s) => !s)}
              >
                {showCreate ? t("common.hide") : t("org.create")}
              </Button>
            </div>
            {showCreate ? createOrgForm : null}
          </>
        )}
      </Stack>
    </PageContent>
  );
}
