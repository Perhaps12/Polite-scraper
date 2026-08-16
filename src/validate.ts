import { CleanBookRecordSchema, type CleanBookRecord } from "./schema.js";
import { parsePrice } from "./transform.js";
import type { RawBookRecord } from "./types.js";

export interface ValidationError {
  product_url: string;
  reason: string;
}

export interface ValidationResult {
  valid: CleanBookRecord[];
  errors: ValidationError[];
}

export function validateRecords(records: RawBookRecord[]): ValidationResult {
  const valid: CleanBookRecord[] = [];
  const errors: ValidationError[] = [];

  for (const raw of records) {
    const price_gbp = parsePrice(raw.price_text);

    const candidate = {
      ...raw,
      price_gbp: price_gbp ?? NaN, // let Zod catch this as invalid rather than silently passing
    };

    const result = CleanBookRecordSchema.safeParse(candidate);

    if (result.success) {
      valid.push(result.data);
    } else {
      const reason = result.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ");

      errors.push({
        product_url: raw.product_url,
        reason,
      });
    }
  }

  return { valid, errors };
}