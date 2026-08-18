import { writeFile, mkdir, readFile } from "fs/promises";
import { dirname } from "path";
import { fetchWithTimeout, delay } from "./http.js";

const REQUEST_DELAY_MS = 500;
const RETRY_DELAY_MS = 1000;

export type DownloadOutcome =
  | { status: "cached" }
  | { status: "fetched" }
  | { status: "failed"; reason: string };

export async function downloadPage(url: string, cachePath: string): Promise<DownloadOutcome> {
  try {
    await readFile(cachePath, "utf-8");
    console.log(`Using cached copy: ${cachePath}`);
    return { status: "cached" };
  } catch {
    // not cached yet — fall through
  }

  const attempt = async (): Promise<Response | null> => {
    try {
      return await fetchWithTimeout(url);
    } catch {
      return null; // timeout / network error
    }
  };

  let response = await attempt();

  const isRetryable = (res: Response | null) =>
    res === null || res.status >= 500;

  if (isRetryable(response)) {
    console.log(`Retrying ${url} after failure...`);
    await delay(RETRY_DELAY_MS);
    response = await attempt();
  }

  if (response === null) {
    return { status: "failed", reason: "timeout or network error (after retry)" };
  }

  if (response.status === 404) {
    return { status: "failed", reason: "404 not found" };
  }

  if (response.status === 403) {
    return { status: "failed", reason: "403 forbidden" };
  }

  if (!response.ok) {
    return { status: "failed", reason: `unexpected status ${response.status}` };
  }

  const html = await response.text();

  await mkdir(dirname(cachePath), { recursive: true });
  await writeFile(cachePath, html, "utf-8");

  console.log(`Saved ${html.length} characters to ${cachePath}`);

  await delay(REQUEST_DELAY_MS);

  return { status: "fetched" };
}