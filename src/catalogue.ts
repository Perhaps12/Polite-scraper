import { writeFile, mkdir } from "fs/promises";
import { fetchWithTimeout } from "./http.js";

const CATALOGUE_URL = "https://books.toscrape.com/catalogue/page-1.html";
const CACHE_PATH = "cache/catalogue-page-1.html";

export async function downloadFirstCataloguePage(): Promise<void> {
  const response = await fetchWithTimeout(CATALOGUE_URL);

  if (response.status !== 200) {
    console.log(`Failed fetch — status ${response.status}. Not saving.`);
    return;
  }

  const html = await response.text();

  await mkdir("cache", { recursive: true });
  await writeFile(CACHE_PATH, html, "utf-8");

  console.log(`Saved ${html.length} characters to ${CACHE_PATH}`);
}