import { downloadCataloguePage } from "./catalogue.js";
import { loadCachedPage, extractBookLinks, extractNextPageLink} from "./parse.js";

// Part 0
async function checkRobots() {
  const url = "https://books.toscrape.com/robots.txt";

  try {
    const response = await fetch(url);

    if (response.status === 404) {
      console.log("no robots file found");
      return;
    }

    if (!response.ok) {
      console.log(`Request failed with status ${response.status}`);
      return;
    }

    const text = await response.text();
    console.log(text);
  } catch (error) {
    console.error("Request error:", error);
  }
}

// checkRobots();

//Part 1
// downloadFirstCataloguePage();

//Part 2
const MAX_PAGES = 3;
const START_URL = "https://books.toscrape.com/catalogue/page-1.html";


async function main() {
  let currentUrl: string | null = START_URL;
  let pageNum = 1;
  const allLinks: string[] = [];

  while (currentUrl && pageNum <= MAX_PAGES) {
    const cachePath = `cache/catalogue-page-${pageNum}.html`;

    await downloadCataloguePage(currentUrl, cachePath);

    const $ = await loadCachedPage(cachePath);
    const links = extractBookLinks($, currentUrl);
    allLinks.push(...links);

    currentUrl = extractNextPageLink($, currentUrl);
    pageNum++;

    
  }

  const uniqueLinks = [...new Set(allLinks)];
  console.log(`catalogue_pages = ${pageNum - 1}`);
  console.log(`discovered = ${allLinks.length}`);
  console.log(`unique urls = ${uniqueLinks.length}`);
}

main();