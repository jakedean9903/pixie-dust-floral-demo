// Shared HTML building blocks. Every piece of text from the data file goes through esc().
import { business, fullAddress, directionsUrl } from "./business.mjs";
import { slugify } from "./content.mjs";

export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export const html = (strings, ...values) =>
  strings.reduce((out, s, i) => out + s + (i < values.length ? [].concat(values[i] ?? "").join("") : ""), "");

const photo = (record) => record && record.Photo && record.Photo[0];

export function img(record, { lazy = true, className = "", priority = false } = {}) {
  const p = photo(record);
  if (!p) return "";
  return `<img src="/${esc(p.url)}" width="${p.width}" height="${p.height}" alt="${esc(record["Alt Text"] || "")}"${
    lazy ? ' loading="lazy" decoding="async"' : ""}${priority ? ' fetchpriority="high"' : ""}${className ? ` class="${className}"` : ""}>`;
}

const STAR = '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"/></svg>';
export const stars = (className = "") => `<span class="rating-stars ${className}" aria-hidden="true">${STAR.repeat(5)}</span>`;

export function ratingBadge() {
  const { value, count } = business.rating;
  return html`<a href="/reviews/" class="rating-badge" aria-label="Rated ${value} out of 5 stars from ${count} Google reviews">
            ${stars()}
            <span class="rating-text"><strong>${value} stars</strong> from ${count} Google reviews</span>
          </a>`;
}

// ---- Page chrome ----------------------------------------------------------
export const NAV = [
  { href: "/weddings/", label: "Weddings" },
  { href: "/shop/", label: "Shop" },
  { href: "/gallery/", label: "Gallery" },
  { href: "/reviews/", label: "Reviews" },
  { href: "/about/", label: "About" },
];

// Footer-only links (kept out of the top bar so it stays uncluttered)
const MORE = [
  { href: "/seasonal-specials/", label: "Seasonal Specials" },
  { href: "/everyday-sympathy/", label: "Everyday & Sympathy" },
  { href: "/faq/", label: "FAQ" },
  { href: "/policies/", label: "Ordering Policies" },
  { href: "/book/", label: "Check Your Date" },
];

export function header(current) {
  const links = NAV.map((n) =>
    `<li><a href="${n.href}"${n.href === current ? ' aria-current="page"' : ""}>${esc(n.label)}</a></li>`).join("\n          ");
  return html`<a class="skip-link" href="#main">Skip to content</a>

  <header class="site-header" id="top">
    <nav class="nav container" aria-label="Main">
      <a href="/" class="brand" aria-label="Pixie Dust Floral Design home">
        <span class="brand-name">Pixie Dust</span>
        <span class="brand-sub">Floral Design</span>
      </a>

      <div class="nav-actions">
        <a href="/shop/checkout/" class="cart-btn" data-cart-open aria-label="Cart, 0 items">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 8h12l-1.2 11.2a1 1 0 0 1-1 .8H8.2a1 1 0 0 1-1-.8L6 8z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>
          <span class="cart-count" data-cart-count hidden>0</span>
        </a>
        <button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Open menu">
          <span></span><span></span><span></span>
        </button>
      </div>

      <div class="nav-menu" id="nav-menu">
        <ul class="nav-links">
          ${links}
        </ul>
        <a href="/book/" class="btn btn-primary nav-cta">Check Your Date</a>
      </div>
    </nav>
  </header>`;
}

