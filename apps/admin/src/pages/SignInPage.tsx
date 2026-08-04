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
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "@tanstack/react-router";
import { apiFetch } from "../lib/api";
import { safeReturnPath } from "../lib/auth-return";

export function SignInPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const returnTo = safeReturnPath(
    new URLSearchParams(window.location.search).get("return"),
  );
  const signUpHref =
    returnTo === "/"
      ? "/sign-up"
      : `/sign-up?return=${encodeURIComponent(returnTo)}`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      await apiFetch("/api/auth/sign-in/email", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (returnTo.startsWith("/accept-invite")) {
        window.location.href = returnTo;
        return;
      }
      void navigate({ to: returnTo as "/" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.signInFailed"));
    } finally {
      setPending(false);
    }
  }

  return (
    <FormPanel width="md">
      <Stack gap="md">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold text-[var(--foreground)]">
            {t("auth.signIn")}
          </h1>
          <Muted>{t("auth.signInHint")}</Muted>
        </div>
        <form onSubmit={onSubmit} aria-busy={pending}>
          <Stack gap="sm">
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
                autoComplete="current-password"
                value={password}
                disabled={pending}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>
            {error ? <Alert>{error}</Alert> : null}
            <FormActions>
              <Button type="submit" disabled={pending}>
                {pending ? "…" : t("auth.signIn")}
              </Button>
              <a
                href={signUpHref}
                className="text-sm text-[var(--muted-foreground)] underline-offset-2 hover:underline"
              >
                {t("auth.signUp")}
              </a>
            </FormActions>
          </Stack>
        </form>
      </Stack>
    </FormPanel>
  );
}
