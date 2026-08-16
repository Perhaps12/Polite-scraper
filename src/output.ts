import { writeFile, mkdir } from "fs/promises";
import type { CleanBookRecord } from "./schema.js";
import type { ValidationError } from "./validate.js";

export async function writeOutput(
  validRecords: CleanBookRecord[],
  errors: ValidationError[]
): Promise<void> {
  await mkdir("output", { recursive: true });

  await writeFile(
    "output/books.json",
    JSON.stringify(validRecords, null, 2),
    "utf-8"
  );

  await writeFile(
    "output/errors.json",
    JSON.stringify(errors, null, 2),
    "utf-8"
  );

  console.log(`Wrote ${validRecords.length} records to output/books.json`);
  console.log(`Wrote ${errors.length} errors to output/errors.json`);
}