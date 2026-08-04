import {
  Alert,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  EmptyState,
  FormActions,
  FormField,
  FormPanel,
  FormRow,
  Input,
  Muted,
  PageContent,
  PageHeader,
  FormSkeleton,
  Stack,
  Table,
  TableFrame,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  toast,
} from "@mestryx/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

type OrderDetail = {
  order: {
    id: string;
    publicId: string;
    email: string;
    status: string;
    currency: string;
    subtotalCents: number;
    discountCents: number;
    shippingCents: number;
    taxCents: number;
    totalCents: number;
    couponCode: string | null;
    carrier: string | null;
    trackingNumber: string | null;
    shippingAddressJson: Record<string, unknown>;
    billingAddressJson: Record<string, unknown>;
    paidAt: string | null;
    fulfilledAt: string | null;
    cancelledAt: string | null;
    createdAt: string;
  };
  items: Array<{
    id: string;
    sku: string;
    name: string;
    quantity: number;
    unitPriceCents: number;
    taxClass: string;
  }>;
  vatBreakdown: Array<{
    sku: string;
    name: string;
    quantity: number;
    lineTotalCents: number;
    taxCents: number;
    htCents: number;
    taxClass: string;
  }>;
  invoice: { id: string; number: string; issuedAt: string; kind?: string } | null;
  invoices?: Array<{
    id: string;
    number: string;
    issuedAt: string;
    kind: string;
  }>;
  events: Array<{ id: string; type: string; message: string; createdAt: string }>;
};

