import {
  Alert,
  Badge,
  Button,
  EmptyState,
  FilterBar,
  FormActions,
  FormField,
  FormPanel,
  FormRow,
  Input,
  Label,
  Muted,
  PageContent,
  PageHeader,
  Select,
  SplitLayout,
  Stack,
  TableFrame,
  TableSkeleton,
} from "@mestryx/ui";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type Site = { id: string; name: string; slug: string };
type Method = {
  id: string;
  name: string;
  priceCents: number;
  currency: string;
  active: boolean;
};
type Zone = {
  id: string;
  name: string;
  siteId: string | null;
  countries: string[];
  methods: Method[];
};

function formatMoney(cents: number, currency: string, language: string) {
  return new Intl.NumberFormat(language === "fr" ? "fr-FR" : "en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function ShippingPage() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const [siteId, setSiteId] = useState("");
  const [zoneName, setZoneName] = useState("France");
  const [countries, setCountries] = useState("FR");
  const [methodName, setMethodName] = useState("Colissimo");
  const [methodPrice, setMethodPrice] = useState("4.90");
  const [selectedZoneId, setSelectedZoneId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiFetch<{ organizations: Org[] }>("/v1/organizations"),
    retry: false,
  });

  const selectedOrgId = useSelectedOrgId(orgs.data?.organizations ?? []);

  const sites = useQuery({
    queryKey: ["sites", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ sites: Site[] }>(`/v1/organizations/${selectedOrgId}/sites`),
  });

  useEffect(() => {
    setSiteId("");
    setSelectedZoneId("");
  }, [selectedOrgId]);

  useEffect(() => {
    const lunaSite = sites.data?.sites?.find((s) => s.slug === "luna");
    const first = sites.data?.sites?.[0]?.id ?? "";
    if (!siteId && (lunaSite?.id || first)) {
      setSiteId(lunaSite?.id ?? first);
    }
  }, [sites.data, siteId]);

  const zones = useQuery({
    queryKey: ["shipping-zones", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ zones: Zone[] }>(
        `/v1/organizations/${selectedOrgId}/shipping-zones`,
      ),
  });

  const createZone = useMutation({
    mutationFn: () =>
      apiFetch<{ zone: Zone }>("/v1/shipping-zones", {
        method: "POST",
        body: JSON.stringify({
          organizationId: selectedOrgId,
          siteId: siteId || null,
          name: zoneName,
          countries: countries
            .split(",")
            .map((c) => c.trim().toUpperCase())
            .filter(Boolean),
        }),
      }),
    onSuccess: async (data) => {
      setError(null);
      setSelectedZoneId(data.zone.id);
      await qc.invalidateQueries({ queryKey: ["shipping-zones", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const createMethod = useMutation({
    mutationFn: () => {
      const priceCents = Math.round(Number.parseFloat(methodPrice) * 100);
      return apiFetch<{ method: Method }>(
        `/v1/shipping-zones/${selectedZoneId}/methods`,
        {
          method: "POST",
          body: JSON.stringify({
            name: methodName,
            priceCents,
            currency: "eur",
          }),
        },
      );
    },
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["shipping-zones", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteZone = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/v1/shipping-zones/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      setSelectedZoneId("");
      await qc.invalidateQueries({ queryKey: ["shipping-zones", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const deleteMethod = useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ ok: boolean }>(`/v1/shipping-methods/${id}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["shipping-zones", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const allZones = zones.data?.zones;
  const zoneRows = useMemo(() => {
    const list = allZones ?? [];
    if (!siteId) return list;
    return list.filter((z) => z.siteId === siteId || z.siteId == null);
  }, [allZones, siteId]);

  useEffect(() => {
    if (zoneRows.length === 0) {
      if (selectedZoneId) setSelectedZoneId("");
      return;
    }
    if (!zoneRows.some((z) => z.id === selectedZoneId)) {
      setSelectedZoneId(zoneRows[0]!.id);
    }
  }, [zoneRows, selectedZoneId]);

  return (
    <PageContent maxWidth="full">
      <Stack gap="md">
        <PageHeader
          eyebrow={t("nav.section.commerce")}
          title={t("nav.shipping")}
          description={t("shipping.description")}
        />
        {error ? <Alert tone="error">{error}</Alert> : null}

        <FilterBar>
          <div className="flex min-w-[12rem] flex-col gap-1.5 sm:min-w-[14rem]">
            <Label htmlFor="ship-site">{t("product.publishSite")}</Label>
            <Select
              id="ship-site"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              {(sites.data?.sites ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
        </FilterBar>

        <SplitLayout
          primary={
            zones.isLoading ? (
              <TableFrame>
                <TableSkeleton />
              </TableFrame>
            ) : zoneRows.length === 0 ? (
              <EmptyState
                title={t("shipping.empty")}
                description={t("shipping.emptyHint")}
                action={
                  <Button
                    type="button"
                    size="sm"
                    onClick={() =>
                      document.getElementById("zone-name")?.focus()
                    }
                  >
                    {t("shipping.createZone")}
                  </Button>
                }
              />
            ) : (
              <TableFrame>
                <ul className="divide-y divide-[var(--border)]">
                  {zoneRows.map((z) => (
                    <li key={z.id} className="space-y-2 px-4 py-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <strong>{z.name}</strong>
                          {z.countries.map((code) => (
                            <Badge
                              key={code}
                              tone="muted"
                              className="font-mono text-[10px] uppercase"
                            >
                              {code}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="shrink-0"
                          onClick={() => deleteZone.mutate(z.id)}
                        >
                          {t("shipping.deleteZone")}
                        </Button>
                      </div>
                      {z.methods.length > 0 ? (
                        <ul className="space-y-1 border-l border-[var(--border)] pl-3">
                          {z.methods.map((m) => (
                            <li
                              key={m.id}
                              className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2"
                            >
                              <span className="truncate">{m.name}</span>
                              <Badge
                                tone={m.active ? "success" : "muted"}
                                className="shrink-0"
                              >
                                {m.active
                                  ? t("shipping.methodActive")
                                  : t("shipping.methodInactive")}
                              </Badge>
                              <span className="tabular-nums text-[var(--muted-foreground)]">
                                {formatMoney(
                                  m.priceCents,
                                  m.currency,
                                  i18n.language,
                                )}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0"
                                onClick={() => deleteMethod.mutate(m.id)}
                              >
                                {t("shipping.deleteMethod")}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <Muted as="p" className="pl-3 text-xs">
                          {t("shipping.noMethods")}
                        </Muted>
                      )}
                    </li>
                  ))}
                </ul>
              </TableFrame>
            )
          }
          aside={
            <FormPanel title={t("shipping.createZone")} width="full">
              <FormRow cols={2}>
                <FormField
                  label={t("shipping.zoneName")}
                  htmlFor="zone-name"
                  size="full"
                >
                  <Input
                    id="zone-name"
                    value={zoneName}
                    onChange={(e) => setZoneName(e.target.value)}
                  />
                </FormField>
                <FormField
                  label={t("shipping.countries")}
                  htmlFor="zone-countries"
                  size="full"
                >
                  <Input
                    id="zone-countries"
                    className="font-mono text-xs"
                    value={countries}
                    onChange={(e) => setCountries(e.target.value)}
                    placeholder="FR,BE"
                  />
                </FormField>
              </FormRow>
              <FormActions>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => createZone.mutate()}
                  disabled={!selectedOrgId || createZone.isPending}
                >
                  {t("shipping.createZone")}
                </Button>
              </FormActions>

              <div className="mt-4 space-y-3 border-t border-[var(--border)] pt-4">
                <h3 className="text-sm font-medium text-[var(--foreground)]">
                  {t("shipping.addMethod")}
                </h3>
                <FormField
                  label={t("shipping.zone")}
                  htmlFor="method-zone"
                  size="full"
                >
                  <Select
                    id="method-zone"
                    value={selectedZoneId}
                    onChange={(e) => setSelectedZoneId(e.target.value)}
                    disabled={zoneRows.length === 0}
                  >
                    {(zones.data?.zones ?? []).map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name}
                      </option>
                    ))}
                  </Select>
                </FormField>
                <FormRow cols={2}>
                  <FormField
                    label={t("shipping.methodName")}
                    htmlFor="method-name"
                    size="full"
                  >
                    <Input
                      id="method-name"
                      value={methodName}
                      onChange={(e) => setMethodName(e.target.value)}
                    />
                  </FormField>
                  <FormField
                    label={t("shipping.price")}
                    htmlFor="method-price"
                    size="full"
                  >
                    <Input
                      id="method-price"
                      value={methodPrice}
                      onChange={(e) => setMethodPrice(e.target.value)}
                    />
                  </FormField>
                </FormRow>
                <FormActions>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => createMethod.mutate()}
                    disabled={!selectedZoneId || createMethod.isPending}
                  >
                    {t("shipping.createMethod")}
                  </Button>
                </FormActions>
              </div>
            </FormPanel>
          }
        />
      </Stack>
    </PageContent>
  );
}
