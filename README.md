# Books to Scrape — Catalogue Scraper

A small scraper that fetches, caches, parses, validates, and reports on
book data from [books.toscrape.com](https://books.toscrape.com), a
sandbox site built specifically for practising web scraping.

## Target classification

- **Site:** books.toscrape.com (part of the toscrape.com sandbox)
- **Why:** toscrape.com explicitly describes itself as a set of sites
  built for people to practise scraping on. That statement is the
  permission this project relies on — this is a purpose-built sandbox,
  not a live production service, and it contains no real user or
  commercial data.
- **How much:** the first 3 catalogue pages only (60 books)
- **Data collected:** title, price, availability, star rating,
  description, and provenance (source page + fetch timestamp) for each
  book
- **Why this is appropriate:** the site was created specifically to be
  scraped, and the request volume (3 catalogue pages + 60 detail pages,
  cached after the first run) is minimal and non-disruptive.

## Lane

| | |
|---|---|
| Language | Node.js 20+, TypeScript |
| HTTP request | Built-in `fetch`, wrapped with a timeout and retry |
| HTML parser | Cheerio |
| Schema validation | Zod |
| Output | Built-in file system → JSON |
| Runner | `tsx` (runs `.ts` directly, no build step needed) |

## Install & run

```bash
npm install
npm start
```
pages already saved in `cache/` are read
from disk instead of re-fetched, so repeated runs during development
don't hit the live site again.

## Output

| File | Contents |
|---|---|
| `output/books.json` | Valid, cleaned book records |
| `output/errors.json` | Records that failed schema validation, with a reason |
| `output/run-report.json` | Honest summary of what happened during the run |

### Record schema

```ts
{
  title: string;              // book title
  product_url: string;        // canonical URL, must start with https://
  price_text: string;         // raw price as shown on the page, e.g. "£51.77"
  price_gbp: number;          // parsed numeric price
  availability_text: string;  // raw availability text, e.g. "In stock (22 available)"
  rating_text: string;        // star rating as text, e.g. "Three"
  description: string | null; // book description, or null if the page has none
  source_page: string;        // the catalogue page this book link was found on
  fetched_at: string;         // ISO 8601 timestamp of when the detail page was fetched
}
```

`description` is explicitly nullable — if a book's page has no
description section, the field is stored as `null` rather than an
empty string or invented text.

## Politeness rules

- **User-agent:** every request identifies itself honestly, e.g.
  `FlyRankInternship-A9/1.0 (+https://github.com/perhaps12/scraper)`,
  so a site owner reviewing their logs can see who made the request.
- **Timeout:** every request gives up after 5 seconds rather than
  hanging indefinitely.
- **Delay:** real requests to the site are spaced at least 500ms apart.
  Cached pages need no delay, since they never leave the local machine.
- **Retry:** a request that fails with a timeout or a `5xx` server
  error is retried once after a short pause. A `404` or `403` is never
  retried — a missing page won't appear on a second try, and retrying
  a `403` just makes the scraper a pest rather than a polite guest.
- **Caching:** every fetched page is saved to `cache/` and read from
  there on subsequent runs, so development iteration costs the site
  nothing after the first fetch.
- **Resilience:** one failed page is logged and skipped — it does not
  stop the rest of the run. The run always finishes and always writes
  a report, even if some pages failed.

## Sample run report

```json
{
  "start_time": "2026-08-18T00:54:03.763Z",
  "duration_ms": 605,
  "pages_fetched": 0,
  "cache_hits": 63,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 1,
  "failures": [
    {
      "url": "https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html",
      "reason": "404 not found"
    }
  ]
}
```

This run includes one deliberately made-up book URL, added on purpose
to prove the failure-handling actually works: the run still finished,
the 60 real records still made it into `books.json`, and the failure
was logged in the report with an honest reason rather than silently
dropped or allowed to crash the run.

## Why no browser was needed

Every page this scraper reads — catalogue pages and book detail pages
— is server-rendered plain HTML. The data (title, price, availability,
rating, description) is already present in the HTML the server sends
back, with no client-side JavaScript required to reveal it. A headless
browser would only add startup cost, memory, and complexity here
without unlocking any data that a direct HTTP request doesn't already
have.

## Data quality note

Some book description fields on the source site contain duplicated
text baked into the raw HTML itself (observed on "A Light in the
Attic"). This is not a bug in the scraper — the extractor faithfully
captures what's present on the page. No text cleaning or
deduplication was applied, to avoid altering data that wasn't verified
as incorrect.

## Known limitation

`robots.txt` was requested once at the start of this project
(`https://books.toscrape.com/robots.txt`) and returned a 404 — no
robots file exists on this site. A missing file is not permission; it
is simply the absence of a stated rule. This scraper does not rely on
that absence as justification — permission comes entirely from
toscrape.com's own description of itself as a scraping sandbox, not
from anything robots.txt did or didn't say.

## Ethics note

This scraper only targets a site explicitly built and offered for
scraping practice. In general, this project follows these rules: use
an official API instead of scraping whenever one exists; never bypass
logins, paywalls, or explicit blocks to reach data; and collect only
the specific fields actually needed for the task, not everything a
page happens to expose.