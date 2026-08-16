import { readFile } from "fs/promises";
import * as cheerio from "cheerio";
import type { RawBookRecord } from "./types.js";

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

export function extractBookRecord(
  $: cheerio.CheerioAPI,
  productUrl: string,
  sourcePage: string
): RawBookRecord {
  const productArea = $("div.product_main");

  const title = productArea.find("h1").text().trim();
  const price_text = productArea.find("p.price_color").text().trim();
  const availability_text = productArea.find("p.availability").text().trim().replace(/\s+/g, " ");

  const ratingClasses = productArea.find("p.star-rating").attr("class") ?? "";
  const rating_text = ratingClasses.replace("star-rating", "").trim();

  const descriptionEl = $("#product_description").next("p");
  const description = descriptionEl.length > 0 ? descriptionEl.text().trim() : null;

  return {
    title,
    product_url: productUrl,
    price_text,
    availability_text,
    rating_text,
    description,
    source_page: sourcePage,
    fetched_at: new Date().toISOString(),
  };
}

export function slugFromProductUrl(productUrl: string): string {
  const parts = new URL(productUrl).pathname.split("/").filter(Boolean);
  // parts: ["catalogue", "a-light-in-the-attic_1000", "index.html"]
  return parts[parts.length - 2] ?? "unknown";
}