import {
  Alert,
  FormPanel,
  Label,
  Muted,
  PageContent,
  PageHeader,
  Stack,
} from "@mestryx/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { apiFetch } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = {
  id: string;
  name: string;
  slug: string;
  modulesAllowed?: string[];
  planId?: string | null;
  role?: string;
};

type Billing = {
  planId: string;
  planName: string;
  planModulesAllowed: string[];
  orgModulesAllowed: string[];
  canManage: boolean;
};

const ALL_MODULES = ["cms", "commerce"] as const;

export function ModulesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const selectedOrg = useMemo(
    () => orgs.data?.organizations?.find((o) => o.id === selectedOrgId),
    [orgs.data, selectedOrgId],
  );

  const enabled = new Set(
    billing.data?.billing.orgModulesAllowed ??
      selectedOrg?.modulesAllowed ??
      ["cms"],
  );
  const planMods = new Set(
    billing.data?.billing.planModulesAllowed ?? ["cms"],
  );
  const canManage = billing.data?.billing.canManage ?? false;

  const patch = useMutation({
    mutationFn: (modulesAllowed: string[]) =>
      apiFetch<{ organization: Org }>(
        `/v1/organizations/${selectedOrgId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ modulesAllowed }),
        },
      ),
    onSuccess: async () => {
      setError(null);
      setNotice(t("modules.saved"));
      await qc.invalidateQueries({ queryKey: ["organizations"] });
      await qc.invalidateQueries({ queryKey: ["billing", selectedOrgId] });
    },
    onError: (err: Error) => {
      setNotice(null);
      setError(err.message);
    },
  });

  function toggle(mod: string, on: boolean) {
    const next = new Set(enabled);
    if (on) next.add(mod);
    else next.delete(mod);
    if (!next.has("cms")) next.add("cms");
    patch.mutate([...next]);
  }

  return (
    <PageContent maxWidth="full">
      <Stack gap="md">
        <PageHeader
          title={t("nav.modules")}
          description={t("modules.subtitle")}
        />
        {error ? <Alert tone="error">{error}</Alert> : null}
        {notice ? <Alert tone="info">{notice}</Alert> : null}

        <FormPanel title={t("nav.modules")} width="md">
          <Muted as="p">
            {t("modules.planHint", {
              plan: billing.data?.billing.planName ?? selectedOrg?.planId ?? "—",
            })}
          </Muted>
          {ALL_MODULES.map((mod) => {
            const inPlan = planMods.has(mod);
            const isOn = enabled.has(mod);
            return (
              <Label key={mod}>
                <input
                  type="checkbox"
                  checked={isOn}
                  disabled={
                    !canManage || !inPlan || patch.isPending || mod === "cms"
                  }
                  onChange={(e) => toggle(mod, e.target.checked)}
                />{" "}
                {t(`modules.${mod}`)}
                {!inPlan ? <Muted> — {t("modules.notInPlan")}</Muted> : null}
              </Label>
            );
          })}
          <p>
            <Link to="/billing">{t("modules.seeBilling")}</Link>
          </p>
        </FormPanel>
      </Stack>
    </PageContent>
  );
}
