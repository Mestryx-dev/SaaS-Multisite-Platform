import {
  Alert,
  Button,
  Card,
  EmptyState,
  FormActions,
  Muted,
  PageContent,
  PageHeader,
  TableSkeleton,
  Stack,
  Table,
  TableFrame,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from "@mestryx/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { apiFetch } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type Billing = {
  organizationId: string;
  planId: string;
  planName: string;
  maxSites: number;
  sitesUsed?: number;
  planModulesAllowed?: string[];
  orgModulesAllowed?: string[];
  stripeCustomerId: string | null;
  stripeConfigured: boolean;
  canManage: boolean;
};

type Plan = {
  id: string;
  name: string;
  maxSites: number;
  modulesAllowed?: string[];
  stripePriceId: string | null;
};

export function BillingPage() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success") === "1") {
      setNotice(t("billing.success"));
    } else if (params.get("canceled") === "1") {
      setNotice(t("billing.canceled"));
    } else if (params.get("stub") === "1") {
      setNotice(t("billing.stubCheckout"));
    } else if (params.get("stub_portal") === "1") {
      setNotice(t("billing.stubPortal"));
    }
  }, [t]);

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiFetch<{ organizations: Org[] }>("/v1/organizations"),
    retry: false,
  });

  const selectedOrgId = useSelectedOrgId(orgs.data?.organizations ?? []);

  const billing = useQuery({
    queryKey: ["billing", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ billing: Billing }>(
        `/v1/organizations/${selectedOrgId}/billing`,
      ),
  });

  const plans = useQuery({
    queryKey: ["plans"],
    queryFn: () => apiFetch<{ plans: Plan[] }>("/v1/plans"),
  });

  const checkout = useMutation({
    mutationFn: (planId: string) =>
      apiFetch<{ mode: string; url?: string; message?: string }>(
        "/v1/billing/checkout-session",
        {
          method: "POST",
          body: JSON.stringify({
            organizationId: selectedOrgId,
            planId,
          }),
        },
      ),
    onSuccess: (data) => {
      setError(null);
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(data.message ?? t("billing.stubCheckout"));
    },
    onError: (err: Error) => setError(err.message),
  });

  const portal = useMutation({
    mutationFn: () =>
      apiFetch<{ mode: string; url?: string; message?: string }>(
        "/v1/billing/portal-session",
        {
          method: "POST",
          body: JSON.stringify({ organizationId: selectedOrgId }),
        },
      ),
    onSuccess: (data) => {
      setError(null);
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setNotice(data.message ?? t("billing.stubPortal"));
    },
    onError: (err: Error) => setError(err.message),
  });

  const b = billing.data?.billing;
  const paidPlans = (plans.data?.plans ?? []).filter((p) => p.id !== "free");

  return (
    <PageContent maxWidth="wide">
      <Stack gap="md">
        <PageHeader
          title={t("billing.title")}
          description={t("billing.subtitle")}
        />

        {error ? <Alert tone="error">{error}</Alert> : null}
        {notice ? <Alert tone="info">{notice}</Alert> : null}

        {billing.isLoading ? (
          <TableFrame>
            <TableSkeleton />
          </TableFrame>
        ) : !b ? (
          <EmptyState>No billing data for this organization.</EmptyState>
        ) : (
          <Card variant="panel">
            <Stack gap="md">
              <div>
                <strong>{t("billing.currentPlan")}:</strong> {b.planName} (
                {b.planId})
              </div>
              <Muted as="p">
                {t("billing.maxSites")}: {b.sitesUsed ?? "—"} / {b.maxSites}
              </Muted>
              <div>
                <strong>{t("billing.entitlements")}</strong>
                <TableFrame className="mt-2">
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>{t("billing.moduleCol")}</Th>
                        <Th>{t("billing.planCol")}</Th>
                        <Th>{t("billing.enabledCol")}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {["cms", "commerce"].map((mod) => (
                        <Tr key={mod}>
                          <Td>{mod}</Td>
                          <Td>
                            {(b.planModulesAllowed ?? []).includes(mod)
                              ? t("billing.yes")
                              : t("billing.no")}
                          </Td>
                          <Td>
                            {(b.orgModulesAllowed ?? []).includes(mod)
                              ? t("billing.yes")
                              : t("billing.no")}
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </TableFrame>
                <p className="mt-3">
                  <Link to="/modules">{t("billing.manageModules")}</Link>
                </p>
              </div>
              {!b.stripeConfigured ? (
                <Alert tone="info">{t("billing.stripeNotConfigured")}</Alert>
              ) : null}
              {b.canManage ? (
                <FormActions>
                  {paidPlans.map((p) => (
                    <Button
                      key={p.id}
                      size="sm"
                      disabled={checkout.isPending || b.planId === p.id}
                      onClick={() => checkout.mutate(p.id)}
                    >
                      {t("billing.upgradeTo", { plan: p.name })}
                    </Button>
                  ))}
                  {paidPlans.length === 0 ? (
                    <Muted as="p">{t("billing.noPaidPlans")}</Muted>
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={portal.isPending}
                    onClick={() => portal.mutate()}
                  >
                    {t("billing.manage")}
                  </Button>
                </FormActions>
              ) : (
                <Muted as="p">{t("billing.viewOnly")}</Muted>
              )}
            </Stack>
          </Card>
        )}
      </Stack>
    </PageContent>
  );
}