export function footer(cities) {
  const cityLinks = cities.map((c) => `<a href="${c.path}">Wedding florist in ${esc(c.Name)}</a>`).join("\n        ");
  return html`<footer class="site-footer">
    <div class="container footer-grid">
      <div class="footer-about">
        <p class="footer-brand">Pixie Dust <span>Floral Design</span></p>
        <p class="footer-tag">&ldquo;${esc(business.tagline)}&rdquo;</p>
        <p class="footer-hours">Mon&ndash;Fri 9am&ndash;2pm &middot; Sat 10am&ndash;12pm</p>
      </div>
      <nav class="footer-links" aria-label="Explore">
        <p class="footer-head">Explore</p>
        ${[...NAV, ...MORE].map((n) => `<a href="${n.href}">${esc(n.label)}</a>`).join("\n        ")}
      </nav>
      <nav class="footer-links" aria-label="Service area">
        <p class="footer-head">Service Area</p>
        ${cityLinks}
        <a href="/wedding-florist/">All Triad locations</a>
      </nav>
      <div class="footer-contact">
        <p class="footer-head">Contact</p>
        <a href="${business.phoneHref}">${business.phone}</a>
        <a href="${business.instagram}" target="_blank" rel="noopener">${business.instagramHandle}</a>
        <a href="${directionsUrl}" target="_blank" rel="noopener">${esc(fullAddress)}</a>
      </div>
    </div>
    <div class="container footer-bottom">
      <p>&copy; <span id="year">${new Date().getFullYear()}</span> Pixie Dust Floral Design. All rights reserved.</p>
      <p class="credit">Concept website designed by <strong>Dupuis Designs</strong>.</p>
    </div>
  </footer>

  <div class="mobile-cta">
    <a href="${business.phoneHref}" class="mobile-cta-call">Call</a>
    <a href="/book/" class="btn btn-primary">Check Your Date</a>
  </div>

  <dialog class="cart-drawer" id="cart-drawer" aria-label="Your cart">
    <div class="cart-head">
      <h2>Your cart</h2>
      <button type="button" class="cart-close" aria-label="Close cart">&times;</button>
    </div>
    <div class="cart-body" data-cart-body></div>
    <div class="cart-foot" data-cart-foot></div>
  </dialog>

  <dialog class="lightbox" id="lightbox" aria-label="Photo viewer">
    <button type="button" class="lightbox-close" aria-label="Close photo">&times;</button>
    <button type="button" class="lightbox-nav lightbox-prev" aria-label="Previous photo">&#8249;</button>
    <figure>
      <!-- photo is inserted by script.js when a gallery image is opened -->
      <figcaption></figcaption>
    </figure>
    <button type="button" class="lightbox-nav lightbox-next" aria-label="Next photo">&#8250;</button>
  </dialog>`;
}

export function layout({ site, page, cities }) {
  const url = site.url + page.path;
  const image = site.url + "/" + (page.image || "images/hero-bride-bouquet.jpg");
  const schema = (page.schema || []).map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`).join("\n  ");
  return html`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(page.title)}</title>
  <meta name="description" content="${esc(page.description)}">
  <link rel="canonical" href="${url}">
  <meta name="theme-color" content="#fbf7f2">
  ${page.noindex ? '<meta name="robots" content="noindex">' : ""}

  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Pixie Dust Floral Design">
  <meta property="og:title" content="${esc(page.title)}">
  <meta property="og:description" content="${esc(page.description)}">
  <meta property="og:url" content="${url}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">

  <link rel="icon" href="/images/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet">
  ${page.preload ? `<link rel="preload" as="image" href="/${page.preload}" fetchpriority="high">` : ""}
  <link rel="stylesheet" href="/styles.css?v=${site.version}">
  <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM-readable summary">
  ${schema}
</head>
<body class="page-${page.slug}">

  ${header(page.nav)}

  <main id="main">
${page.body}
  </main>

  ${footer(cities)}

  <script src="/script.js?v=${site.version}"></script>
  <script type="module" src="/shop.js?v=${site.version}"></script>
