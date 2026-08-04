import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { formatMoney, taxFromInclusive, vatRateForClass } from "./tax.js";

export type InvoiceLine = {
  name: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
  taxClass: string;
};

export type InvoicePdfInput = {
  number: string;
  issuedAt: Date;
  currency: string;
  email: string;
  /** Sales invoice vs credit note (avoir) */
  documentKind?: "invoice" | "credit_note";
  merchant: {
    legalName: string;
    siret?: string | null;
    vatNumber?: string | null;
    addressJson: Record<string, unknown>;
    rcs?: string | null;
    capital?: string | null;
  };
  customerAddress: Record<string, unknown>;
  lines: InvoiceLine[];
  subtotalCents: number;
  discountCents?: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
};

function addrLines(a: Record<string, unknown>): string[] {
  const out: string[] = [];
  if (a.name) out.push(String(a.name));
  if (a.line1) out.push(String(a.line1));
  if (a.line2) out.push(String(a.line2));
  const city = [a.postalCode, a.city].filter(Boolean).join(" ");
  if (city) out.push(city);
  if (a.country) out.push(String(a.country));
  return out;
}

export function buildInvoiceTotalsJson(input: {
  lines: InvoiceLine[];
  subtotalCents: number;
  discountCents?: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
}) {
  const lineBreaks = input.lines.map((l) => {
    const lineTotal = l.unitPriceCents * l.quantity;
    const tax = taxFromInclusive(lineTotal, l.taxClass);
    return {
      sku: l.sku,
      name: l.name,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
      lineTotalCents: lineTotal,
      taxClass: l.taxClass,
      vatRate: vatRateForClass(l.taxClass),
      taxCents: tax,
      htCents: lineTotal - tax,
    };
  });
  return {
    currency: input.currency,
    subtotalCents: input.subtotalCents,
    discountCents: input.discountCents ?? 0,
    shippingCents: input.shippingCents,
    taxCents: input.taxCents,
    totalCents: input.totalCents,
    lines: lineBreaks,
  };
}

export async function buildInvoicePdf(input: InvoicePdfInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const { height } = page.getSize();
  let y = height - 50;
  const left = 50;

  const draw = (text: string, size = 10, useBold = false) => {
    page.drawText(text, {
      x: left,
      y,
      size,
      font: useBold ? bold : font,
      color: rgb(0.1, 0.1, 0.12),
    });
    y -= size + 6;
  };

  draw(input.documentKind === "credit_note" ? "AVOIR" : "FACTURE", 18, true);
  draw(`N° ${input.number}`, 12, true);
  draw(`Date: ${input.issuedAt.toISOString().slice(0, 10)}`);
  y -= 8;

  draw(input.merchant.legalName, 11, true);
  for (const line of addrLines(input.merchant.addressJson)) draw(line, 9);
  if (input.merchant.siret) draw(`SIRET: ${input.merchant.siret}`, 9);
  if (input.merchant.vatNumber) draw(`TVA: ${input.merchant.vatNumber}`, 9);
  if (input.merchant.rcs) draw(input.merchant.rcs, 9);
  if (input.merchant.capital) draw(`Capital: ${input.merchant.capital}`, 9);
  y -= 10;

  draw("Client", 11, true);
  draw(input.email, 9);
  for (const line of addrLines(input.customerAddress)) draw(line, 9);
  y -= 12;

  draw("Désignation                          Qté    Prix TTC    TVA", 9, true);
  y -= 2;
  for (const l of input.lines) {
    const lineTotal = l.unitPriceCents * l.quantity;
    const tax = taxFromInclusive(lineTotal, l.taxClass);
    const label = `${l.name} (${l.sku})`.slice(0, 36).padEnd(36);
    draw(
      `${label}  ${String(l.quantity).padStart(3)}  ${formatMoney(lineTotal, input.currency).padStart(10)}  ${formatMoney(tax, input.currency)}`,
      9,
    );
  }
  y -= 10;
  draw(`Sous-total TTC: ${formatMoney(input.subtotalCents, input.currency)}`, 10);
  if ((input.discountCents ?? 0) > 0) {
    draw(`Remise: -${formatMoney(input.discountCents ?? 0, input.currency)}`, 10);
  }
  draw(`Livraison: ${formatMoney(input.shippingCents, input.currency)}`, 10);
  draw(`dont TVA: ${formatMoney(input.taxCents, input.currency)}`, 10, true);
  draw(`Total TTC: ${formatMoney(input.totalCents, input.currency)}`, 12, true);
  y -= 16;
  draw("Document généré par mestryx-platform (paiement hors Stripe).", 8);

  return doc.save();
}

export function buildInvoiceHtml(input: InvoicePdfInput): string {
  const lines = input.lines
    .map((l) => {
      const lineTotal = l.unitPriceCents * l.quantity;
      const tax = taxFromInclusive(lineTotal, l.taxClass);
      return `<tr>
        <td>${escape(l.name)} <code>${escape(l.sku)}</code></td>
        <td>${l.quantity}</td>
        <td>${escape(formatMoney(lineTotal, input.currency))}</td>
        <td>${escape(formatMoney(tax, input.currency))} (${Math.round(vatRateForClass(l.taxClass) * 100)}%)</td>
      </tr>`;
    })
    .join("");

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escape(input.documentKind === "credit_note" ? "Avoir" : "Facture")} ${escape(input.number)}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 2rem auto; color: #111; }
    table { width: 100%; border-collapse: collapse; margin-top: 1.5rem; }
    th, td { text-align: left; padding: 0.5rem; border-bottom: 1px solid #ddd; }
    h1 { margin-bottom: 0.25rem; }
  </style>
</head>
<body>
  <h1>${escape(input.documentKind === "credit_note" ? "Avoir" : "Facture")} ${escape(input.number)}</h1>
  <p>Date: ${input.issuedAt.toISOString().slice(0, 10)}</p>
  <section>
    <h2>${escape(input.merchant.legalName)}</h2>
    <p>${addrLines(input.merchant.addressJson).map(escape).join("<br/>")}</p>
    ${input.merchant.siret ? `<p>SIRET: ${escape(input.merchant.siret)}</p>` : ""}
    ${input.merchant.vatNumber ? `<p>TVA: ${escape(input.merchant.vatNumber)}</p>` : ""}
  </section>
  <section>
    <h2>Client</h2>
    <p>${escape(input.email)}<br/>${addrLines(input.customerAddress).map(escape).join("<br/>")}</p>
  </section>
  <table>
    <thead><tr><th>Produit</th><th>Qté</th><th>TTC</th><th>TVA</th></tr></thead>
    <tbody>${lines}</tbody>
  </table>
  <p>Sous-total: ${escape(formatMoney(input.subtotalCents, input.currency))}<br/>
  ${(input.discountCents ?? 0) > 0 ? `Remise: -${escape(formatMoney(input.discountCents ?? 0, input.currency))}<br/>` : ""}
  Livraison: ${escape(formatMoney(input.shippingCents, input.currency))}<br/>
  <strong>dont TVA: ${escape(formatMoney(input.taxCents, input.currency))}</strong><br/>
  <strong>Total TTC: ${escape(formatMoney(input.totalCents, input.currency))}</strong></p>
</body>
</html>`;
}

function escape(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
