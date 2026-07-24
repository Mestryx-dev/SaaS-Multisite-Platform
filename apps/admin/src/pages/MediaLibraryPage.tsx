import {
  Alert,
  Button,
  EmptyState,
  FilterBar,
  FormActions,
  FormField,
  FormPanel,
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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type Site = { id: string; name: string; slug: string };
type Asset = {
  id: string;
  url: string;
  contentType: string | null;
  siteId: string | null;
  createdAt: string;
};

export function MediaLibraryPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [siteId, setSiteId] = useState("");
  const [url, setUrl] = useState("");
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
  }, [selectedOrgId]);

  useEffect(() => {
    const lunaSite = sites.data?.sites?.find((s) => s.slug === "luna");
    const first = sites.data?.sites?.[0]?.id ?? "";
    if (!siteId && (lunaSite?.id || first)) {
      setSiteId(lunaSite?.id ?? first);
    }
  }, [sites.data, siteId]);

  const assets = useQuery({
    queryKey: ["media", selectedOrgId, siteId],
    enabled: Boolean(selectedOrgId),
    queryFn: () => {
      const qs = siteId ? `?siteId=${encodeURIComponent(siteId)}` : "";
      return apiFetch<{ assets: Asset[] }>(
        `/v1/organizations/${selectedOrgId}/media${qs}`,
      );
    },
  });

  const register = useMutation({
    mutationFn: () =>
      apiFetch("/v1/media", {
        method: "POST",
        body: JSON.stringify({
          organizationId: selectedOrgId,
          siteId: siteId || null,
          url,
        }),
      }),
    onSuccess: async () => {
      setUrl("");
      setError(null);
      await qc.invalidateQueries({ queryKey: ["media", selectedOrgId, siteId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const rows = assets.data?.assets ?? [];

  return (
    <PageContent maxWidth="wide">
      <Stack gap="md">
        <PageHeader
          title={t("nav.media")}
          description="Upload and reuse assets."
        />

        <FilterBar>
          <div className="min-w-[12rem]">
            <Label htmlFor="media-site">{t("product.site")}</Label>
            <Select
              id="media-site"
              value={siteId}
              onChange={(e) => setSiteId(e.target.value)}
            >
              <option value="">— org-wide —</option>
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
            assets.isLoading ? (
              <TableFrame>
                <TableSkeleton />
              </TableFrame>
            ) : rows.length === 0 ? (
              <EmptyState
                title={t("media.empty")}
                description="Register an asset URL to reuse across pages and products."
                action={
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => document.getElementById("url")?.focus()}
                  >
                    {t("media.register")}
                  </Button>
                }
              />
            ) : (
              <TableFrame>
                <ul className="divide-y divide-[var(--border)]">
                  {rows.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-4 px-4 py-3 text-sm"
                    >
                      <img
                        src={a.url}
                        alt=""
                        className="size-16 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <code className="break-all text-xs">{a.url}</code>
                        <div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => navigator.clipboard.writeText(a.url)}
                          >
                            {t("media.copyUrl")}
                          </Button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </TableFrame>
            )
          }
          aside={
            <FormPanel title={t("media.register")} width="full">
              <FormField label={t("media.url")} htmlFor="url" size="full">
                <Input
                  id="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://"
                />
              </FormField>
              {error ? <Alert>{error}</Alert> : null}
              <FormActions>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => register.mutate()}
                  disabled={!url}
                >
                  {t("media.register")}
                </Button>
              </FormActions>
            </FormPanel>
          }
        />
      </Stack>
    </PageContent>
  );
}