function formatMoney(cents: number, currency: string, language: string) {
  return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function formatAddr(a: Record<string, unknown>) {
  return [a.name, a.line1, a.line2, [a.postalCode, a.city].filter(Boolean).join(" "), a.country]
    .filter(Boolean)
    .map(String)
    .join(", ");
}

export function OrderDetailPage() {
  const { t, i18n } = useTranslation();
  const { orderId } = useParams({ strict: false }) as { orderId: string };
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [carrier, setCarrier] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const apiBase = "";

  const detail = useQuery({
    queryKey: ["order", orderId],
    enabled: Boolean(orderId),
    queryFn: () => apiFetch<OrderDetail>(`/v1/orders/${orderId}`),
  });

  const markPaid = useMutation({
    mutationFn: () =>
      apiFetch(`/v1/orders/${orderId}/mark-paid`, { method: "POST", body: "{}" }),
    onSuccess: async () => {
      setError(null);
      toast.success(t("order.markedPaid"));
      await qc.invalidateQueries({ queryKey: ["order", orderId] });
      await qc.invalidateQueries({ queryKey: ["org-orders"] });
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const cancel = useMutation({
    mutationFn: () =>
      apiFetch(`/v1/orders/${orderId}/cancel`, { method: "POST", body: "{}" }),
    onSuccess: async () => {
      setError(null);
      toast.success(t("order.cancelledToast"));
      await qc.invalidateQueries({ queryKey: ["order", orderId] });
      await qc.invalidateQueries({ queryKey: ["org-orders"] });
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const fulfill = useMutation({
    mutationFn: () =>
      apiFetch(`/v1/orders/${orderId}/fulfill`, {
        method: "POST",
        body: JSON.stringify({
          carrier: carrier || undefined,
          trackingNumber: trackingNumber || undefined,
        }),
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["order", orderId] });
      await qc.invalidateQueries({ queryKey: ["org-orders"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const creditNote = useMutation({
    mutationFn: () =>
      apiFetch(`/v1/orders/${orderId}/credit-note`, {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["order", orderId] });
      await qc.invalidateQueries({ queryKey: ["org-orders"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  if (detail.isLoading) {
    return (
      <PageContent maxWidth="full">
        <Stack gap="md">
          <PageHeader title={t("order.detail")} />
          <FormSkeleton fields={4} />
        </Stack>
      </PageContent>
    );
  }
  if (detail.isError || !detail.data) {
    return (
      <PageContent maxWidth="full">
        <Stack gap="md">
          <PageHeader
            breadcrumb={
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link to="/orders">{t("order.back")}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{t("order.detail")}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            }
            title={t("order.detail")}
          />
          <EmptyState>
            Order not found.{" "}
            <Link to="/orders">{t("order.back")}</Link>
          </EmptyState>
        </Stack>
      </PageContent>
    );
  }

  const { order, vatBreakdown, invoice, invoices, events } = detail.data;
  const pending = order.status === "pending_payment";
  const canFulfill = order.status === "paid";
  const canCredit =
    order.status === "paid" || order.status === "fulfilled";
  const docs = invoices ?? (invoice ? [invoice] : []);

  return (
    <PageContent maxWidth="full">
      <Stack gap="md">
        <PageHeader
          breadcrumb={
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to="/orders">{t("order.back")}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>{order.publicId}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          }
          title={
            <>
              {t("order.detail")} <code>{order.publicId}</code>
            </>
          }
          description={`${order.status}${order.paidAt ? ` · paid ${new Date(order.paidAt).toLocaleString()}` : ""}${order.fulfilledAt ? ` · fulfilled ${new Date(order.fulfilledAt).toLocaleString()}` : ""}${order.cancelledAt ? ` · cancelled ${new Date(order.cancelledAt).toLocaleString()}` : ""}`}
        />

        {pending ? (
          <FormPanel title={t("order.markPaid")} width="md">
            <FormActions>
              <Button type="button" size="sm" onClick={() => markPaid.mutate()}>
                {t("order.markPaid")}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => cancel.mutate()}>
                {t("order.cancel")}
              </Button>
            </FormActions>
            {error ? <Alert>{error}</Alert> : null}
          </FormPanel>
        ) : null}

        {canFulfill ? (
          <FormPanel title={t("order.fulfill")} width="md">
            <FormRow cols={2}>
              <FormField label={t("order.carrier")} htmlFor="carrier" size="full">
                <Input
                  id="carrier"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  placeholder="Colissimo"
                />
              </FormField>
              <FormField label={t("order.tracking")} htmlFor="tracking" size="full">
                <Input
                  id="tracking"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </FormField>
            </FormRow>
            {error ? <Alert>{error}</Alert> : null}
            <FormActions>
              <Button type="button" size="sm" onClick={() => fulfill.mutate()}>
                {t("order.markFulfilled")}
              </Button>
            </FormActions>
          </FormPanel>
        ) : null}

        {canCredit ? (
          <FormPanel title={t("order.creditNote")} width="md">
            <Muted>{t("order.creditNoteHint")}</Muted>
            {error ? <Alert>{error}</Alert> : null}
            <FormActions>
              <Button type="button" variant="ghost" size="sm" onClick={() => creditNote.mutate()}>
                {t("order.creditNote")}
              </Button>
            </FormActions>
          </FormPanel>
        ) : null}

        {docs.length > 0 ? (
          <Card variant="panel">
            <h2>{t("order.documents")}</h2>
            <Stack gap="sm">
              {docs.map((d) => (
                <div key={d.id}>
                  <strong>
                    {d.kind === "credit_note" ? t("order.creditNote") : t("order.invoice")}{" "}
                    {d.number}
                  </strong>{" "}
                  <a
                    href={`${apiBase}/v1/invoices/${d.id}.pdf`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    PDF
                  </a>{" "}
                  <a
                    href={`${apiBase}/v1/invoices/${d.id}.html`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    HTML
                  </a>
                </div>
              ))}
            </Stack>
          </Card>
        ) : null}

        <Card variant="panel">
          <h2>{t("order.customer")}</h2>
          <p>{order.email}</p>
          <Muted as="p">Ship: {formatAddr(order.shippingAddressJson)}</Muted>
          <Muted as="p">Bill: {formatAddr(order.billingAddressJson)}</Muted>
          {order.trackingNumber || order.carrier ? (
            <Muted as="p">
              {t("order.tracking")}: {order.carrier ?? "—"} / {order.trackingNumber ?? "—"}
            </Muted>
          ) : null}
        </Card>

        <Card variant="panel">
          <h2>{t("order.lines")}</h2>
          <TableFrame>
            <Table>
              <Thead>
                <Tr>
                  <Th>SKU</Th>
                  <Th>Name</Th>
                  <Th>Qty</Th>
                  <Th>TTC</Th>
                  <Th>TVA</Th>
                </Tr>
              </Thead>
              <Tbody>
                {vatBreakdown.map((l) => (
                  <Tr key={l.sku + l.name}>
                    <Td>
                      <code>{l.sku}</code>
                    </Td>
                    <Td>{l.name}</Td>
                    <Td>{l.quantity}</Td>
                    <Td>{formatMoney(l.lineTotalCents, order.currency, i18n.language)}</Td>
                    <Td>{formatMoney(l.taxCents, order.currency, i18n.language)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableFrame>
          <Stack gap="sm">
            <p>Subtotal: {formatMoney(order.subtotalCents, order.currency, i18n.language)}</p>
            {(order.discountCents ?? 0) > 0 ? (
              <p>
                Discount
                {order.couponCode ? ` (${order.couponCode})` : ""}: −
                {formatMoney(order.discountCents, order.currency, i18n.language)}
              </p>
            ) : null}
            <p>Shipping: {formatMoney(order.shippingCents, order.currency, i18n.language)}</p>
            <p>
              <strong>TVA: {formatMoney(order.taxCents, order.currency, i18n.language)}</strong>
            </p>
            <p>
              <strong>Total: {formatMoney(order.totalCents, order.currency, i18n.language)}</strong>
            </p>
          </Stack>
        </Card>

        <Card variant="panel">
          <h2>{t("order.timeline")}</h2>
          <ul>
            {events.map((e) => (
              <li key={e.id}>
                <code>{e.type}</code> — {e.message}{" "}
                <Muted as="span">({new Date(e.createdAt).toLocaleString()})</Muted>
              </li>
            ))}
          </ul>
        </Card>
      </Stack>
    </PageContent>
  );
}
