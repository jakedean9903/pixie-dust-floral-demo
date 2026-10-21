// Structured data (schema.org JSON-LD), sitemap.xml, robots.txt and llms.txt.
import { business, fullAddress } from "./business.mjs";

export function floristSchema(site, cities) {
  return {
    "@context": "https://schema.org",
    "@type": "Florist",
    "@id": `${site.url}/#business`,
    name: business.name,
    url: `${site.url}/`,
    image: `${site.url}/images/hero-bride-bouquet.jpg`,
    telephone: business.phoneE164,
    slogan: business.tagline,
    founder: { "@type": "Person", name: business.owner },
    address: {
      "@type": "PostalAddress",
      streetAddress: business.street,
      addressLocality: business.city,
      addressRegion: business.region,
      postalCode: business.postalCode,
      addressCountry: "US",
    },
    geo: { "@type": "GeoCoordinates", latitude: business.geo.lat, longitude: business.geo.lng },
    openingHoursSpecification: business.hours.filter((h) => h.days.length).map((h) => ({
      "@type": "OpeningHoursSpecification", dayOfWeek: h.days, opens: h.opens, closes: h.closes,
    })),
    // Only cities with confirmed delivery are claimed as served
    areaServed: cities.filter((c) => c["Delivery Confirmed"]).map((c) => ({ "@type": "City", name: `${c.Name}, NC` })),
    knowsAbout: business.specialties,
    aggregateRating: { "@type": "AggregateRating", ratingValue: business.rating.value, reviewCount: business.rating.count, bestRating: "5" },
    sameAs: [business.instagram],
  };
}

export function breadcrumbSchema(site, crumbs) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.label, item: site.url + c.href })),
  };
}

export function faqSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.question || f.Question,
      acceptedAnswer: { "@type": "Answer", text: f.answer || f.Answer },
    })),
  };
}

export function specialOfferSchema(site, special) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: special.Name,
    description: special.Description,
    image: `${site.url}/${special.Photo[0].url}`,
    brand: { "@type": "Brand", name: business.name },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: special["Price From"],
      priceSpecification: { "@type": "PriceSpecification", minPrice: special["Price From"], priceCurrency: "USD" },
      availability: "https://schema.org/PreOrder",
      seller: { "@id": `${site.url}/#business` },
    },
  };
}

export function serviceSchema(site, { name, description, path, city }) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Wedding florist",
    name,
    description,
    url: site.url + path,
    provider: { "@id": `${site.url}/#business` },
    ...(city ? { areaServed: { "@type": "City", name: `${city}, NC` } } : {}),
  };
}

// ---- Crawler files ----------------------------------------------------------
export function sitemapXml(site, pages) {
  const urls = pages.filter((p) => !p.noindex).map((p) =>
    `  <url>\n    <loc>${site.url}${p.path}</loc>\n    <lastmod>${site.builtAt}</lastmod>\n    <priority>${p.priority ?? 0.7}</priority>\n  </url>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`;
}

export function robotsTxt(site) {
  // Search and AI assistants are welcome: the point is for them to recommend Tiffany.
  const bots = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Google-Extended", "Applebot-Extended", "Bingbot"];
  return [
    "User-agent: *",
    "Allow: /",
    "",
    ...bots.flatMap((b) => [`User-agent: ${b}`, "Allow: /", ""]),
    `Sitemap: ${site.url}/sitemap.xml`,
    "",
  ].join("\n");
}

const hoursLine = () => business.hours.map((h) => `${h.label.replace("–", "-")}: ${h.value.replace(/–/g, "-")}`).join("; ");

export function llmsTxt(site, content, pages) {
  const { specials, cities } = content;
  const pumpkins = specials[0];
  const pageLine = (p) => `- [${p.llmsLabel || p.heading}](${site.url}${p.path}): ${p.description}`;
  const main = pages.filter((p) => p.llms === "main");
  const cityPages = pages.filter((p) => p.llms === "city");
  return `# ${business.name}

> Wedding and event florist in Kernersville, North Carolina. Owner and designer ${business.owner} creates bridal bouquets, ceremony and reception florals, centerpieces and installations, plus everyday and sympathy arrangements, from her home-based studio. Rated ${business.rating.value} stars from ${business.rating.count} Google reviews.

Key facts:

- Business: ${business.name} (women-owned), owner ${business.owner}
- In her words: "${business.tagline}"
- Studio: ${fullAddress} (home-based studio)
- Phone: ${business.phone}
- Hours: ${hoursLine()}
- Instagram: ${business.instagramHandle} (${business.instagram})
- Specialties: ${business.specialties.join(", ")}
- Signature item: ${pumpkins ? `${pumpkins.Name.toLowerCase()}, from $${pumpkins["Price From"]}, available in the ${pumpkins.Season.toLowerCase()} (${pumpkins.Availability.toLowerCase()})` : ""}
- Delivers to: ${cities.filter((c) => c["Delivery Confirmed"]).map((c) => c.Name).join(" and ")} venues; other Triad venues confirmed on inquiry
- How to book: wedding inquiry form at ${site.url}/book/ (asks for date, venue, guest count and floral budget) or call ${business.phone}

## Pages

${main.map(pageLine).join("\n")}

## Service area

${cityPages.map(pageLine).join("\n")}

## Optional

- [Full site content in plain text](${site.url}/llms-full.txt): services, seasonal specials, FAQ, reviews and service-area details in one file
`;
}

export function llmsFullTxt(site, content) {
  const { services, specials, faq, testimonials, cities } = content;
  return `# ${business.name}: full content

Source: ${site.url}/
Address: ${fullAddress}
Phone: ${business.phone}
Hours: ${hoursLine()}
Google rating: ${business.rating.value} stars from ${business.rating.count} reviews (${business.rating.fiveStar} five-star)

## Services

${services.map((s) => `### ${s.Name}\n\n${s.Description}\n\nMore: ${site.url}${s.Page}`).join("\n\n")}

## Seasonal specials

${specials.map((s) => `### ${s.Name}\n\n${s.Description}\n\n- Price: from $${s["Price From"]}\n- Season: ${s.Season}\n- Availability: ${s.Availability}\n- Pre-order: ${site.url}/book/?type=pumpkins`).join("\n\n")}

## Frequently asked questions

${faq.map((f) => `### ${f.Question}\n\n${f.Answer}`).join("\n\n")}

## Reviews (Google)

${testimonials.map((t) => `- "${t.Quote}" (${t.Name}, ${t.Role})`).join("\n")}

## Service area

${cities.map((c) => `### ${c.Name}, NC (${c.County})\n\n${c.Intro}\n\n${c["Delivery Note"]}\n\nPopular wedding venues: ${c.venues.map((v) => v.name).join(", ")}\n\nPage: ${site.url}${c.path}`).join("\n\n")}
`;
}
