// Online ordering: shop, product pages, checkout, order confirmation and policies.
// Prices, sizes, delivery zones and settings come from the Products, Delivery Zones and
// Shop Settings tables. While "Preview Mode" is on, the shop shows a sample-menu notice,
// takes no payments and is hidden from search engines.
import { business } from "./business.mjs";
import { slugify } from "./content.mjs";
import { esc, html, img, pageHero, sectionHead, ctaBand } from "./components.mjs";
import { floristSchema, breadcrumbSchema } from "./seo.mjs";

const money = (n) => "$" + (Number.isInteger(n) ? n : n.toFixed(2));
const fromPrice = (p) => Math.min(...p.sizes.map((s) => s.price));

function previewNotice(catalog) {
  if (!catalog.previewMode) return "";
  return html`<div class="preview-notice" role="note">
          <strong>Shop preview.</strong> This is a sample menu for review: prices marked &ldquo;sample&rdquo; and delivery fees are placeholders until Tiffany sets them, and no payments are taken.
        </div>`;
}

function productCard(p, catalog) {
  return html`<article class="gallery-item product-card" data-categories="${slugify(p["Shop Category"])}">
            <a href="${p.path}" class="product-img">${img(p)}</a>
            <div class="product-body">
              <p class="product-cat">${esc(p["Shop Category"])}</p>
              <h3><a href="${p.path}">${esc(p.Name)}</a></h3>
              <p class="product-price">${p.sizes.length > 1 ? "From " : ""}${money(fromPrice(p))}${!p["Price Confirmed"] && catalog.previewMode ? ' <span class="sample-pill">Sample</span>' : ""}</p>
              <a href="${p.path}" class="btn btn-primary product-btn">Choose options</a>
            </div>
          </article>`;
}

function deliveryInfo(catalog) {
  return html`<div class="shop-info">
          <div class="shop-info-item reveal">
            <h3>Delivery</h3>
            <p>Monday to Saturday to ${catalog.zones.map((z) => esc(z.name)).join(", ").replace(/, ([^,]*)$/, " and $1")}. Fees from ${money(Math.min(...catalog.zones.map((z) => z.fee)))}, shown before you pay.</p>
          </div>
          ${catalog.pickupEnabled ? html`<div class="shop-info-item reveal">
            <h3>Pickup</h3>
            <p>Free pickup at the Kernersville studio during studio hours on the date you choose.</p>
          </div>` : ""}
          <div class="shop-info-item reveal">
            <h3>Order ahead</h3>
            <p>Choose your date at checkout. Everyday arrangements need at least ${catalog.leadDays} day${catalog.leadDays === 1 ? "" : "s"}' notice; pumpkins and corsages need a little more.</p>
          </div>
          <div class="shop-info-item reveal">
            <h3>Designer's choice</h3>
            <p>Each piece is made by hand with the freshest flowers of the week, in the colors and style shown. <a href="/policies/">Ordering policies</a></p>
          </div>
        </div>`;
}

