import { formatMoney } from "./tax.js";

export type AccountingRow = {
  date: string;
  invoiceNumber: string;
  account: string;
  label: string;
  debitCents: number;
  creditCents: number;
  currency: string;
};

/** Simple journal lines for a paid order (not full FEC). */
export function journalLinesForPaidOrder(input: {
  issuedAt: Date;
  invoiceNumber: string;
  currency: string;
  subtotalCents: number;
  discountCents?: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}): AccountingRow[] {
  const date = input.issuedAt.toISOString().slice(0, 10);
  const discount = input.discountCents ?? 0;
  const goodsHt = Math.max(0, input.subtotalCents - input.taxCents);
  const rows: AccountingRow[] = [
    {
      date,
      invoiceNumber: input.invoiceNumber,
      account: "411000",
      label: "Client",
      debitCents: input.totalCents,
      creditCents: 0,
      currency: input.currency,
    },
    {
      date,
      invoiceNumber: input.invoiceNumber,
      account: "707000",
      label: "Ventes de marchandises HT",
      debitCents: 0,
      creditCents: goodsHt,
      currency: input.currency,
    },
    {
      date,
      invoiceNumber: input.invoiceNumber,
      account: "445710",
      label: "TVA collectée",
      debitCents: 0,
      creditCents: input.taxCents,
      currency: input.currency,
    },
  ];
  if (discount > 0) {
    rows.push({
      date,
      invoiceNumber: input.invoiceNumber,
      account: "709000",
      label: "Remises accordées",
      debitCents: discount,
      creditCents: 0,
      currency: input.currency,
    });
  }
  if (input.shippingCents > 0) {
    rows.push({
      date,
      invoiceNumber: input.invoiceNumber,
      account: "708500",
      label: "Ports et frais accessoires",
      debitCents: 0,
      creditCents: input.shippingCents,
      currency: input.currency,
    });
  }
  return rows;
}

/** Reverse journal for a fiscal credit note (no Stripe movement). */
export function journalLinesForCreditNote(input: {
  issuedAt: Date;
  invoiceNumber: string;
  currency: string;
  subtotalCents: number;
  discountCents?: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
}): AccountingRow[] {
  return journalLinesForPaidOrder(input).map((r) => ({
    ...r,
    debitCents: r.creditCents,
    creditCents: r.debitCents,
    label: `Avoir — ${r.label}`,
  }));
}

export function accountingRowsToCsv(rows: AccountingRow[]): string {
  const header = "date;invoice;account;label;debit;credit;currency";
  const body = rows.map((r) =>
    [
      r.date,
      r.invoiceNumber,
      r.account,
      `"${r.label.replaceAll('"', '""')}"`,
      (r.debitCents / 100).toFixed(2),
      (r.creditCents / 100).toFixed(2),
      r.currency.toUpperCase(),
    ].join(";"),
  );
  return [header, ...body].join("\n") + "\n";
}

export { formatMoney };
