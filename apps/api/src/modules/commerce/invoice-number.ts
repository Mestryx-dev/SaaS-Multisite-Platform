import { and, desc, eq, like, sql } from "drizzle-orm";
import { invoice, merchantLegalProfile } from "../../db/schema.js";

/** Minimal query surface shared by Db and transaction client. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Queryable = any;

/** Next invoice number: PREFIX-YYYY-#### (zero-padded sequence per org+year). */
export async function nextInvoiceNumber(
  db: Queryable,
  organizationId: string,
  prefix: string,
  now = new Date(),
): Promise<string> {
  const year = String(now.getUTCFullYear());
  const pattern = `${prefix}-${year}-%`;
  const [latest] = await db
    .select({ number: invoice.number })
    .from(invoice)
    .where(and(eq(invoice.organizationId, organizationId), like(invoice.number, pattern)))
    .orderBy(desc(invoice.number))
    .limit(1);

  let seq = 1;
  if (latest?.number) {
    const parts = latest.number.split("-");
    const last = Number.parseInt(parts[parts.length - 1] ?? "0", 10);
    if (Number.isFinite(last)) seq = last + 1;
  }
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

export async function getOrDefaultLegalProfile(db: Queryable, organizationId: string) {
  const [row] = await db
    .select()
    .from(merchantLegalProfile)
    .where(eq(merchantLegalProfile.organizationId, organizationId))
    .limit(1);
  if (row) return row;
  return {
    id: "",
    organizationId,
    legalName: "Merchant",
    siret: null as string | null,
    vatNumber: null as string | null,
    addressJson: {} as Record<string, unknown>,
    invoicePrefix: "INV",
    creditNotePrefix: "AV",
    rcs: null as string | null,
    capital: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export async function allocateInvoiceNumberInTx(
  db: Queryable,
  organizationId: string,
  prefix: string,
): Promise<string> {
  await db.execute(sql`select pg_advisory_xact_lock(hashtext(${organizationId}))`);
  return nextInvoiceNumber(db, organizationId, prefix);
}
