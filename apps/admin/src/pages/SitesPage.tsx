import {
  Alert,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
  SplitLayout,
  Stack,
  TableFrame,
} from "@mestryx/ui";
import { listSitePresets } from "@mestryx/tokens/presets";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { apiFetch, slugify } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string };
type Site = {
  id: string;
  name: string;
  slug: string;
  status: string;
  defaultLocale?: string;
  cookieConsentEnabled?: boolean;
  cookiePolicyPath?: string;
  themeJson?: {
    version?: number;
    preset?: string;
    logoUrl?: string;
    primaryColor?: string;
    accentColor?: string;
    fontFamily?: string;
    fontSans?: string;
    backgroundColor?: string;
    accent?: string;
    background?: string;
    tokens?: {
      primary?: string;
      accent?: string;
      background?: string;
    };
  } | null;
  umamiWebsiteId?: string | null;
  umamiSrc?: string | null;
};

const SITE_PRESETS = listSitePresets();

function readThemeFields(site: Site) {
  const tj = site.themeJson;
  return {
    preset: tj?.preset ?? "storefront-base",
    primary:
      tj?.tokens?.primary ??
      tj?.primaryColor ??
      tj?.accent ??
      "",
    accent: tj?.tokens?.accent ?? tj?.accentColor ?? tj?.accent ?? "",
    background:
      tj?.tokens?.background ??
      tj?.backgroundColor ??
      tj?.background ??
      "",
    fontFamily: tj?.fontSans ?? tj?.fontFamily ?? "",
    logoUrl: tj?.logoUrl ?? "",
  };
}

