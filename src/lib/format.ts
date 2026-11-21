const aud = new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" });

/** Money as shown everywhere in the portals: "$5,431.63". */
export function formatAUD(amount: number): string {
  return aud.format(amount);
}
