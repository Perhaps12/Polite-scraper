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

const MAX_PAGES = 3;
const START_URL = "https://books.toscrape.com/catalogue/page-1.html";

interface LinkWithSource {
  url: string;
  sourcePage: string;
}

async function main() {
  // --- Stage: collect book links from catalogue pages ---
  let currentUrl: string | null = START_URL;
  let pageNum = 1;
  const allLinks: LinkWithSource[] = [];

  while (currentUrl && pageNum <= MAX_PAGES) {
    const cachePath = `cache/catalogue-page-${pageNum}.html`;

    await downloadPage(currentUrl, cachePath);

    const $ = await loadCachedPage(cachePath);
    const links = extractBookLinks($, currentUrl);

    for (const url of links) {
      allLinks.push({ url, sourcePage: currentUrl });
    }

    currentUrl = extractNextPageLink($, currentUrl);
    pageNum++;
  }

  // Dedup by url, keeping the first sourcePage seen for each
  const seen = new Set<string>();
  const uniqueLinks = allLinks.filter((link) => {
    if (seen.has(link.url)) return false;
    seen.add(link.url);
    return true;
  });

  console.log(`Total links collected: ${allLinks.length}`);
  console.log(`Unique book links: ${uniqueLinks.length}`);

  // --- Stage: fetch + extract each book detail page ---
  const records: RawBookRecord[] = [];

  for (const { url: productUrl, sourcePage } of uniqueLinks) {
    const slug = slugFromProductUrl(productUrl);
    const cachePath = `cache/books/${slug}.html`;

    await downloadPage(productUrl, cachePath);

    const $ = await loadCachedPage(cachePath);
    const record = extractBookRecord($, productUrl, sourcePage);

    records.push(record);
  }

  // --- Checkpoint ---
  console.log("Sample record:");
  console.log(JSON.stringify(records[0], null, 2));
  console.log(`detail_pages=${records.length}`);

  // Save all records for the next stage
  await writeFile("cache/records.json", JSON.stringify(records, null, 2), "utf-8");
  console.log("Saved cache/records.json");
}

main();