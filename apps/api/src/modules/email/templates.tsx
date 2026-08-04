import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";
import { emailT, type EmailLocale } from "./i18n.js";

function money(cents: number, currency: string, locale: EmailLocale) {
  const intlLocale = locale === "fr" ? "fr-FR" : "en-US";
  try {
    return new Intl.NumberFormat(intlLocale, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${(cents / 100).toFixed(2)} ${currency}`;
  }
}

export type OrderEmailProps = {
  locale?: EmailLocale;
  orderPublicId: string;
  totalCents?: number;
  currency?: string;
  invoiceNumber?: string;
  carrier?: string;
  trackingNumber?: string;
};

function Layout(props: {
  locale: EmailLocale;
  preview: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Html lang={props.locale}>
      <Head />
      <Preview>{props.preview}</Preview>
      <Body style={{ backgroundColor: "#f6f6f6", fontFamily: "sans-serif" }}>
        <Container
          style={{
            backgroundColor: "#ffffff",
            margin: "24px auto",
            padding: "24px",
            maxWidth: "560px",
          }}
        >
          <Heading as="h1" style={{ fontSize: "20px", margin: "0 0 16px" }}>
            {props.title}
          </Heading>
          {props.children}
          <Hr />
          <Text style={{ color: "#666", fontSize: "12px" }}>
            {emailT(props.locale, "email.layout.footer")}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export function OrderConfirmationEmail(props: OrderEmailProps) {
  const locale = props.locale ?? "en";
  const id = props.orderPublicId;
  const total =
    props.totalCents != null && props.currency
      ? money(props.totalCents, props.currency, locale)
      : null;
  return (
    <Layout
      locale={locale}
      preview={emailT(locale, "email.order.confirmation.preview", { id })}
      title={emailT(locale, "email.order.confirmation.title")}
    >
      <Text>{emailT(locale, "email.order.confirmation.body", { id })}</Text>
      {total ? (
        <Text>
          {emailT(locale, "email.order.confirmation.total", { total })}
        </Text>
      ) : null}
      <Section>
        <Text>{emailT(locale, "email.order.confirmation.followUp")}</Text>
      </Section>
    </Layout>
  );
}

export function OrderPaidEmail(props: OrderEmailProps) {
  const locale = props.locale ?? "en";
  const id = props.orderPublicId;
  const total =
    props.totalCents != null && props.currency
      ? money(props.totalCents, props.currency, locale)
      : null;
  return (
    <Layout
      locale={locale}
      preview={emailT(locale, "email.order.paid.preview", { id })}
      title={emailT(locale, "email.order.paid.title")}
    >
      <Text>{emailT(locale, "email.order.paid.body", { id })}</Text>
      {props.invoiceNumber ? (
        <Text>
          {emailT(locale, "email.order.paid.invoice", {
            number: props.invoiceNumber,
          })}
        </Text>
      ) : null}
      {total ? (
        <Text>{emailT(locale, "email.order.paid.total", { total })}</Text>
      ) : null}
    </Layout>
  );
}

export function OrderCancelledEmail(props: OrderEmailProps) {
  const locale = props.locale ?? "en";
  const id = props.orderPublicId;
  return (
    <Layout
      locale={locale}
      preview={emailT(locale, "email.order.cancelled.preview", { id })}
      title={emailT(locale, "email.order.cancelled.title")}
    >
      <Text>{emailT(locale, "email.order.cancelled.body", { id })}</Text>
    </Layout>
  );
}

export function OrderShippedEmail(props: OrderEmailProps) {
  const locale = props.locale ?? "en";
  const id = props.orderPublicId;
  return (
    <Layout
      locale={locale}
      preview={emailT(locale, "email.order.shipped.preview", { id })}
      title={emailT(locale, "email.order.shipped.title")}
    >
      <Text>{emailT(locale, "email.order.shipped.body", { id })}</Text>
      {props.carrier ? (
        <Text>
          {emailT(locale, "email.order.shipped.carrier", {
            carrier: props.carrier,
          })}
        </Text>
      ) : null}
      {props.trackingNumber ? (
        <Text>
          {emailT(locale, "email.order.shipped.tracking", {
            tracking: props.trackingNumber,
          })}
        </Text>
      ) : null}
    </Layout>
  );
}

export type OrgInviteEmailProps = {
  locale?: EmailLocale;
  organizationName: string;
  role: string;
  acceptUrl: string;
  inviterEmail?: string;
};

export function OrgInviteEmail(props: OrgInviteEmailProps) {
  const locale = props.locale ?? "en";
  const org = props.organizationName;
  const body = props.inviterEmail
    ? emailT(locale, "email.invite.bodyWithInviter", {
        org,
        role: props.role,
        inviter: props.inviterEmail,
      })
    : emailT(locale, "email.invite.body", { org, role: props.role });
  return (
    <Layout
      locale={locale}
      preview={emailT(locale, "email.invite.preview", { org })}
      title={emailT(locale, "email.invite.title")}
    >
      <Text>{body}</Text>
      <Section>
        <Text>
          {emailT(locale, "email.invite.accept")}{" "}
          <a href={props.acceptUrl} style={{ color: "#111" }}>
            {props.acceptUrl}
          </a>
        </Text>
      </Section>
    </Layout>
  );
}
