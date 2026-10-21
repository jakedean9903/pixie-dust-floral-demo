// Loads site content and normalizes each table into plain, sorted record lists.
import { readFile } from "node:fs/promises";
import path from "node:path";

// AIRTABLE: this is the only place content enters the build. To go live, replace the file
// read below with a fetch of each table from the Airtable REST API, e.g.
//   https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Gallery?filterByFormula={Show on Website}=1
// using AIRTABLE_PAT / AIRTABLE_BASE_ID from Netlify environment variables (the same pattern
// as the Peggs-Gunshop functions), then point an Airtable automation at a Netlify build hook
// so the site rebuilds when Tiffany edits a record. The response shape is identical to
// data/site-content.json, so nothing below this function changes.
// This demo deliberately reads the local file only: no API key, no live connection.
async function readTables(root) {
  const raw = await readFile(path.join(root, "data", "site-content.json"), "utf8");
  return JSON.parse(raw);
}

function records(data, table) {
  const list = (data[table] && data[table].records) || [];
  return list
    .map((r) => ({ id: r.id, ...r.fields }))
    .filter((r) => r["Show on Website"] !== false)
    .sort((a, b) => (a["Sort Order"] || 0) - (b["Sort Order"] || 0));
}

export function slugify(text) {
  return String(text).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// "Name | description" lines -> [{ name, description }]
function parseVenues(text) {
  return String(text || "")
    .split("\n")
    .map((line) => line.split("|").map((s) => s.trim()))
    .filter(([name]) => name)
    .map(([name, description]) => ({ name, description: description || "" }));
}

// "Q: ...\nA: ..." pairs -> [{ question, answer }]
function parseFaq(text) {
  const out = [];
  String(text || "").split("\n").forEach((line) => {
    if (line.startsWith("Q:")) out.push({ question: line.slice(2).trim(), answer: "" });
    else if (line.startsWith("A:") && out.length) out[out.length - 1].answer = line.slice(2).trim();
  });
  return out.filter((f) => f.question && f.answer);
}

export async function loadContent(root) {
  const data = await readTables(root);

  const gallery = records(data, "Gallery");
  const specials = records(data, "Specials");
  const cities = records(data, "Cities").map((c) => ({
    ...c,
    venues: parseVenues(c["Popular Venues"]),
    faq: parseFaq(c.FAQ),
    path: `/wedding-florist/${c.Slug}/`,
  }));

  // Category order comes from the schema, plus any new category used in a record
  const categories = [...((data._schema && data._schema.categories) || [])];
  [...specials, ...gallery].forEach((r) =>
    (r.Categories || []).forEach((c) => { if (!categories.includes(c)) categories.push(c); })
  );

  const products = records(data, "Products").map((p) => ({
    ...p,
    path: `/shop/${p.Slug}/`,
    sizes: String(p.Sizes || "").split("\n").map((l) => l.split("|").map((s) => s.trim()))
      .filter(([name, price]) => name && price).map(([name, price]) => ({ name, price: Number(price) })),
  }));

  return {
    gallery,
    specials,
    testimonials: records(data, "Testimonials"),
    services: records(data, "Services"),
    faq: records(data, "FAQ"),
    cities,
    categories,
    products,
    zones: records(data, "Delivery Zones"),
    shopSettings: records(data, "Shop Settings")[0] || {},
    policies: records(data, "Policies"),
  };
}

// The public catalog the cart and the checkout function both price orders from.
// Written to dist/data/shop-catalog.json at build time.
export function shopCatalog(content) {
  const s = content.shopSettings;
  const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return {
    previewMode: s["Preview Mode"] !== false,
    leadDays: s["Lead Days"] || 0,
    closedWeekdays: (s["Closed Weekdays"] || []).map((d) => weekdays.indexOf(d)).filter((i) => i >= 0),
    blackoutDates: String(s["Blackout Dates"] || "").split("\n").map((l) => l.trim()).filter(Boolean),
    pickupEnabled: !!s["Pickup Enabled"],
    pickupAddress: s["Pickup Address"] || "",
    cardMessageLimit: s["Card Message Limit"] || 200,
    collectSalesTax: !!s["Collect Sales Tax"],
    products: content.products.map((p) => ({
      id: p.id, slug: p.Slug, name: p.Name, category: p["Shop Category"], path: p.path,
      image: p.Photo && p.Photo[0] ? "/" + p.Photo[0].url : "",
      sizes: p.sizes, fulfillment: p.Fulfillment || [], leadDays: p["Lead Days"] || 0,
      seasonStart: p["Season Start"] || null, seasonEnd: p["Season End"] || null,
      priceConfirmed: !!p["Price Confirmed"],
    })),
    zones: content.zones.map((z) => ({
      id: z.id, name: z.Name, fee: Number(z.Fee) || 0, feeConfirmed: !!z["Fee Confirmed"],
      zips: String(z["ZIP Codes"] || "").split(",").map((s) => s.trim()).filter(Boolean),
    })),
  };
}