</body>
</html>
`;
}

// ---- Content blocks -------------------------------------------------------
export function pageHero({ eyebrow, title, lede, crumbs, image, actions = true }) {
  const trail = crumbs
    ? `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${crumbs
        .map((c, i) => (i < crumbs.length - 1 ? `<li><a href="${c.href}">${esc(c.label)}</a></li>` : `<li aria-current="page">${esc(c.label)}</li>`))
        .join("")}</ol></nav>`
    : "";
  return html`    <section class="page-hero${image ? " page-hero-media" : ""}">
      <div class="container page-hero-grid">
        <div class="page-hero-copy">
          ${trail}
          <p class="eyebrow">${eyebrow}</p>
          <h1>${title}</h1>
          ${lede ? `<p class="hero-lede">${lede}</p>` : ""}
          ${actions ? `<div class="hero-actions">
            <a href="/book/" class="btn btn-primary btn-lg">Check Your Date</a>
            <a href="${business.phoneHref}" class="btn btn-ghost btn-lg">Call ${business.phone}</a>
          </div>` : ""}
        </div>
        ${image ? `<div class="page-hero-img">${img(image, { lazy: false, priority: true })}</div>` : ""}
      </div>
    </section>
`;
}

export function sectionHead({ eyebrow, title, lede, center = true }) {
  return html`<div class="section-head${center ? "" : " section-head-left"} reveal">
          <p class="eyebrow">${eyebrow}</p>
          <h2>${title}</h2>
          ${lede ? `<p class="section-lede">${lede}</p>` : ""}
        </div>`;
}

export function serviceCard(service, specials) {
  const special = (service["Featured Special"] || []).map((id) => specials.find((s) => s.id === id)).find(Boolean);
  const category = slugify(service["Gallery Category"]);
  return html`<article class="service-card reveal">
            <a class="service-img" href="${service.Page}" tabindex="-1" aria-hidden="true">
              ${img(service)}
              ${special ? `<span class="price-tag">${esc(special.Badge)} from $${special["Price From"]}</span>` : ""}
            </a>
            <div class="service-body">
              <h3><a href="${service.Page}">${esc(service.Name)}</a></h3>
              <p>${esc(service.Description)}</p>
              <div class="service-links">
                <a href="/book/" class="link-arrow">${esc(service["CTA Label"])}</a>
                <a href="/gallery/?category=${category}" class="link-quiet">See the work</a>
              </div>
            </div>
          </article>`;
}

export function photoCard(record) {
  const caption = record.Caption || record.Title;
  const credit = record["Photo Credit"] ? `<span class="photo-credit"> &middot; Photo: ${esc(record["Photo Credit"])}</span>` : "";
  return html`<figure class="gallery-item" data-categories="${(record.Categories || []).map(slugify).join(" ")}">
            <button type="button" class="gallery-open" aria-label="View larger: ${esc(caption)}">
              ${img(record)}
            </button>
            <figcaption>${esc(caption)}${credit}</figcaption>
          </figure>`;
}

export function specialCard(record) {
  const meta = [record.Season, record.Availability].filter(Boolean).join(" · ");
  return html`<figure class="gallery-item special-card" data-categories="${(record.Categories || []).map(slugify).join(" ")}">
            <button type="button" class="gallery-open" aria-label="View larger: ${esc(record.Name)}">
              ${img(record)}
              <span class="special-flag">Seasonal Special</span>
            </button>
            <figcaption class="special-body">
              <p class="special-meta">${esc(meta)}</p>
              <h3>${esc(record.Name)}</h3>
              <p>${esc(record.Description)}</p>
              <div class="special-footer">
                ${record["Price From"] ? `<span class="special-price">From $${record["Price From"]}</span>` : ""}
                <a href="/shop/floral-pumpkin-centerpiece/" class="btn btn-primary">Pre-order</a>
              </div>
            </figcaption>
          </figure>`;
}

// Filterable gallery. Buttons and counts are generated from each record's Categories.
export function filterableGallery({ gallery, specials, categories }) {
  const items = [...specials.map((s) => ({ special: true, r: s })), ...gallery.map((g) => ({ special: false, r: g }))];
  const count = (cat) => items.filter((i) => (i.r.Categories || []).includes(cat)).length;
  const buttons = [
    `<button type="button" class="filter-btn" data-filter="all" aria-pressed="true"><span>All Work</span><span class="filter-count">${items.length}</span></button>`,
    ...categories.filter((c) => count(c) > 0).map((c) =>
      `<button type="button" class="filter-btn" data-filter="${slugify(c)}" aria-pressed="false"><span>${esc(c)}</span><span class="filter-count">${count(c)}</span></button>`),
  ].join("\n          ");

  return html`<!--
          AIRTABLE DEMO SECTION: filter buttons, counts and cards are generated at build time from
          the Gallery and Specials tables in data/site-content.json. Each record's "Categories"
          field drives filtering; script.js only shows and hides the pre-rendered cards.
        -->
        <div class="gallery-filters" id="gallery-filters" role="toolbar" aria-label="Filter gallery by category" aria-controls="gallery-grid">
          ${buttons}
        </div>
        <p class="gallery-status" id="gallery-status" aria-live="polite">Showing all ${items.length} pieces</p>

        <div class="gallery-grid" id="gallery-grid">
          ${items.map((i) => (i.special ? specialCard(i.r) : photoCard(i.r))).join("\n          ")}
        </div>

        <p class="airtable-note reveal">
          <span class="airtable-dot" aria-hidden="true"></span>
          Built to update from Airtable: once connected, new photos and seasonal specials Tiffany adds there appear here automatically, already sorted into these categories.
        </p>`;
}

export function simpleGallery(records) {
  return html`<div class="gallery-grid">
          ${records.map(photoCard).join("\n          ")}
        </div>`;
}

export function reviewCard(t, { feature = t.Featured } = {}) {
  const hasPhoto = !!photo(t);
  const role = t.Role === t.Source || /·/.test(t.Role) ? t.Role : `${t.Role} · ${t.Source}`;
  const inner = html`<div class="review-stars" aria-label="${t.Rating || 5} out of 5 stars">${"★".repeat(t.Rating || 5)}</div>
              <blockquote><p>&ldquo;${esc(t.Quote)}&rdquo;</p></blockquote>
              <figcaption><strong>${esc(t.Name)}</strong><span>${esc(role)}</span></figcaption>`;
  const cls = `review-card reveal${feature ? " review-card-feature" : ""}${hasPhoto ? " review-card-photo" : ""}`;
  return hasPhoto
    ? html`<figure class="${cls}">
            ${img(t)}
            <div class="review-card-inner">
              ${inner}
            </div>
          </figure>`
    : html`<figure class="${cls}">
              ${inner}
          </figure>`;
}

export function reviewsHeader({ eyebrow = "Kind Words", level = "h2" } = {}) {
  const { value, count, fiveStar } = business.rating;
  return html`<div class="section-head reveal">
          <p class="eyebrow">${eyebrow}</p>
          <div class="reviews-score" aria-hidden="true">${stars("rating-stars-lg")}</div>
          <${level}>${value} stars from <em>${count} Google reviews</em></${level}>
          <p class="section-lede">${fiveStar} of them five stars. Here's what brides and their families say about working with Tiffany.</p>
        </div>`;
}

export function processSteps() {
  return html`<ol class="steps">
          <li class="step reveal">
            <span class="step-num">01</span>
            <h3>Tell us your date</h3>
            <p>Share your wedding date, venue, guest count and budget in the inquiry form. It takes about two minutes and tells Tiffany exactly where to start.</p>
          </li>
          <li class="step reveal">
            <span class="step-num">02</span>
            <h3>Design together</h3>
            <p>Bring your Pinterest boards, swatches and dream flowers. Tiffany listens, adds her own ideas, and shapes a floral plan around your vision and your budget.</p>
          </li>
          <li class="step reveal">
            <span class="step-num">03</span>
            <h3>We deliver &amp; style</h3>
            <p>On the big day your florals arrive fresh and are set in place at your venue, so all you have to do is walk in and gasp.</p>
          </li>
        </ol>`;
}

export function faqList(items) {
  return html`<div class="faq-list">
          ${items.map((f) => html`<details class="faq-item reveal">
            <summary>${esc(f.question || f.Question)}</summary>
            <p>${esc(f.answer || f.Answer)}</p>
          </details>`).join("\n          ")}
        </div>`;
}

export function ctaBand({ title, text, image, button = "Check Your Date", href = "/book/" }) {
  return html`    <section class="cta-band">
      ${image ? img(image) : ""}
      <div class="cta-band-inner reveal">
        <h2>${title}</h2>
        ${text ? `<p>${text}</p>` : ""}
        <a href="${href}" class="btn btn-light btn-lg">${button}</a>
      </div>
    </section>
