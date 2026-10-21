# Pixie Dust Floral Design: concept site

Concept website for Pixie Dust Floral Design (Kernersville, NC) by Dupuis Designs.
Live at https://pixiedustflowers.netlify.app/ and deployed by Netlify on every push to `main`.

## How it is built

Every page is pre-rendered to static HTML at deploy time, so Google and AI crawlers
(ChatGPT, Claude, Perplexity) read full content without running JavaScript.

| Path | What it is |
| --- | --- |
| `data/site-content.json` | All gallery, services, specials, testimonials, city and FAQ content, in Airtable record format |
| `build/build.mjs` | Builds `dist/`: every page plus `sitemap.xml`, `robots.txt`, `llms.txt`, `llms-full.txt` |
| `build/pages.mjs` | Page templates (home, weddings, gallery, seasonal, everyday, reviews, about, FAQ, book, city pages) |
| `build/components.mjs` | Shared header, footer, cards, gallery, booking form |
| `build/seo.mjs` | Structured data (JSON-LD), sitemap, robots and llms files |
| `build/business.mjs` | Phone, address, hours, rating: change them here only |
| `styles.css`, `script.js`, `images/` | Copied into `dist/` as-is |

Build locally with `node build/build.mjs`, then serve `dist/`.

## Adding a city page

Add a record to the `Cities` table in `data/site-content.json` (name, slug, intro, delivery note,
venues, FAQ). The page, footer link, sitemap entry and llms.txt entry are created automatically.
Tag gallery photos and testimonials with that `City` to feature local work on the page.

## Airtable (not connected in this demo)

The data file uses the same shape as the Airtable REST API, so the base can mirror it table for table.
To go live, `loadContent()` in `build/content.mjs` fetches the tables from Airtable using
`AIRTABLE_PAT` and `AIRTABLE_BASE_ID` from Netlify environment variables, and an Airtable automation
calls a Netlify build hook so the site rebuilds whenever a record changes.

## Inquiry form

The form validates and shows a success message but does not send anywhere yet.
See `GO-LIVE` in `script.js` for connecting Netlify Forms or HoneyBook.
