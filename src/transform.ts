import type { RawBookRecord } from "./types.js";

export function parsePrice(priceText: string): number | null {
  const match = priceText.match(/[\d.]+/);
  if (!match) return null;

  const value = parseFloat(match[0]);
  return isNaN(value) ? null : value;
}

export function dedupeByProductUrl<T extends { product_url: string }>(records: T[]): T[] {
  const seen = new Set<string>();
  return records.filter((r) => {
    if (seen.has(r.product_url)) return false;
    seen.add(r.product_url);
    return true;
  });
}