`;
}

export function cityLinks(cities, exclude) {
  return html`<ul class="city-links">
          ${cities.filter((c) => c.Slug !== exclude).map((c) => `<li><a href="${c.path}"><span>${esc(c.Name)}, NC</span><small>${esc(c.County)}</small></a></li>`).join("\n          ")}
        </ul>`;
}

// The inquiry form. `type` preselects what the visitor is planning; script.js shows the
// wedding-only fields (guest count, budget) when the type is a wedding or event.
export function bookingForm(type = "wedding") {
  const types = [
    ["wedding", "Wedding"],
    ["event", "Shower, party or other event"],
    ["pumpkins", "Fall pumpkin centerpieces"],
    ["everyday", "Everyday or sympathy flowers"],
  ];
  return html`<div class="booking-card reveal">
          <!--
            DEMO MODE: this form does not send anywhere yet. script.js validates it and shows a
            success message. When the site goes live, connect it in script.js (search "GO-LIVE"):
            Netlify Forms, or Tiffany's HoneyBook inquiry form, so new leads land in her pipeline.
          -->
          <form class="inquiry-form" id="inquiry-form" novalidate>
            <div class="field">
              <label for="type">What are you planning?</label>
              <div class="select-wrap">
                <select id="type" name="type" required>
                  ${types.map(([v, l]) => `<option value="${v}"${v === type ? " selected" : ""}>${l}</option>`).join("\n                  ")}
                </select>
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label for="name">Your name</label>
                <input id="name" name="name" type="text" autocomplete="name" required placeholder="First and last name">
                <p class="field-error" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" autocomplete="email" required placeholder="you@example.com">
                <p class="field-error" aria-live="polite"></p>
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label for="phone">Phone</label>
                <input id="phone" name="phone" type="tel" autocomplete="tel" required placeholder="(336) 555-0123">
                <p class="field-error" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="date" data-label-wedding="Wedding / event date" data-label-other="Date you need flowers">Wedding / event date</label>
                <input id="date" name="date" type="date" required>
                <p class="field-error" aria-live="polite"></p>
              </div>
            </div>

            <div class="form-row">
              <div class="field">
                <label for="venue" data-label-wedding="Venue / location" data-label-other="Location / city">Venue / location</label>
                <input id="venue" name="venue" type="text" required placeholder="Venue name and city" data-placeholder-wedding="Venue name and city" data-placeholder-other="City or delivery address">
                <p class="field-error" aria-live="polite"></p>
              </div>
              <div class="field" data-wedding-only>
                <label for="guests">Estimated guest count</label>
                <input id="guests" name="guests" type="number" inputmode="numeric" min="1" max="2000" required placeholder="e.g. 120">
                <p class="field-error" aria-live="polite"></p>
              </div>
            </div>

            <fieldset class="field budget-field" data-wedding-only>
              <legend>Floral budget <span class="required-tag">Required</span></legend>
              <p class="field-hint">This helps Tiffany recommend the right designs for your day.</p>
              <div class="budget-options">
                <label class="budget-option"><input type="radio" name="budget" value="Under $1,000" required><span>Under $1,000</span></label>
                <label class="budget-option"><input type="radio" name="budget" value="$1,000–$2,500"><span>$1,000&ndash;$2,500</span></label>
                <label class="budget-option"><input type="radio" name="budget" value="$2,500–$5,000"><span>$2,500&ndash;$5,000</span></label>
                <label class="budget-option"><input type="radio" name="budget" value="$5,000+"><span>$5,000+</span></label>
              </div>
              <p class="field-error" aria-live="polite"></p>
            </fieldset>

            <div class="field">
              <label for="vision" data-label-wedding="Tell us about your vision" data-label-other="What would you like?">Tell us about your vision</label>
              <textarea id="vision" name="vision" rows="5" required placeholder="Colors, favorite flowers, the feel you want, and what you'll need (bouquets, arch, centerpieces...)" data-placeholder-wedding="Colors, favorite flowers, the feel you want, and what you'll need (bouquets, arch, centerpieces...)" data-placeholder-other="Who the flowers are for, how many you need, and any colors or flowers you love"></textarea>
              <p class="field-error" aria-live="polite"></p>
            </div>

            <button type="submit" class="btn btn-primary btn-lg btn-block">Check My Date</button>
            <p class="form-note">Your details go only to Pixie Dust Floral Design.</p>
          </form>

          <div class="form-success" id="form-success" hidden tabindex="-1">
            <div class="success-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
            </div>
            <h3>Thank you, <span id="success-name">friend</span>!</h3>
            <p>Your inquiry for <strong id="success-date">your date</strong> is in. Tiffany will review your details and reach out soon to talk flowers.</p>
            <p class="success-sub">Can't wait? Call <a href="${business.phoneHref}">${business.phone}</a> or browse <a href="${business.instagram}" target="_blank" rel="noopener">${business.instagramHandle}</a> for inspiration.</p>
          </div>
        </div>`;
}

export function bookingSection({ type = "wedding", title = "Let's check <em>your date.</em>", intro, image } = {}) {
  return html`    <section class="section booking" id="book">
      <div class="container booking-grid">
        <div class="booking-intro reveal">
          <p class="eyebrow">${type === "wedding" ? "Wedding Inquiry" : "Inquiry"}</p>
          <h2>${title}</h2>
          <p>${intro || "Wedding dates book up, especially in spring and fall. Tell Tiffany a little about your day and she'll follow up to talk flowers, availability and next steps."}</p>

          <ul class="booking-points">
            <li>Takes about two minutes</li>
            <li>No obligation, just a conversation</li>
            <li>Prefer to talk? Call <a href="${business.phoneHref}">${business.phone}</a></li>
          </ul>

          ${image ? `<div class="booking-photo">${img(image)}</div>` : ""}
        </div>

        ${bookingForm(type)}
      </div>
    </section>
