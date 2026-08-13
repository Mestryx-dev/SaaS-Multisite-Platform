import {
  Alert,
  Button,
  FormActions,
  FormField,
  FormPanel,
  Input,
  Muted,
  Stack,
} from "@mestryx/ui";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../lib/api";
import { safeReturnPath } from "../lib/auth-return";
import { isDemoMode } from "../lib/demo";

export function SignUpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const returnTo = safeReturnPath(
    new URLSearchParams(window.location.search).get("return"),
  );
  const signInHref =
    returnTo === "/"
      ? "/sign-in"
      : `/sign-in?return=${encodeURIComponent(returnTo)}`;

  useEffect(() => {
    if (!isDemoMode) return;
    void navigate({ to: "/sign-in" });
  }, [navigate]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (isDemoMode) {
      setError(t("demo.signUpDisabled"));
      return;
    }
    setError(null);
    setPending(true);
    try {
      await apiFetch("/api/auth/sign-up/email", {
        method: "POST",
        body: JSON.stringify({ email, password, name: name || email }),
      });
      if (returnTo.startsWith("/accept-invite")) {
        window.location.href = returnTo;
        return;
      }
      void navigate({ to: returnTo as "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.signUpFailed"));
    } finally {
      setPending(false);
    }
  }

  if (isDemoMode) {
    return (
      <FormPanel width="md">
        <Stack gap="md">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-[var(--foreground)]">
              {t("auth.signUp")}
            </h1>
            <Muted>{t("demo.signUpDisabled")}</Muted>
          </div>
          <a
            href={signInHref}
            className="text-sm text-[var(--primary)] underline-offset-2 hover:underline"
          >
            {t("demo.enter")}
          </a>
        </Stack>
      </FormPanel>
    );
  }

  return (
    <FormPanel width="md">
      <Stack gap="md">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            {t("auth.signUp")}
          </h1>
          <Muted>{t("auth.signUpHint")}</Muted>
        </div>
        <form onSubmit={onSubmit} aria-busy={pending}>
          <Stack gap="sm">
            <FormField label={t("auth.name")} htmlFor="name" size="full">
              <Input
                id="name"
                autoComplete="name"
                value={name}
                disabled={pending}
                onChange={(e) => setName(e.target.value)}
              />
            </FormField>
            <FormField label={t("auth.email")} htmlFor="email" size="full">
              <Input
                id="email"
                autoComplete="email"
                value={email}
                disabled={pending}
                onChange={(e) => setEmail(e.target.value)}
              />
            </FormField>
            <FormField label={t("auth.password")} htmlFor="password" size="full">
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                disabled={pending}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>
            {error ? <Alert>{error}</Alert> : null}
            <FormActions>
              <Button type="submit" disabled={pending}>
                {pending ? "…" : t("auth.signUp")}
              </Button>
              <a
                href={signInHref}
                className="text-sm text-[var(--muted-foreground)] underline-offset-2 hover:underline"
              >
                {t("auth.signIn")}
              </a>
            </FormActions>
          </Stack>
        </form>
      </Stack>
    </FormPanel>
  );
}
