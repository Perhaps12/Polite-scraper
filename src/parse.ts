import { readFile } from "fs/promises";
import * as cheerio from "cheerio";

export async function loadCachedPage(path: string): Promise<cheerio.CheerioAPI> {
  const html = await readFile(path, "utf-8");
  return cheerio.load(html);
}

export function extractBookLinks($: cheerio.CheerioAPI, pageUrl: string): string[] {
  const links: string[] = [];

  $("article.product_pod h3 a").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    const absoluteUrl = new URL(href, pageUrl).toString();
    links.push(absoluteUrl);
  });

  return links;
}

export function extractNextPageLink($: cheerio.CheerioAPI, pageUrl: string): string | null {
  const href = $("li.next a").attr("href");
  if (!href) return null;

  return new URL(href, pageUrl).toString();
}