`;
}

export function visitDetails() {
  return html`<div class="visit-details">
            <div class="detail">
              <h3>Address</h3>
              <p>${esc(business.street)}<br>${esc(business.city)}, ${business.region} ${business.postalCode}</p>
              <a href="${directionsUrl}" class="link-arrow" target="_blank" rel="noopener">Get directions</a>
            </div>
            <div class="detail">
              <h3>Hours</h3>
              <dl class="hours">
                ${business.hours.map((h) => `<div><dt>${h.label}</dt><dd>${h.value}</dd></div>`).join("\n                ")}
              </dl>
            </div>
            <div class="detail">
              <h3>Call</h3>
              <p><a href="${business.phoneHref}" class="big-link">${business.phone}</a></p>
            </div>
            <div class="detail">
              <h3>Follow</h3>
              <p><a href="${business.instagram}" class="big-link insta-link" target="_blank" rel="noopener">
                <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.3" cy="6.7" r="1.1"/></svg>
                ${business.instagramHandle}</a></p>
            </div>
          </div>`;
}

export function mapEmbed() {
  return `<div class="visit-map reveal">
          <iframe title="Map showing Pixie Dust Floral Design at ${esc(fullAddress)}"
                  src="https://www.google.com/maps?q=6010+Habersham+Dr,+Kernersville,+NC+27284&amp;output=embed"
                  loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>`;
}
