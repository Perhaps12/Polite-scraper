import { writeFile, mkdir, readFile } from "fs/promises";
import { delay, fetchWithTimeout } from "./http.js";

const REQUEST_DELAY_MS = 500;

export async function downloadPage(url: string, cachePath: string): Promise<boolean> {
  // Check cache first
  try {
    await readFile(cachePath, "utf-8");
    console.log(`Using cached copy: ${cachePath}`);
    return true;
  } catch {
    // File doesn't exist — fall through to fetch it
  }
  
  const response = await fetchWithTimeout(url);

  if (response.status !== 200) {
    console.log(`Failed fetch — status ${response.status}. Not saving.`);
    return false;
  }

  const html = await response.text();

  await mkdir("cache", { recursive: true });
  await writeFile(cachePath, html, "utf-8");

  console.log(`Saved ${html.length} characters to ${cachePath}`);
  await delay(REQUEST_DELAY_MS);
  
  return true;
}