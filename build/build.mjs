// Builds the static site into dist/: one pre-rendered HTML page per route, plus
// sitemap.xml, robots.txt, llms.txt and llms-full.txt. Run with `node build/build.mjs`.
// Netlify runs this on every push (see netlify.toml).
import { mkdir, rm, writeFile, cp } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadContent } from "./content.mjs";
import { buildPages } from "./pages.mjs";
import { layout } from "./components.mjs";
import { sitemapXml, robotsTxt, llmsTxt, llmsFullTxt } from "./seo.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "dist");

// Netlify sets URL to the site's primary address at build time
const site = {
  url: (process.env.URL || "https://pixiedustflowers.netlify.app").replace(/\/$/, ""),
  builtAt: new Date().toISOString().slice(0, 10),
  version: Date.now().toString(36),
};

const content = await loadContent(root);
const pages = buildPages(content, site);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const page of pages) {
  const file = page.path.endsWith(".html")
    ? path.join(out, page.path)
    : path.join(out, page.path, "index.html");
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, layout({ site, page, cities: content.cities }));
}

await writeFile(path.join(out, "sitemap.xml"), sitemapXml(site, pages));
await writeFile(path.join(out, "robots.txt"), robotsTxt(site));
await writeFile(path.join(out, "llms.txt"), llmsTxt(site, content, pages));
await writeFile(path.join(out, "llms-full.txt"), llmsFullTxt(site, content));

for (const asset of ["styles.css", "script.js", "images"]) {
  await cp(path.join(root, asset), path.join(out, asset), { recursive: true });
}

console.log(`Built ${pages.length} pages for ${site.url} into dist/`);
