import {
  Alert,
  Button,
  EmptyState,
  FilterBar,
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
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type Site = { id: string; name: string; slug: string; status: string };
type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  href: string | null;
  sortOrder: number;
  active: boolean;
};

export function BannersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [siteId, setSiteId] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [href, setHref] = useState("/");
  const [sortOrder, setSortOrder] = useState("0");
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

  const banners = useQuery({
    queryKey: ["banners", selectedOrgId, siteId],
    enabled: Boolean(selectedOrgId && siteId),
    queryFn: () =>
      apiFetch<{ banners: Banner[] }>(
        `/v1/organizations/${selectedOrgId}/sites/${siteId}/banners`,
      ),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch<{ banner: Banner }>("/v1/banners", {
        method: "POST",
        body: JSON.stringify({
          organizationId: selectedOrgId,
          siteId,
          title,
          subtitle: subtitle || null,
          imageUrl: imageUrl || null,
          href: href || null,
          sortOrder: Number.parseInt(sortOrder, 10) || 0,
          active: true,
        }),
      }),
    onSuccess: async () => {
      setError(null);
      setTitle("");
      setSubtitle("");
      setImageUrl("");
      await qc.invalidateQueries({
        queryKey: ["banners", selectedOrgId, siteId],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggle = useMutation({
    mutationFn: (b: Banner) =>
      apiFetch<{ banner: Banner }>(`/v1/banners/${b.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !b.active }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["banners", selectedOrgId, siteId],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/v1/banners/${id}`, { method: "DELETE" }),
    onSuccess: async () => {
      await qc.invalidateQueries({
        queryKey: ["banners", selectedOrgId, siteId],
      });
    },
    onError: (err: Error) => setError(err.message),
  });

  const rows = banners.data?.banners ?? [];

  return (
    <PageContent maxWidth="wide">
      <Stack gap="md">
        <PageHeader
          title={t("nav.banners")}
          description="Storefront promo banners."
        />

        <FilterBar>
          <div className="min-w-[12rem]">
            <Label htmlFor="banner-site">{t("product.site")}</Label>
            <Select
              id="banner-site"
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
            banners.isLoading ? (
              <TableFrame>
                <TableSkeleton />
              </TableFrame>
            ) : rows.length === 0 ? (
              <EmptyState>{t("banner.empty")}</EmptyState>
            ) : (
              <TableFrame>
                <ul className="divide-y divide-[var(--border)]">
                  {rows.map((b) => (
                    <li
                      key={b.id}
                      className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                    >
                      <span>
                        <strong>{b.title}</strong>
                        {b.subtitle ? ` — ${b.subtitle}` : ""}{" "}
                        <code>{b.active ? "active" : "off"}</code>
                      </span>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => toggle.mutate(b)}
                        >
                          {b.active
                            ? t("banner.deactivate")
                            : t("banner.activate")}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => remove.mutate(b.id)}
                        >
                          {t("banner.delete")}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </TableFrame>
            )
          }
          aside={
            <FormPanel title={t("banner.create")} width="full">
              <FormField label={t("banner.title")} htmlFor="title" size="full">
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FormField>
              <FormField
                label={t("banner.subtitle")}
                htmlFor="subtitle"
                size="full"
              >
                <Input
                  id="subtitle"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                />
              </FormField>
              <FormField
                label={t("banner.imageUrl")}
                htmlFor="image"
                size="full"
              >
                <Input
                  id="image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://"
                />
              </FormField>
              <FormRow cols={2}>
                <FormField label={t("banner.href")} htmlFor="href" size="full">
                  <Input
                    id="href"
                    value={href}
                    onChange={(e) => setHref(e.target.value)}
                  />
                </FormField>
                <FormField
                  label={t("banner.sortOrder")}
                  htmlFor="sort"
                  size="full"
                >
                  <Input
                    id="sort"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                  />
                </FormField>
              </FormRow>
              {error ? <Alert>{error}</Alert> : null}
              <FormActions>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => create.mutate()}
                  disabled={!title || !siteId}
                >
                  {t("banner.create")}
                </Button>
              </FormActions>
            </FormPanel>
          }
        />
      </Stack>
    </PageContent>
  );
}
