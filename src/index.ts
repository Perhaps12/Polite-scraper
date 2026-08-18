import { downloadPage } from "./download.js";
import {
  loadCachedPage,
  extractBookLinks,
  extractNextPageLink,
  extractBookRecord,
  slugFromProductUrl,
} from "./parse.js";
import type { RawBookRecord } from "./types.js";
import { writeFile } from "fs/promises";
import { validateRecords } from "./validate.js";
import { writeOutput } from "./output.js";
import { dedupeByProductUrl } from "./transform.js";

const MAX_PAGES = 3;
const START_URL = "https://books.toscrape.com/catalogue/page-1.html";

interface LinkWithSource {
  url: string;
  sourcePage: string;
}

interface RunStats {
  start_time: string;
  pages_fetched: number;
  cache_hits: number;
  failed_pages: number;
  failures: { url: string; reason: string }[];
}

async function main() {
  const stats: RunStats = {
    start_time: new Date().toISOString(),
    pages_fetched: 0,
    cache_hits: 0,
    failed_pages: 0,
    failures: [],
  };

  // --- Stage: collect book links from catalogue pages ---
  let currentUrl: string | null = START_URL;
  let pageNum = 1;
  const allLinks: LinkWithSource[] = [];

  while (currentUrl && pageNum <= MAX_PAGES) {
    const cachePath = `cache/catalogue-page-${pageNum}.html`;

    const outcome = await downloadPage(currentUrl, cachePath);

    if (outcome.status === "cached") stats.cache_hits++;
    if (outcome.status === "fetched") stats.pages_fetched++;

    if (outcome.status === "failed") {
      stats.failed_pages++;
      stats.failures.push({ url: currentUrl, reason: outcome.reason });
      console.log(`Skipping catalogue page ${pageNum}: ${outcome.reason}`);
      break; // can't find "next" link without this page — stop pagination here
    }

    const $ = await loadCachedPage(cachePath);
    const links = extractBookLinks($, currentUrl);

    for (const url of links) {
      allLinks.push({ url, sourcePage: currentUrl });
    }

    currentUrl = extractNextPageLink($, currentUrl);
    pageNum++;
  }

  const seen = new Set<string>();
  const uniqueLinks = allLinks.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });

  // TO TEST ERROR HANDLING
  // uniqueLinks.push({
  //   url: "https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html",
  //   sourcePage: START_URL,
  // });

  console.log(`Total links collected: ${allLinks.length}`);
  console.log(`Unique book links: ${uniqueLinks.length}`);

  // --- Stage: fetch + extract each book detail page ---
  const records: RawBookRecord[] = [];

  for (const { url: productUrl, sourcePage } of uniqueLinks) {
    const slug = slugFromProductUrl(productUrl);
    const cachePath = `cache/books/${slug}.html`;

    const outcome = await downloadPage(productUrl, cachePath);

    if (outcome.status === "cached") stats.cache_hits++;
    if (outcome.status === "fetched") stats.pages_fetched++;

    if (outcome.status === "failed") {
      stats.failed_pages++;
      stats.failures.push({ url: productUrl, reason: outcome.reason });
      console.log(`Skipping book page (${productUrl}): ${outcome.reason}`);
      continue; // one bad page must not kill the run
    }

    const $ = await loadCachedPage(cachePath);
    const record = extractBookRecord($, productUrl, sourcePage);

    records.push(record);
  }

  console.log(`detail_pages=${records.length}`);

  await writeFile("cache/records.json", JSON.stringify(records, null, 2), "utf-8");

  const { valid, errors } = validateRecords(records);

  console.log(`Valid records: ${valid.length}`);
  console.log(`Errors: ${errors.length}`);

  const dedupedValid = dedupeByProductUrl(valid);

  await writeOutput(dedupedValid, errors);

  // --- Run report ---
  const durationMs = Date.now() - new Date(stats.start_time).getTime();

  const report = {
    start_time: stats.start_time,
    duration_ms: durationMs,
    pages_fetched: stats.pages_fetched,
    cache_hits: stats.cache_hits,
    valid_records: dedupedValid.length,
    invalid_records: errors.length,
    failed_pages: stats.failed_pages,
    failures: stats.failures,
  };

  await writeFile("output/run-report.json", JSON.stringify(report, null, 2), "utf-8");
  console.log(`Wrote output/run-report.json — failed_pages=${stats.failed_pages}`);
}

main();