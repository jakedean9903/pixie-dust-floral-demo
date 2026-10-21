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

  return {
    gallery,
    specials,
    testimonials: records(data, "Testimonials"),
    services: records(data, "Services"),
    faq: records(data, "FAQ"),
    cities,
    categories,
  };
}