export function SitesPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiFetch<{ organizations: Org[] }>("/v1/organizations"),
    retry: false,
  });

  const activeOrgId = useSelectedOrgId(orgs.data?.organizations ?? []) || null;

  const sites = useQuery({
    queryKey: ["sites", activeOrgId],
    enabled: Boolean(activeOrgId),
    queryFn: () =>
      apiFetch<{ sites: Site[] }>(`/v1/organizations/${activeOrgId}/sites`),
  });

  useEffect(() => {
    const list = sites.data?.sites ?? [];
    if (!selectedSiteId && list[0]) setSelectedSiteId(list[0].id);
  }, [sites.data, selectedSiteId]);

  const selectedSite = useMemo(
    () => (sites.data?.sites ?? []).find((s) => s.id === selectedSiteId),
    [sites.data, selectedSiteId],
  );

  const createSite = useMutation({
    mutationFn: () =>
      apiFetch<{ site: Site }>("/v1/sites", {
        method: "POST",
        body: JSON.stringify({
          organizationId: activeOrgId,
          name,
          slug: slug || slugify(name),
        }),
      }),
    onSuccess: async (data) => {
      setName("");
      setSlug("");
      setCreateOpen(false);
      setSelectedSiteId(data.site.id);
      await qc.invalidateQueries({ queryKey: ["sites", activeOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const patchSite = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch<{ site: Site }>(`/v1/sites/${selectedSiteId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["sites", activeOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const ensureLegal = useMutation({
    mutationFn: () =>
      apiFetch(`/v1/sites/${selectedSiteId}/ensure-legal-pages`, {
        method: "POST",
      }),
    onSuccess: () => setError(null),
    onError: (err: Error) => setError(err.message),
  });

  function buildThemeJsonFromForm() {
    const presetEl = document.getElementById(
      "themePreset",
    ) as HTMLSelectElement | null;
    const primaryColor = (
      document.getElementById("primaryColor") as HTMLInputElement | null
    )?.value.trim();
    const accentColor = (
      document.getElementById("accentColor") as HTMLInputElement | null
    )?.value.trim();
    const backgroundColor = (
      document.getElementById("backgroundColor") as HTMLInputElement | null
    )?.value.trim();
    const fontFamily = (
      document.getElementById("fontFamily") as HTMLInputElement | null
    )?.value.trim();
    const logoUrl = (
      document.getElementById("logoUrl") as HTMLInputElement | null
    )?.value.trim();
    const tokens: Record<string, string> = {};
    if (primaryColor) tokens.primary = primaryColor;
    if (accentColor) tokens.accent = accentColor;
    if (backgroundColor) tokens.background = backgroundColor;
    return {
      version: 2 as const,
      preset: presetEl?.value || "storefront-base",
      ...(Object.keys(tokens).length ? { tokens } : {}),
      ...(fontFamily ? { fontSans: fontFamily } : {}),
      ...(logoUrl ? { logoUrl } : {}),
    };
  }

  const siteList = (
    <TableFrame maxWidth="full">
      <ul className="divide-y divide-[var(--border)]">
        {(sites.data?.sites ?? []).map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => setSelectedSiteId(s.id)}
              className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-[var(--muted)] ${
                s.id === selectedSiteId
                  ? "bg-[var(--primary)]/10 font-semibold"
                  : ""
              }`}
            >
              <span className="min-w-0 truncate">
                {s.name}{" "}
                <code className="text-xs text-[var(--muted-foreground)]">
                  {s.slug}
                </code>
              </span>
              <Badge>{s.status}</Badge>
            </button>
          </li>
        ))}
        {(sites.data?.sites ?? []).length === 0 ? (
          <li>
            <EmptyState
              title={t("site.empty")}
              description={t("site.emptyHint")}
              action={
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCreateOpen(true)}
                >
                  {t("site.create")}
                </Button>
              }
            />
          </li>
        ) : null}
      </ul>
    </TableFrame>
  );

  const siteSettings = selectedSite ? (
    <FormPanel
      title={`${t("site.settings")} — ${selectedSite.name}`}
      width="full"
    >
      <Label className="flex items-center gap-2 font-normal">
        <input
          type="checkbox"
          checked={selectedSite.cookieConsentEnabled !== false}
          onChange={(e) =>
            patchSite.mutate({
              cookieConsentEnabled: e.target.checked,
            })
          }
        />
        {t("site.cookieConsent")}
      </Label>
      <FormRow cols={2}>
        <FormField
          label={t("site.cookiePolicyPath")}
          htmlFor="policy"
          size="full"
        >
          <Input
            id="policy"
            className="font-mono text-xs"
            defaultValue={selectedSite.cookiePolicyPath ?? "/privacy"}
            onBlur={(e) => {
              const v = e.target.value.trim() || "/privacy";
              if (v !== (selectedSite.cookiePolicyPath ?? "/privacy")) {
                patchSite.mutate({ cookiePolicyPath: v });
              }
            }}
          />
        </FormField>
        <FormField
          label={t("site.defaultLocale")}
          htmlFor="defaultLocale"
          size="full"
        >
          <Select
            id="defaultLocale"
            key={`${selectedSite.id}-locale`}
            defaultValue={selectedSite.defaultLocale === "fr" ? "fr" : "en"}
            onChange={(e) => {
              const v = e.target.value === "fr" ? "fr" : "en";
              if (v !== (selectedSite.defaultLocale ?? "en")) {
                patchSite.mutate({ defaultLocale: v });
              }
            }}
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
          </Select>
        </FormField>
      </FormRow>
      <FormActions>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => ensureLegal.mutate()}
          disabled={ensureLegal.isPending}
        >
          {t("site.ensureLegal")}
        </Button>
        <span className="text-xs text-[var(--muted-foreground)]">
          {t("site.legalHint")}{" "}
          <Link to="/pages" className="underline">
            {t("nav.pages")}
          </Link>{" "}
          (<code>privacy</code>, <code>terms</code>, <code>legal</code>).
        </span>
      </FormActions>
      <p className="pt-1 text-sm font-semibold">{t("site.theme")}</p>
      <FormField
        label={t("site.themePreset")}
        htmlFor="themePreset"
        size="full"
      >
        <Select
          id="themePreset"
          key={`${selectedSite.id}-preset`}
          defaultValue={readThemeFields(selectedSite).preset}
        >
          {SITE_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </Select>
      </FormField>
      <FormRow cols={3}>
        <FormField
          label={t("site.primaryColor")}
          htmlFor="primaryColor"
          size="full"
        >
          <Input
            id="primaryColor"
            key={`${selectedSite.id}-primary`}
            className="font-mono text-xs"
            defaultValue={readThemeFields(selectedSite).primary}
            placeholder="#hex or oklch(…)"
            onBlur={() => {
              const built = buildThemeJsonFromForm();
              if (built) patchSite.mutate({ themeJson: built });
            }}
          />
        </FormField>
        <FormField
          label={t("site.accentColor")}
          htmlFor="accentColor"
          size="full"
        >
          <Input
            id="accentColor"
            key={`${selectedSite.id}-accent`}
            className="font-mono text-xs"
            defaultValue={readThemeFields(selectedSite).accent}
            placeholder="#hex or oklch(…)"
          />
        </FormField>
        <FormField
          label={t("site.backgroundColor")}
          htmlFor="backgroundColor"
          size="full"
        >
          <Input
            id="backgroundColor"
            key={`${selectedSite.id}-bg`}
            className="font-mono text-xs"
            defaultValue={readThemeFields(selectedSite).background}
            placeholder="#hex or oklch(…)"
          />
        </FormField>
      </FormRow>
      <FormRow cols={2}>
        <FormField
          label={t("site.fontFamily")}
          htmlFor="fontFamily"
          size="full"
        >
          <Input
            id="fontFamily"
            key={`${selectedSite.id}-font`}
            defaultValue={readThemeFields(selectedSite).fontFamily}
            placeholder="IBM Plex Sans, sans-serif"
          />
        </FormField>
        <FormField label={t("site.logoUrl")} htmlFor="logoUrl" size="full">
          <Input
            id="logoUrl"
            key={`${selectedSite.id}-logo`}
            className="font-mono text-xs"
            defaultValue={readThemeFields(selectedSite).logoUrl}
            placeholder="https://…"
          />
        </FormField>
      </FormRow>
      <FormActions>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            const built = buildThemeJsonFromForm();
            if (built) patchSite.mutate({ themeJson: built });
          }}
          disabled={patchSite.isPending}
        >
          {t("site.saveTheme")}
        </Button>
      </FormActions>
      <p className="pt-1 text-sm font-semibold">{t("site.analytics")}</p>
      <FormRow cols={2}>
        <FormField
          label={t("site.umamiWebsiteId")}
          htmlFor="umamiWebsiteId"
          size="full"
        >
          <Input
            id="umamiWebsiteId"
            key={`${selectedSite.id}-umami-id`}
            className="font-mono text-xs"
            defaultValue={selectedSite.umamiWebsiteId ?? ""}
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (selectedSite.umamiWebsiteId ?? "")) {
                patchSite.mutate({ umamiWebsiteId: v || null });
              }
            }}
          />
        </FormField>
        <FormField label={t("site.umamiSrc")} htmlFor="umamiSrc" size="full">
          <Input
            id="umamiSrc"
            key={`${selectedSite.id}-umami-src`}
            className="font-mono text-xs"
            defaultValue={selectedSite.umamiSrc ?? ""}
            placeholder="https://stats.example.com/script.js"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if (v !== (selectedSite.umamiSrc ?? "")) {
                patchSite.mutate({ umamiSrc: v || null });
              }
            }}
          />
        </FormField>
      </FormRow>
      {error ? <Alert>{error}</Alert> : null}
    </FormPanel>
  ) : (
    <EmptyState
      title={t("site.empty")}
      description={t("site.emptyHint")}
      action={
        <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
          {t("site.create")}
        </Button>
      }
    />
  );

  return (
    <PageContent maxWidth="full">
      <Stack gap="md">
        <PageHeader
          eyebrow={t("nav.section.workspace")}
          title={t("nav.sites")}
          description={t("site.pageDescription")}
          actions={
            activeOrgId ? (
              <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
                {t("site.create")}
              </Button>
            ) : null
          }
        />
        {!activeOrgId ? (
          <EmptyState>{t("site.needOrganization")}</EmptyState>
        ) : (
          <>
            <Dialog
              open={createOpen}
              onOpenChange={(open) => {
                setCreateOpen(open);
                if (!open) {
                  setName("");
                  setSlug("");
                }
              }}
            >
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("site.create")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <FormField label={t("site.name")} htmlFor="site-name" size="full">
                    <Input
                      id="site-name"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setSlug(slugify(e.target.value));
                      }}
                    />
                  </FormField>
                  <FormField label={t("site.slug")} htmlFor="site-slug" size="full">
                    <Input
                      id="site-slug"
                      className="font-mono text-xs"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                    />
                  </FormField>
                  {error && !selectedSite ? <Alert>{error}</Alert> : null}
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => createSite.mutate()}
                    disabled={!name || createSite.isPending}
                  >
                    {t("site.create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <SplitLayout
              variant="listDetail"
              primary={siteList}
              aside={siteSettings}
            />
          </>
        )}
      </Stack>
    </PageContent>
  );
}
