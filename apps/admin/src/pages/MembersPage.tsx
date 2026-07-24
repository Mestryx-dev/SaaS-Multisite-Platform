import {
  Alert,
  Button,
  EmptyState,
  FormActions,
  FormField,
  FormPanel,
  Input,
  Label,
  ListPanel,
  Muted,
  PageContent,
  PageHeader,
  SearchField,
  Select,
  SplitLayout,
  TableSkeleton,
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
import { UserPlus } from "lucide-react";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";
import { useSelectedOrgId } from "../lib/workspace";

type Org = { id: string; name: string; slug: string; role?: string };
type Member = {
  id: string;
  userId: string;
  role: string;
  email: string;
  name: string | null;
  createdAt: string;
};
type Invite = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export function MembersPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "editor" | "viewer">("editor");
  const [error, setError] = useState<string | null>(null);
  const [lastAcceptUrl, setLastAcceptUrl] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const orgs = useQuery({
    queryKey: ["organizations"],
    queryFn: () => apiFetch<{ organizations: Org[] }>("/v1/organizations"),
    retry: false,
  });

  const selectedOrgId = useSelectedOrgId(orgs.data?.organizations ?? []);

  const members = useQuery({
    queryKey: ["members", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ members: Member[] }>(
        `/v1/organizations/${selectedOrgId}/members`,
      ),
  });

  const invites = useQuery({
    queryKey: ["invites", selectedOrgId],
    enabled: Boolean(selectedOrgId),
    queryFn: () =>
      apiFetch<{ invites: Invite[] }>(
        `/v1/organizations/${selectedOrgId}/invites`,
      ),
  });

  const invite = useMutation({
    mutationFn: () =>
      apiFetch<{ invite: Invite; acceptUrl: string }>(
        `/v1/organizations/${selectedOrgId}/invites`,
        {
          method: "POST",
          body: JSON.stringify({ email, role }),
        },
      ),
    onSuccess: async (data) => {
      setError(null);
      setEmail("");
      setLastAcceptUrl(data.acceptUrl);
      toast.success(t("members.inviteSent"));
      await qc.invalidateQueries({ queryKey: ["invites", selectedOrgId] });
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const patchRole = useMutation({
    mutationFn: (input: { membershipId: string; role: string }) =>
      apiFetch(`/v1/organizations/${selectedOrgId}/members/${input.membershipId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: input.role }),
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["members", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const removeMember = useMutation({
    mutationFn: (membershipId: string) =>
      apiFetch(`/v1/organizations/${selectedOrgId}/members/${membershipId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["members", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const revokeInvite = useMutation({
    mutationFn: (inviteId: string) =>
      apiFetch(`/v1/organizations/${selectedOrgId}/invites/${inviteId}`, {
        method: "DELETE",
      }),
    onSuccess: async () => {
      setError(null);
      await qc.invalidateQueries({ queryKey: ["invites", selectedOrgId] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const memberRows = useMemo(() => {
    const all = members.data?.members ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (m) =>
        m.email.toLowerCase().includes(q) ||
        (m.name?.toLowerCase().includes(q) ?? false),
    );
  }, [members.data, query]);
  const inviteRows = invites.data?.invites ?? [];

  return (
    <PageContent maxWidth="wide">
      <Stack gap="md">
        <PageHeader
          title={t("nav.members")}
          description="Invite and manage roles."
        />

        <SplitLayout
          primary={
            <ListPanel
              title={t("members.list")}
              description="Active members and pending invites."
              actions={
                <SearchField
                  placeholder="Search members…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Search members"
                />
              }
            >
              <div className="space-y-4 p-4">
                {members.isLoading ? (
                  <TableFrame>
                    <TableSkeleton />
                  </TableFrame>
                ) : memberRows.length === 0 ? (
                  <EmptyState
                    variant="plain"
                    icon={<UserPlus />}
                    title={`${t("members.list")} — empty`}
                    description={
                      query
                        ? "No members match the search."
                        : "Invite a teammate to collaborate on this organization."
                    }
                    action={
                      query ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => setQuery("")}
                        >
                          Clear search
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() =>
                            document.getElementById("email")?.focus()
                          }
                        >
                          {t("members.invite")}
                        </Button>
                      )
                    }
                  />
                ) : (
                  <TableFrame>
                    <Table>
                      <Thead>
                        <Tr>
                          <Th>{t("auth.email")}</Th>
                          <Th>{t("members.role")}</Th>
                          <Th />
                        </Tr>
                      </Thead>
                      <Tbody>
                        {memberRows.map((m) => (
                          <Tr key={m.id}>
                            <Td>
                              {m.name ? `${m.name} · ` : ""}
                              {m.email}
                            </Td>
                            <Td>
                              <Select
                                value={m.role}
                                onChange={(e) =>
                                  patchRole.mutate({
                                    membershipId: m.id,
                                    role: e.target.value,
                                  })
                                }
                              >
                                <option value="owner">owner</option>
                                <option value="admin">admin</option>
                                <option value="editor">editor</option>
                                <option value="viewer">viewer</option>
                              </Select>
                            </Td>
                            <Td>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeMember.mutate(m.id)}
                              >
                                {t("members.remove")}
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </TableFrame>
                )}

                <div>
                  <h3 className="mb-2 text-sm font-semibold">
                    {t("members.pending")}
                  </h3>
                  {inviteRows.length === 0 ? (
                    <EmptyState variant="plain">
                      {t("members.noPending")}
                    </EmptyState>
                  ) : (
                    <TableFrame>
                      <ul className="divide-y divide-[var(--border)]">
                        {inviteRows.map((i) => (
                          <li
                            key={i.id}
                            className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-sm"
                          >
                            <span>
                              {i.email} · {i.role} · expires{" "}
                              {new Date(i.expiresAt).toLocaleDateString()}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => revokeInvite.mutate(i.id)}
                            >
                              {t("members.revoke")}
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </TableFrame>
                  )}
                </div>
              </div>
            </ListPanel>
          }
          aside={
            <FormPanel title={t("members.invite")} width="full">
              <FormField label={t("auth.email")} htmlFor="email" size="full">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormField>
              <FormField label={t("members.role")} htmlFor="role" size="full">
                <Select
                  id="role"
                  value={role}
                  onChange={(e) =>
                    setRole(e.target.value as "admin" | "editor" | "viewer")
                  }
                >
                  <option value="admin">admin</option>
                  <option value="editor">editor</option>
                  <option value="viewer">viewer</option>
                </Select>
              </FormField>
              {lastAcceptUrl ? (
                <Muted as="p">
                  {t("members.acceptLink")}: <code>{lastAcceptUrl}</code>
                </Muted>
              ) : null}
              {error ? <Alert>{error}</Alert> : null}
              <FormActions>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => invite.mutate()}
                  disabled={!email || !selectedOrgId}
                >
                  {t("members.sendInvite")}
                </Button>
              </FormActions>
            </FormPanel>
          }
        />
      </Stack>
    </PageContent>
  );
}
