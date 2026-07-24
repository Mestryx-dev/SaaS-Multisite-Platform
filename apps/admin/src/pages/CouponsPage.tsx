import {
  Alert,
  Button,
  EmptyState,
  FormActions,
  FormField,
  FormPanel,
  FormRow,
  Input,
  Label,
  PageContent,
  PageHeader,
  Select,
  TableSkeleton,
  SplitLayout,
  Stack,
  TableFrame,
} from "@mestryx/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type Coupon = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSubtotalCents: number | null;
  maxRedemptions: number | null;
  redemptionCount: number;
  expiresAt: string | null;
  active: boolean;
};

export function CouponsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [code, setCode] = useState("WELCOME10");
  const [type, setType] = useState<"percent" | "fixed">("percent");
  const [value, setValue] = useState("10");
  const [error, setError] = useState<string | null>(null);

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiFetch<{ organizations: Org[] }>("/v1/organizations"),
    retry: false,
  });

  const selectedOrgId = useSelectedOrgId(orgs.data?.organizations ?? []);

  const coupons = useQuery({
    queryKey: ["coupons", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ coupons: Coupon[] }>(
        `/v1/organizations/${selectedOrgId}/coupons`,
      ),
  });

  const create = useMutation({
    mutationFn: () => {
      const numeric = Number.parseFloat(value);
      const apiValue = Math.round(numeric * 100);
      return apiFetch<{ coupon: Coupon }>("/v1/coupons", {
        method: "POST",
        body: JSON.stringify({
          organizationId: selectedOrgId,
          code,
          type,
          value: apiValue,
        }),
      });
    },
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["coupons", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const rows = coupons.data?.coupons ?? [];

  return (
    <PageContent maxWidth="full">
      <Stack gap="md">
        <PageHeader
          eyebrow={t("nav.section.commerce")}
          title={t("nav.coupons")}
          description="Promotions and discounts."
        />

        <SplitLayout
          primary={
            coupons.isLoading ? (
              <TableFrame>
                <TableSkeleton />
              </TableFrame>
            ) : rows.length === 0 ? (
              <EmptyState>No coupons yet — create one in the panel.</EmptyState>
            ) : (
              <TableFrame>
                <ul className="divide-y divide-[var(--border)] text-sm">
                  {rows.map((c) => (
                    <li key={c.id} className="px-4 py-2.5">
                      <code>{c.code}</code> — {c.type}{" "}
                      {c.type === "percent"
                        ? `${(c.value / 100).toFixed(0)}%`
                        : `${(c.value / 100).toFixed(2)} €`}{" "}
                      · {c.redemptionCount}
                      {c.maxRedemptions != null ? `/${c.maxRedemptions}` : ""}{" "}
                      uses
                      {!c.active ? " · inactive" : ""}
                    </li>
                  ))}
                </ul>
              </TableFrame>
            )
          }
          aside={
            <FormPanel title={t("coupon.create")} width="full">
              <FormField label={t("coupon.code")} htmlFor="code" size="full">
                <Input
                  id="code"
                  className="font-mono text-xs"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </FormField>
              <FormRow cols={2}>
                <FormField label={t("coupon.type")} htmlFor="type" size="full">
                  <Select
                    id="type"
                    value={type}
                    onChange={(e) =>
                      setType(e.target.value as "percent" | "fixed")
                    }
                  >
                    <option value="percent">{t("coupon.percent")}</option>
                    <option value="fixed">{t("coupon.fixed")}</option>
                  </Select>
                </FormField>
                <FormField
                  label={
                    type === "percent"
                      ? t("coupon.valuePercent")
                      : t("coupon.valueEuros")
                  }
                  htmlFor="value"
                  size="full"
                >
                  <Input
                    id="value"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                  />
                </FormField>
              </FormRow>
              {error ? <Alert>{error}</Alert> : null}
              <FormActions>
                <Button type="button" size="sm" onClick={() => create.mutate()}>
                  {t("coupon.create")}
                </Button>
              </FormActions>
            </FormPanel>
          }
        />
      </Stack>
    </PageContent>
  );
}
