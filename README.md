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

## Online ordering (preview)

The shop (`/shop/`), product pages, cart, checkout and confirmation are built and working in
**Preview Mode**: sample menu, no payments, shop pages hidden from search.

| Piece | Where |
| --- | --- |
| Menu, sizes, prices, lead days | `Products` table (`Price Confirmed` false = shows a "Sample" tag) |
| Delivery ZIPs and fees | `Delivery Zones` table |
| Preview Mode, closed days, blackout dates, pickup | `Shop Settings` table |
| Delivery / substitution / cancellation text | `Policies` table (`Draft` true = "Draft for review" tag) |
| Order rules (dates, ZIPs, fees, prices) | `shop/rules.mjs`, shared by the browser and the server |
| Cart, product options, checkout | `shop.js` |
| Stripe checkout | `netlify/functions/create-checkout.mjs` (re-prices every order on the server) |
| Save paid orders | `netlify/functions/stripe-webhook.mjs` (writes to the Airtable `Orders` table) |

To go live once Tiffany approves her menu:

1. Replace the sample prices, sizes, delivery fees and policies, and mark them confirmed.
2. In Netlify, set `STRIPE_SECRET_KEY` (from Tiffany's Stripe account) and `STRIPE_WEBHOOK_SECRET`.
3. In Stripe, add a webhook for `checkout.session.completed` pointing to
   `/.netlify/functions/stripe-webhook`.
4. Optional: set `AIRTABLE_PAT` and `AIRTABLE_BASE_ID` so paid orders land in the `Orders` table,
   and add an Airtable automation that emails or texts Tiffany each new order.
5. Turn off `Preview Mode` in `Shop Settings`. Shop pages are then indexed with product prices.

## Inquiry form

The form validates and shows a success message but does not send anywhere yet.
See `GO-LIVE` in `script.js` for connecting Netlify Forms or HoneyBook.
