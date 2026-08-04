/** Simple FR/EU VAT helper — rates by tax class (B2C FR default). */

const RATES: Record<string, number> = {
  standard: 0.2,
  reduced: 0.1,
  super_reduced: 0.055,
  zero: 0,
  exempt: 0,
};

export function vatRateForClass(taxClass: string): number {
  return RATES[taxClass] ?? RATES.standard!;
}

/** Prices are stored TTC (VAT included) for B2C shop UX. */
export function taxFromInclusive(totalInclusiveCents: number, taxClass: string): number {
  const rate = vatRateForClass(taxClass);
  if (rate <= 0) return 0;
  return Math.round(totalInclusiveCents - totalInclusiveCents / (1 + rate));
}

export function formatMoney(cents: number, currency = "eur"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}
