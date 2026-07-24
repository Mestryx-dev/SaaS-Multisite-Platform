import {
  Card,
  EmptyState,
  Muted,
  PageContent,
  PageHeader,
  Stack,
  StatStrip,
  TableFrame,
  TableSkeleton,
  LoadingBlock,
} from "@mestryx/ui";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };

type SalesReport = {
  orderCount: number;
  grossSalesCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  netSalesCents: number;
};

type LowStock = {
  id: string;
  sku: string;
  name: string;
  stock: number;
  lowStockThreshold: number;
  status: string;
};

function formatMoney(cents: number, language: string) {
  return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/** CSS bar chart — Wave C (no chart lib). */
function MoneyBars({
  items,
  language,
}: {
  items: Array<{ label: string; cents: number; tone?: "muted" | "primary" }>;
  language: string;
}) {
  const max = Math.max(...items.map((i) => Math.abs(i.cents)), 1);
  return (
    <div className="mt-3 space-y-3" role="img" aria-label="Sales breakdown">
      {items.map((item) => {
        const pct = Math.round((Math.abs(item.cents) / max) * 100);
        return (
          <div key={item.label} className="space-y-1">
            <div className="flex justify-between text-xs text-[var(--muted-foreground)]">
              <span>{item.label}</span>
              <span>{formatMoney(item.cents, language)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
              <div
                className={
                  item.tone === "primary"
                    ? "h-full rounded-full bg-[var(--primary)]"
                    : "h-full rounded-full bg-[var(--foreground)]/40"
                }
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ReportsPage() {
  const { t, i18n } = useTranslation();

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiFetch<{ organizations: Org[] }>("/v1/organizations"),
    retry: false,
  });

  const selectedOrgId = useSelectedOrgId(orgs.data?.organizations ?? []);

  const sales = useQuery({
    queryKey: ["sales-report", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ report: SalesReport }>(
        `/v1/organizations/${selectedOrgId}/reports/sales`,
      ),
  });

  const alerts = useQuery({
    queryKey: ["stock-alerts", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ products: LowStock[] }>(
        `/v1/organizations/${selectedOrgId}/stock-alerts`,
      ),
  });

  const r = sales.data?.report;
  const alertRows = alerts.data?.products ?? [];

  return (
    <PageContent maxWidth="wide">
      <Stack gap="md">
        <PageHeader
          eyebrow={t("nav.section.commerce")}
          title={t("nav.reports")}
          description="Lightweight commerce snapshots."
        />

        {r ? (
          <StatStrip
            items={[
              { label: t("reports.orders"), value: String(r.orderCount) },
              { label: t("reports.gross"), value: formatMoney(r.grossSalesCents, i18n.language) },
              { label: t("reports.net"), value: formatMoney(r.netSalesCents, i18n.language) },
              { label: t("reports.stockAlerts"), value: String(alertRows.length) },
            ]}
          />
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Card variant="panel">
            <h2 className="text-sm font-semibold">{t("reports.sales")}</h2>
            {sales.isLoading ? (
              <LoadingBlock className="py-6" label={t("reports.sales")} size="sm" />
            ) : r ? (
              <MoneyBars
                language={i18n.language}
                items={[
                  {
                    label: t("reports.gross"),
                    cents: r.grossSalesCents,
                    tone: "primary",
                  },
                  { label: t("reports.discounts"), cents: r.discountCents },
                  { label: t("reports.shipping"), cents: r.shippingCents },
                  { label: t("reports.vat"), cents: r.taxCents },
                  {
                    label: t("reports.net"),
                    cents: r.netSalesCents,
                    tone: "primary",
                  },
                ]}
              />
            ) : (
              <Muted>…</Muted>
            )}
          </Card>

          <div>
            <h2 className="mb-2 text-sm font-semibold">{t("reports.stockAlerts")}</h2>
            {alerts.isLoading ? (
              <TableFrame>
                <TableSkeleton rows={3} columns={2} />
              </TableFrame>
            ) : alertRows.length === 0 ? (
              <EmptyState>{t("reports.noAlerts")}</EmptyState>
            ) : (
              <TableFrame>
                <ul className="divide-y divide-[var(--border)]">
                  {alertRows.map((p) => (
                    <li key={p.id} className="px-4 py-2.5 text-sm">
                      <code>{p.sku}</code> {p.name} — stock {p.stock} ≤{" "}
                      {p.lowStockThreshold}
                    </li>
                  ))}
                </ul>
              </TableFrame>
            )}
          </div>
        </div>
      </Stack>
    </PageContent>
  );
}
