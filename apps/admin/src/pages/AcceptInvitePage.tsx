import { Alert, Button, FormActions, FormPanel, Muted, Stack } from "@mestryx/ui";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "../lib/api";

type InviteMeta = {
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  organizationName: string;
  organizationId: string;
};

export function AcceptInvitePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") ?? "";
  }, []);

  const session = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      try {
        return await apiFetch<{ user?: { email: string } }>("/api/auth/get-session");
      } catch {
        return { user: undefined };
      }
    },
    retry: false,
  });

  const invite = useQuery({
    queryKey: ["invite", token],
    enabled: Boolean(token),
    queryFn: () => apiFetch<{ invite: InviteMeta }>(`/v1/invites/${token}`),
    retry: false,
  });

  const accept = useMutation({
    mutationFn: () =>
      apiFetch(`/v1/invites/${token}/accept`, {
        method: "POST",
        body: "{}",
      }),
    onSuccess: async () => {
      setError(null);
      setDone(true);
      await navigate({ to: "/" });
    },
    onError: (err: Error) => setError(err.message),
  });

  const signedIn = Boolean(session.data?.user);
  const signInHref = `/sign-in?return=${encodeURIComponent(`/accept-invite?token=${token}`)}`;

  useEffect(() => {
    if (!token) setError(t("members.missingToken"));
  }, [token, t]);

  return (
    <FormPanel width="md" title={t("members.acceptTitle")}>
      <Stack gap="sm">
        {!token ? <Alert>{t("members.missingToken")}</Alert> : null}
        {invite.isError ? <Alert>{t("members.inviteNotFound")}</Alert> : null}
        {invite.data ? (
          <>
            <Muted as="p">
              {invite.data.invite.organizationName} · {invite.data.invite.role} ·{" "}
              {invite.data.invite.email}
            </Muted>
            <Muted as="p">Status: {invite.data.invite.status}</Muted>
          </>
        ) : null}

        {!signedIn && token ? (
          <>
            <Muted>{t("members.signInFirst")}</Muted>
            <a href={signInHref} className="text-sm underline">
              {t("auth.signIn")}
            </a>
          </>
        ) : null}

        {signedIn && invite.data?.invite.status === "pending" && !done ? (
          <FormActions>
            <Button type="button" onClick={() => accept.mutate()}>
              {t("members.accept")}
            </Button>
          </FormActions>
        ) : null}

        {error ? <Alert>{error}</Alert> : null}
        {done ? <Muted>{t("members.accepted")}</Muted> : null}
      </Stack>
    </FormPanel>
  );
}