export function buildShopPages(content, site, catalog) {
  const { products, policies, cities } = content;
  const florist = floristSchema(site, cities);
  const crumbs = (...trail) => [{ label: "Home", href: "/" }, ...trail];
  const shopCrumb = { label: "Shop", href: "/shop/" };
  const hideFromSearch = catalog.previewMode;
  const pages = [];

  const shopCats = [...new Set(products.map((p) => p["Shop Category"]))];
  const filterButtons = [
    `<button type="button" class="filter-btn" data-filter="all" aria-pressed="true"><span>Everything</span><span class="filter-count">${products.length}</span></button>`,
    ...shopCats.map((c) => `<button type="button" class="filter-btn" data-filter="${slugify(c)}" aria-pressed="false"><span>${esc(c)}</span><span class="filter-count">${products.filter((p) => p["Shop Category"] === c).length}</span></button>`),
  ].join("\n          ");

  // ---- Shop -----------------------------------------------------------------
  pages.push({
    slug: "shop", path: "/shop/", nav: "/shop/", priority: 0.9, llms: "main", heading: "Shop",
    noindex: hideFromSearch,
    title: "Order Flowers Online | Pixie Dust Floral Design, Kernersville NC",
    description: "Order everyday arrangements, sympathy flowers, corsages and seasonal pumpkin centerpieces from Pixie Dust Floral Design for delivery or pickup in Kernersville, NC.",
    image: "images/gallery-pink-roses.jpg",
    schema: [florist, breadcrumbSchema(site, crumbs(shopCrumb))],
    body: html`${pageHero({
      eyebrow: "Shop", title: "Flowers, <em>ordered online.</em>",
      lede: "Choose an arrangement, pick your date, and Tiffany designs it fresh for delivery or pickup. Planning a wedding? Wedding florals are custom, so <a href=\"/book/\">check your date</a> instead.",
      crumbs: crumbs(shopCrumb), actions: false,
    })}
    <section class="section shop" id="shop">
      <div class="container">
        ${previewNotice(catalog)}
        <div class="gallery-filters" id="gallery-filters" role="toolbar" aria-label="Filter the shop by category" aria-controls="gallery-grid">
          ${filterButtons}
        </div>
        <p class="gallery-status" id="gallery-status" aria-live="polite">Showing all ${products.length} pieces</p>
        <div class="gallery-grid shop-grid" id="gallery-grid">
          ${products.map((p) => productCard(p, catalog)).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section shop-info-section">
      <div class="container">
        ${sectionHead({ eyebrow: "How Ordering Works", title: "Fresh, local <em>and on time.</em>" })}
        ${deliveryInfo(catalog)}
      </div>
    </section>
${ctaBand({ title: "Something <em>more custom?</em>", text: `Call ${business.phone} or send an inquiry for events, larger orders and wedding florals.`, button: "Send an Inquiry", href: "/book/?type=event", image: products[1] })}`,
  });

  // ---- Product pages --------------------------------------------------------
  products.forEach((p) => {
    const trail = crumbs(shopCrumb, { label: p.Name, href: p.path });
    const sample = !p["Price Confirmed"] && catalog.previewMode;
    const canPickup = catalog.pickupEnabled && (p.Fulfillment || []).includes("Pickup");
    const canDeliver = (p.Fulfillment || []).includes("Delivery");
    const related = products.filter((r) => r.id !== p.id).slice(0, 3);
    const schema = [florist, breadcrumbSchema(site, trail)];
    if (!catalog.previewMode) {
      schema.push({
        "@context": "https://schema.org", "@type": "Product", name: p.Name, description: p.Description,
        image: `${site.url}/${p.Photo[0].url}`, brand: { "@type": "Brand", name: business.name },
        offers: { "@type": "AggregateOffer", priceCurrency: "USD", lowPrice: fromPrice(p), highPrice: Math.max(...p.sizes.map((s) => s.price)), offerCount: p.sizes.length, availability: "https://schema.org/InStock" },
      });
    }

    pages.push({
      slug: `product-${p.Slug}`, path: p.path, nav: "/shop/", priority: 0.7, heading: p.Name,
      noindex: hideFromSearch,
      title: `${p.Name} | Order Online | Pixie Dust Floral Design`,
      description: `${p.Description} Delivery or pickup from Kernersville, NC.`,
      image: p.Photo[0].url,
      schema,
      body: html`
    <section class="section product-page">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${trail.map((c, i) => (i < trail.length - 1 ? `<li><a href="${c.href}">${esc(c.label)}</a></li>` : `<li aria-current="page">${esc(c.label)}</li>`)).join("")}</ol></nav>
        ${previewNotice(catalog)}
        <div class="product-grid">
          <div class="product-photo">${img(p, { lazy: false, priority: true })}</div>

          <div class="product-detail">
            <p class="eyebrow">${esc(p["Shop Category"])}</p>
            <h1>${esc(p.Name)}</h1>
            <p class="product-detail-price"><span data-price>${money(fromPrice(p))}</span>${sample ? ' <span class="sample-pill">Sample price</span>' : ""}</p>
            <p class="product-desc">${esc(p.Description)}</p>

            <form class="order-form" id="order-form" data-product="${esc(p.Slug)}" novalidate>
              <fieldset class="field">
                <legend>Size</legend>
                <div class="pill-options">
                  ${p.sizes.map((s, i) => `<label class="pill-option"><input type="radio" name="size" value="${esc(s.name)}" data-price="${s.price}"${i === 0 ? " checked" : ""}><span>${esc(s.name)} &middot; ${money(s.price)}</span></label>`).join("\n                  ")}
                </div>
              </fieldset>

              <div class="form-row">
                <div class="field">
                  <label for="qty">Quantity</label>
                  <input id="qty" name="qty" type="number" inputmode="numeric" min="1" max="20" value="1" required>
                </div>
                <div class="field">
                  <label for="o-date">Date needed</label>
                  <input id="o-date" name="date" type="date" required>
                  <p class="field-error" aria-live="polite"></p>
                </div>
              </div>

              <fieldset class="field">
                <legend>Delivery or pickup</legend>
                <div class="pill-options">
                  ${canDeliver ? `<label class="pill-option"><input type="radio" name="fulfillment" value="Delivery" checked><span>Delivery</span></label>` : ""}
                  ${canPickup ? `<label class="pill-option"><input type="radio" name="fulfillment" value="Pickup"${canDeliver ? "" : " checked"}><span>Pickup in Kernersville</span></label>` : ""}
                </div>
              </fieldset>

              <div class="delivery-fields" data-delivery-fields>
                <div class="form-row">
                  <div class="field">
                    <label for="r-name">Recipient name</label>
                    <input id="r-name" name="recipientName" type="text" autocomplete="off">
                  </div>
                  <div class="field">
                    <label for="r-phone">Recipient phone</label>
                    <input id="r-phone" name="recipientPhone" type="tel" autocomplete="off">
                  </div>
                </div>
                <div class="field">
                  <label for="street">Delivery address</label>
                  <input id="street" name="street" type="text" autocomplete="street-address" placeholder="Street address">
                </div>
                <div class="form-row">
                  <div class="field">
                    <label for="city">City</label>
                    <input id="city" name="city" type="text" autocomplete="address-level2">
                  </div>
                  <div class="field">
                    <label for="zip">ZIP code</label>
                    <input id="zip" name="zip" type="text" inputmode="numeric" maxlength="5" autocomplete="postal-code">
                    <p class="field-hint zip-result" data-zip-result aria-live="polite"></p>
                  </div>
                </div>
              </div>
              <p class="pickup-note" data-pickup-note hidden>Pick up at ${esc(catalog.pickupAddress)} during studio hours on your chosen date.</p>

              <div class="field">
                <label for="card">Card message <span class="optional">(optional)</span></label>
                <textarea id="card" name="cardMessage" rows="3" maxlength="${catalog.cardMessageLimit}" placeholder="Happy birthday, Mom! Love, Sarah"></textarea>
                <p class="field-hint"><span data-card-count>0</span> / ${catalog.cardMessageLimit}</p>
              </div>
              <div class="field">
                <label for="notes">Notes for Tiffany <span class="optional">(optional)</span></label>
                <textarea id="notes" name="instructions" rows="2" placeholder="Favorite colors, dress color for a corsage, gate code..."></textarea>
              </div>

              <div class="order-errors" data-order-errors role="alert" hidden></div>
              <button type="submit" class="btn btn-primary btn-lg btn-block">Add to Cart &middot; <span data-total>${money(fromPrice(p))}</span></button>
              <p class="form-note">Delivery fee is added in your cart based on the ZIP code.</p>
            </form>
          </div>
        </div>
      </div>
    </section>

    <section class="section shop-info-section">
      <div class="container">
        ${sectionHead({ eyebrow: "Good to Know", title: "Before you <em>order.</em>" })}
        ${deliveryInfo(catalog)}
      </div>
    </section>

    <section class="section">
      <div class="container">
        ${sectionHead({ eyebrow: "You May Also Like", title: "More from <em>the studio.</em>" })}
        <div class="shop-grid shop-grid-static">
          ${related.map((r) => productCard(r, catalog)).join("\n          ")}
        </div>
      </div>
    </section>`,
    });
  });

  // ---- Checkout -------------------------------------------------------------
  pages.push({
    slug: "checkout", path: "/shop/checkout/", nav: "/shop/", noindex: true, heading: "Checkout",
    title: "Checkout | Pixie Dust Floral Design",
    description: "Review your flower order and pay securely.",
    schema: [],
    body: html`
    <section class="section checkout-page">
      <div class="container">
        <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/shop/">Shop</a></li><li aria-current="page">Checkout</li></ol></nav>
        <h1 class="checkout-title">Checkout</h1>
        ${previewNotice(catalog)}
        <div class="checkout-grid">
          <div class="checkout-summary" id="checkout-summary" aria-live="polite">
            <p class="cart-empty">Loading your cart&hellip;</p>
          </div>

          <form class="checkout-form booking-card" id="checkout-form" novalidate>
            <h2>Your details</h2>
            <div class="field">
              <label for="c-name">Your name</label>
              <input id="c-name" name="name" type="text" autocomplete="name" required>
              <p class="field-error" aria-live="polite"></p>
            </div>
            <div class="field">
              <label for="c-email">Email</label>
              <input id="c-email" name="email" type="email" autocomplete="email" required>
              <p class="field-error" aria-live="polite"></p>
            </div>
            <div class="field">
              <label for="c-phone">Phone</label>
              <input id="c-phone" name="phone" type="tel" autocomplete="tel" required>
              <p class="field-error" aria-live="polite"></p>
            </div>
            <label class="check-row">
              <input type="checkbox" name="agree" required>
              <span>I've read the <a href="/policies/" target="_blank">ordering policies</a>, including flower substitutions.</span>
            </label>
            <div class="order-errors" data-checkout-errors role="alert" hidden></div>
            <button type="submit" class="btn btn-primary btn-lg btn-block" data-pay-button>${catalog.previewMode ? "Place Preview Order" : "Continue to Secure Payment"}</button>
            <p class="form-note">${catalog.previewMode ? "Preview mode: no card is charged." : "Payment is handled securely by Stripe. Apple Pay and Google Pay accepted."}</p>
          </form>
        </div>
      </div>
    </section>`,
  });

  // ---- Order confirmed --------------------------------------------------------
  pages.push({
    slug: "order-confirmed", path: "/shop/order-confirmed/", nav: "/shop/", noindex: true, heading: "Order confirmed",
    title: "Order Confirmed | Pixie Dust Floral Design",
    description: "Thank you for your order.",
    schema: [],
    body: html`
    <section class="section confirm-page">
      <div class="container narrow">
        <div class="booking-card confirm-card" id="order-confirmed">
          <div class="success-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>
          <h1>Thank you for <em>your order.</em></h1>
          <p class="confirm-lede" data-confirm-lede>Tiffany has your order and will be in touch if she has any questions.</p>
          <div data-confirm-summary></div>
          <div class="hero-actions confirm-actions">
            <a href="/shop/" class="btn btn-primary btn-lg">Keep Shopping</a>
            <a href="${business.phoneHref}" class="btn btn-ghost btn-lg">Questions? ${business.phone}</a>
          </div>
        </div>
      </div>
    </section>`,
  });

  // ---- Policies -----------------------------------------------------------------
  pages.push({
    slug: "policies", path: "/policies/", nav: "", priority: 0.4, heading: "Ordering policies",
    noindex: policies.some((p) => p.Draft),
    title: "Ordering Policies | Pixie Dust Floral Design",
    description: "Delivery, flower substitution, change and cancellation policies for online orders from Pixie Dust Floral Design.",
    schema: [florist, breadcrumbSchema(site, crumbs({ label: "Policies", href: "/policies/" }))],
    body: html`${pageHero({
      eyebrow: "Ordering Policies", title: "The <em>fine print.</em>",
      lede: `Questions about an order? Call ${business.phone}.`,
      crumbs: crumbs({ label: "Policies", href: "/policies/" }), actions: false,
    })}
    <section class="section">
      <div class="container narrow policies">
        ${policies.map((p) => html`<article class="policy reveal">
          <h2>${esc(p.Title)}${p.Draft ? ' <span class="sample-pill">Draft for review</span>' : ""}</h2>
          <p>${esc(p.Body)}</p>
        </article>`).join("\n        ")}
      </div>
    </section>`,
  });

  return pages;
}
