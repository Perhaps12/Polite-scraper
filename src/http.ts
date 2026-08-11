const USER_AGENT = "FlyRankInternship-A9/1.0 (+https://github.com/perhaps12/scraper)";
const TIMEOUT_MS = 5000;

export async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "User-Agent": USER_AGENT,
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}