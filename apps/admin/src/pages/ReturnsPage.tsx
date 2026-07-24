import {
  Alert,
  Button,
  EmptyState,
  FormActions,
  FormPanel,
  Muted,
  PageContent,
  PageHeader,
  TableSkeleton,
  Stack,
  TableFrame,
} from "@mestryx/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type ReturnRow = {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  orderId: string;
  orderPublicId: string;
  orderStatus: string;
};

export function ReturnsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiFetch<{ organizations: Org[] }>("/v1/organizations"),
    retry: false,
  });

  const selectedOrgId = useSelectedOrgId(orgs.data?.organizations ?? []);

  const returns = useQuery({
    queryKey: ["returns", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ returns: ReturnRow[] }>(
        `/v1/organizations/${selectedOrgId}/returns`,
      ),
  });

  const abandoned = useQuery({
    queryKey: ["abandoned-carts", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ carts: unknown[] }>(
        `/v1/organizations/${selectedOrgId}/abandoned-carts`,
      ),
  });

  const patchReturn = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/v1/returns/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["returns", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const runAbandoned = useMutation({
    mutationFn: () =>
      apiFetch<{ sent: number; candidates: number }>(
        `/v1/organizations/${selectedOrgId}/abandoned-carts/run`,
        { method: "POST", body: JSON.stringify({}) },
      ),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({
        queryKey: ["abandoned-carts", selectedOrgId],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const rows = returns.data?.returns ?? [];

  return (
    <PageContent maxWidth="full">
      <Stack gap="md">
        <PageHeader
          title={t("nav.returns")}
          description={t("returns.description")}
        />
        {error ? <Alert tone="error">{error}</Alert> : null}

        {returns.isLoading ? (
          <TableFrame>
            <TableSkeleton />
          </TableFrame>
        ) : rows.length === 0 ? (
          <EmptyState>{t("returns.empty")}</EmptyState>
        ) : (
          <TableFrame>
            <ul className="divide-y divide-[var(--border)]">
              {rows.map((r) => (
                <li key={r.id} className="space-y-2 px-4 py-3 text-sm">
                  <strong>
                    <Link
                      className="underline underline-offset-2 hover:text-[var(--primary)]"
                      to="/orders/$orderId"
                      params={{ orderId: r.orderId }}
                    >
                      {r.orderPublicId}
                    </Link>{" "}
                    — {r.status}
                  </strong>
                  <Muted as="p">{r.reason}</Muted>
                  {r.status === "requested" ? (
                    <FormActions>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() =>
                          patchReturn.mutate({ id: r.id, status: "approved" })
                        }
                      >
                        {t("returns.approve")}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          patchReturn.mutate({ id: r.id, status: "rejected" })
                        }
                      >
                        {t("returns.reject")}
                      </Button>
                    </FormActions>
                  ) : null}
                </li>
              ))}
            </ul>
          </TableFrame>
        )}

        <FormPanel title={t("abandoned.title")} width="md">
          <Muted as="p">
            {t("abandoned.candidates", {
              count: abandoned.data?.carts?.length ?? 0,
            })}
          </Muted>
          {runAbandoned.data ? (
            <Muted as="p">
              {t("abandoned.sent", { count: runAbandoned.data.sent })}
            </Muted>
          ) : null}
          <FormActions>
            <Button
              type="button"
              size="sm"
              onClick={() => runAbandoned.mutate()}
              disabled={runAbandoned.isPending || !selectedOrgId}
            >
              {t("abandoned.run")}
            </Button>
          </FormActions>
        </FormPanel>
      </Stack>
    </PageContent>
  );
}
