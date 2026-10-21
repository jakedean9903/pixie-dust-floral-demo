// Every page on the site. Each returns { path, title, description, schema, body, ... }.
import { business } from "./business.mjs";
import { slugify } from "./content.mjs";
import {
  esc, html, img, stars, ratingBadge, pageHero, sectionHead, serviceCard, photoCard, specialCard,
  filterableGallery, simpleGallery, reviewCard, reviewsHeader, processSteps, faqList, ctaBand,
  cityLinks, bookingForm, bookingSection, visitDetails, mapEmbed,
} from "./components.mjs";
import { floristSchema, breadcrumbSchema, faqSchema, specialOfferSchema, serviceSchema } from "./seo.mjs";

const byId = (list, id) => list.find((r) => r.id === id);
const inCategory = (list, cat) => list.filter((r) => (r.Categories || []).includes(cat));
const faqFor = (faq, topic) => faq.filter((f) => (f.Topics || []).includes(topic));

export function buildPages(content, site) {
  const { gallery, specials, testimonials, services, faq, cities } = content;
  const florist = floristSchema(site, cities);
  const crumbs = (...trail) => [{ label: "Home", href: "/" }, ...trail];
  const pumpkins = specials[0];
  const banner = testimonials.find((t) => t["Show in Banner"]);

  const pages = [];

  // ---- Home ---------------------------------------------------------------
  pages.push({
    slug: "home", path: "/", nav: "/", priority: 1.0, llms: "main", heading: "Home",
    title: "Pixie Dust Floral Design | Wedding Florist in Kernersville, NC",
    description: `Wedding and event florist in Kernersville, NC. Bridal bouquets, ceremony and reception design, centerpieces and installations by Tiffany. ${business.rating.value} stars from ${business.rating.count} Google reviews.`,
    preload: "images/hero-bride-bouquet.jpg",
    schema: [florist],
    body: html`
    <section class="hero">
      <div class="container hero-grid">
        <div class="hero-copy">
          <p class="eyebrow">Wedding &amp; Event Florist &middot; Kernersville, NC</p>
          <h1>Wedding flowers that make the <em>whole room gasp.</em></h1>
          <p class="hero-lede">Bridal bouquets, ceremony arches, centerpieces and installations, designed by Tiffany around your colors, your venue and the way you want your day to feel.</p>
          <div class="hero-actions">
            <a href="/book/" class="btn btn-primary btn-lg">Check Your Date</a>
            <a href="/gallery/" class="btn btn-ghost btn-lg">See Real Weddings</a>
          </div>
          ${ratingBadge()}
        </div>
        <div class="hero-media">
          <div class="hero-arch">
            ${img(byId(gallery, "recGal17SequinBr"), { lazy: false, priority: true })}
          </div>
          <div class="hero-inset">
            <img src="/images/hero-inset-pink-bouquet.jpg" width="675" height="900" alt="Hand-tied bouquet of pink roses, carnations and lavender blooms with a trailing blush ribbon">
          </div>
          <p class="hero-quote">&ldquo;${esc(business.tagline)}&rdquo;<span>Tiffany, owner &amp; floral designer</span></p>
        </div>
      </div>
    </section>

    <div class="ribbon" aria-label="Floral specialties">
      <div class="ribbon-track">
        ${business.specialties.map((s) => `<span>${esc(s)}</span>`).join("")}
        ${business.specialties.map((s) => `<span aria-hidden="true">${esc(s)}</span>`).join("")}
      </div>
    </div>

    <section class="section services" id="services">
      <div class="container">
        ${sectionHead({ eyebrow: "Wedding Services", title: "Every bloom, from the first look <em>to the last dance.</em>",
          lede: "From the bouquet in every photo to the tables your guests talk about, Tiffany designs florals that feel like you, using the flowers she loves most: ranunculus, coral charm peonies, astilbe and succulents." })}
        <div class="service-grid">
          ${services.map((s) => serviceCard(s, specials)).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="feature-band" aria-label="Featured wedding">
      ${img(byId(gallery, "recGal15BrdParty"))}
      <div class="feature-band-overlay">
        <blockquote class="reveal">
          <p>&ldquo;${esc(banner["Pull Quote"])}&rdquo;</p>
          <cite>${esc(banner.Name)}, ${esc(banner.Role.toLowerCase())}</cite>
        </blockquote>
        <a href="/book/" class="btn btn-light btn-lg reveal">Check Your Date</a>
      </div>
    </section>

    <section class="section process" id="process">
      <div class="container">
        ${sectionHead({ eyebrow: "How It Works", title: "Three simple steps <em>to your wedding flowers.</em>" })}
        ${processSteps()}
        <div class="center reveal"><a href="/book/" class="btn btn-primary btn-lg">Start With Step One</a></div>
      </div>
    </section>

    <section class="section gallery" id="gallery">
      <div class="container">
        ${sectionHead({ eyebrow: "The Gallery", title: "Real weddings. <em>Real Pixie Dust.</em>",
          lede: "Every photo here is Tiffany's work, from real weddings and events. Tap any photo to see it larger." })}
        ${simpleGallery(gallery.slice(0, 9))}
        <div class="gallery-cta reveal">
          <a href="/gallery/" class="btn btn-primary btn-lg">See the Full Gallery</a>
          <a href="${business.instagram}" class="btn btn-ghost btn-lg" target="_blank" rel="noopener">More on Instagram ${business.instagramHandle}</a>
        </div>
      </div>
    </section>

    ${pumpkins ? html`<section class="section seasonal-band">
      <div class="container seasonal-grid">
        <div class="seasonal-img reveal">${img(pumpkins)}</div>
        <div class="seasonal-copy reveal">
          <p class="eyebrow">Seasonal Special &middot; ${esc(pumpkins.Season)}</p>
          <h2>${esc(pumpkins.Name)}</h2>
          <p class="section-lede">${esc(pumpkins.Description)}</p>
          <p class="seasonal-price">From $${pumpkins["Price From"]} <span>${esc(pumpkins.Availability)}</span></p>
          <div class="hero-actions">
            <a href="/shop/floral-pumpkin-centerpiece/" class="btn btn-primary btn-lg">Pre-order Pumpkins</a>
            <a href="/seasonal-specials/" class="btn btn-ghost btn-lg">See Seasonal Specials</a>
          </div>
        </div>
      </div>
    </section>` : ""}

    <section class="section reviews" id="reviews">
      <div class="container">
        ${reviewsHeader()}
        <div class="review-grid">
          ${testimonials.map((t) => reviewCard(t)).join("\n          ")}
        </div>
        <div class="center reveal reviews-cta">
          <a href="/book/" class="btn btn-primary btn-lg">Join Our Happy Couples</a>
          <a href="/reviews/" class="link-arrow">Read more reviews</a>
        </div>
      </div>
    </section>

    <section class="section area-band">
      <div class="container">
        ${sectionHead({ eyebrow: "Service Area", title: "Wedding florist for Kernersville <em>&amp; the Triad.</em>",
          lede: "Designed in Kernersville and delivered to your venue. Find details, venues and real weddings for your city." })}
        ${cityLinks(cities)}
      </div>
    </section>

${bookingSection({ image: byId(gallery, "recGal07BrdsmBqt") })}`,
  });

  // ---- Weddings -------------------------------------------------------------
  const weddingFaq = faqFor(faq, "Weddings");
  const svc = (id) => byId(services, id);
  const detail = (id, anchor, image, extra, reverse) => {
    const s = svc(id);
    return html`<div class="detail-row${reverse ? " detail-row-reverse" : ""}" id="${anchor}">
          <div class="detail-img reveal">${img(image)}</div>
          <div class="detail-copy reveal">
            <h2>${esc(s.Name)}</h2>
            <p>${esc(s.Description)}</p>
            ${extra}
            <div class="service-links">
              <a href="/book/" class="link-arrow">${esc(s["CTA Label"])}</a>
              <a href="/gallery/?category=${slugify(s["Gallery Category"])}" class="link-quiet">See ${esc(s["Gallery Category"].toLowerCase())} in the gallery</a>
            </div>
          </div>
        </div>`;
  };
  pages.push({
    slug: "weddings", path: "/weddings/", nav: "/weddings/", priority: 0.9, llms: "main", heading: "Wedding Flowers",
    title: "Wedding Flowers & Bridal Bouquets in Kernersville, NC | Pixie Dust Floral Design",
    description: "Bridal bouquets, ceremony arches, reception centerpieces and installations designed by Tiffany at Pixie Dust Floral Design in Kernersville, NC. Check your wedding date today.",
    image: "images/bridal-party-bouquets.jpg",
    schema: [florist, breadcrumbSchema(site, crumbs({ label: "Weddings", href: "/weddings/" })), faqSchema(weddingFaq),
      serviceSchema(site, { name: "Wedding florals", description: "Bridal bouquets, ceremony and reception design, centerpieces and installations.", path: "/weddings/" })],
    body: html`${pageHero({
      eyebrow: "Weddings", title: "Wedding flowers designed <em>around your day.</em>",
      lede: "From your bridal bouquet to the last centerpiece, Tiffany designs every piece around your dress, your colors and your venue, then delivers and sets it all in place.",
      crumbs: crumbs({ label: "Weddings", href: "/weddings/" }), image: byId(gallery, "recGal15BrdParty"),
    })}
    <section class="section">
      <div class="container detail-rows">
        ${detail("recSvc01Bouquets", "bouquets", byId(gallery, "recGal01PeachBqt"),
          `<ul class="tick-list"><li>Bridal bouquets</li><li>Bridesmaids' bouquets</li><li>Boutonnieres &amp; corsages</li></ul>`)}
        ${detail("recSvc02Ceremony", "ceremony", byId(gallery, "recGal05LakeArch"),
          `<ul class="tick-list"><li>Ceremony arches</li><li>Altar arrangements</li><li>Reception styling</li></ul>`, true)}
        ${detail("recSvc03Centrpcs", "centerpieces", byId(gallery, "recGal03TableScp"),
          `<ul class="tick-list"><li>Table centerpieces</li><li>Floral installations</li><li>Signature pumpkin centerpieces from $${pumpkins ? pumpkins["Price From"] : 65}</li></ul>`)}
      </div>
    </section>

    <section class="section process">
      <div class="container">
        ${sectionHead({ eyebrow: "How It Works", title: "Three simple steps <em>to your wedding flowers.</em>" })}
        ${processSteps()}
      </div>
    </section>

    <section class="section gallery">
      <div class="container">
        ${sectionHead({ eyebrow: "Real Weddings", title: "Bouquets, arches <em>&amp; receptions.</em>" })}
        ${simpleGallery([...inCategory(gallery, "Ceremony & Reception"), ...inCategory(gallery, "Bridal Bouquets")]
          .filter((r, i, a) => a.indexOf(r) === i).slice(0, 9))}
        <div class="gallery-cta reveal"><a href="/gallery/" class="btn btn-ghost btn-lg">See the Full Gallery</a></div>
      </div>
    </section>

    <section class="section reviews">
      <div class="container">
        ${reviewsHeader({ eyebrow: "From Our Brides" })}
        <div class="review-grid">
          ${testimonials.filter((t) => /bride/i.test(t.Role)).map((t) => reviewCard(t)).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section faq-section">
      <div class="container narrow">
        ${sectionHead({ eyebrow: "Wedding FAQ", title: "Questions brides <em>ask most.</em>" })}
        ${faqList(weddingFaq)}
        <p class="center faq-more reveal"><a href="/faq/" class="link-arrow">All frequently asked questions</a></p>
      </div>
    </section>

${bookingSection({ image: byId(gallery, "recGal16FlatLayB") })}`,
  });

  // ---- Gallery ------------------------------------------------------------
  pages.push({
    slug: "gallery", path: "/gallery/", nav: "/gallery/", priority: 0.8, llms: "main", heading: "Gallery",
    title: "Wedding Flower Gallery | Pixie Dust Floral Design, Kernersville NC",
    description: "Browse real bridal bouquets, ceremony arches, centerpieces, everyday arrangements and seasonal specials by Pixie Dust Floral Design in Kernersville, NC.",
    image: "images/gallery-peach-ranunculus-bouquet.jpg",
    schema: [florist, breadcrumbSchema(site, crumbs({ label: "Gallery", href: "/gallery/" }))],
    body: html`${pageHero({
      eyebrow: "The Gallery", title: "Real weddings. <em>Real Pixie Dust.</em>",
      lede: "Every photo here is Tiffany's work. Choose a category, then tap any photo to see it larger.",
      crumbs: crumbs({ label: "Gallery", href: "/gallery/" }), actions: false,
    })}
    <section class="section gallery gallery-page" id="gallery">
      <div class="container">
        ${filterableGallery(content)}
        <div class="gallery-cta reveal">
          <a href="/book/" class="btn btn-primary btn-lg">I Want Flowers Like These</a>
          <a href="${business.instagram}" class="btn btn-ghost btn-lg" target="_blank" rel="noopener">More on Instagram ${business.instagramHandle}</a>
        </div>
      </div>
    </section>`,
  });

  // ---- Seasonal specials --------------------------------------------------
  const seasonalFaq = faqFor(faq, "Seasonal");
  pages.push({
    slug: "seasonal", path: "/seasonal-specials/", nav: "/seasonal-specials/", priority: 0.8, llms: "main", heading: "Seasonal Specials",
    title: `Floral Pumpkin Centerpieces from $${pumpkins ? pumpkins["Price From"] : 65} | Pixie Dust Floral Design`,
    description: "Tiffany's signature flower-filled pumpkin centerpieces start at $65 and are available in the fall by pre-order only. Kernersville, NC.",
    image: "images/service-pumpkin-centerpiece.jpg",
    schema: [florist, breadcrumbSchema(site, crumbs({ label: "Seasonal Specials", href: "/seasonal-specials/" })), faqSchema(seasonalFaq),
      ...specials.map((s) => specialOfferSchema(site, s))],
    body: html`${pageHero({
      eyebrow: "Seasonal Specials", title: "Fall's favorite: <em>floral pumpkins.</em>",
      lede: pumpkins ? `${esc(pumpkins.Description)} From $${pumpkins["Price From"]}, ${esc(pumpkins.Availability.toLowerCase())}.` : "",
      crumbs: crumbs({ label: "Seasonal Specials", href: "/seasonal-specials/" }), actions: false,
    })}
    <section class="section">
      <div class="container">
        ${specials.map((s) => html`<div class="special-feature reveal">
          <div class="special-feature-img">${img(s, { lazy: false })}</div>
          <div class="special-feature-copy">
            <p class="eyebrow">${esc(s.Season)} &middot; ${esc(s.Availability)}</p>
            <h2>${esc(s.Name)}</h2>
            <p class="section-lede">${esc(s.Description)}</p>
            <p class="seasonal-price">From $${s["Price From"]}</p>
            <ul class="tick-list">
              <li>Flower-filled pumpkin centerpieces</li>
              <li>Available in the ${esc(s.Season.toLowerCase())}</li>
              <li>Designed by pre-order only</li>
            </ul>
            <div class="hero-actions">
              <a href="/shop/floral-pumpkin-centerpiece/" class="btn btn-primary btn-lg">Pre-order Now</a>
              <a href="${business.phoneHref}" class="btn btn-ghost btn-lg">Call ${business.phone}</a>
            </div>
          </div>
        </div>`).join("\n")}
      </div>
    </section>

    <section class="section gallery">
      <div class="container">
        ${sectionHead({ eyebrow: "Centerpieces & Installations", title: "More for your <em>tables.</em>" })}
        ${simpleGallery(inCategory(gallery, "Centerpieces & Installations"))}
      </div>
    </section>

    <section class="section faq-section">
      <div class="container narrow">
        ${sectionHead({ eyebrow: "Good to Know", title: "Pumpkin <em>questions.</em>" })}
        ${faqList(seasonalFaq)}
      </div>
    </section>

${bookingSection({ type: "pumpkins", title: "Pre-order your <em>pumpkins.</em>",
  intro: "Pumpkins are designed by pre-order only. Tell Tiffany how many you'd like and when you need them, and she'll confirm the details." })}`,
  });

  // ---- Everyday & sympathy --------------------------------------------------
  const everydayFaq = faqFor(faq, "Everyday");
  const courtney = byId(testimonials, "recTst04CourtnyH");
  pages.push({
    slug: "everyday", path: "/everyday-sympathy/", nav: "/everyday-sympathy/", priority: 0.8, llms: "main", heading: "Everyday & Sympathy Flowers",
    title: "Everyday & Sympathy Flowers in Kernersville, NC | Pixie Dust Floral Design",
    description: "Custom birthday, anniversary and get-well arrangements, corsages and sympathy flowers designed by Tiffany at Pixie Dust Floral Design in Kernersville, NC.",
    image: "images/service-everyday-white.jpg",
    schema: [florist, breadcrumbSchema(site, crumbs({ label: "Everyday & Sympathy", href: "/everyday-sympathy/" })), faqSchema(everydayFaq),
      serviceSchema(site, { name: "Everyday and sympathy flowers", description: svc("recSvc04Everyday").Description, path: "/everyday-sympathy/" })],
    body: html`${pageHero({
      eyebrow: "Everyday & Sympathy", title: "Flowers for every <em>moment in between.</em>",
      lede: esc(svc("recSvc04Everyday").Description),
      crumbs: crumbs({ label: "Everyday & Sympathy", href: "/everyday-sympathy/" }), image: byId(gallery, "recGal14WhiteArr"),
    })}
    <section class="section">
      <div class="container">
        <div class="occasion-grid">
          ${[
            ["Birthdays & anniversaries", "Custom arrangements built around their favorite colors and flowers."],
            ["Get well", "Something bright and fresh to brighten a hospital room or a long week at home."],
            ["Corsages for the big dance", "Wrist corsages and boutonnieres to match the dress, the suit and the night."],
            ["Sympathy", "Thoughtful, elegant pieces for a service or a family's home, designed with care."],
          ].map(([t, d]) => `<div class="occasion reveal"><h3>${t}</h3><p>${d}</p></div>`).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section gallery">
      <div class="container">
        ${sectionHead({ eyebrow: "Recent Arrangements", title: "Made with the same care <em>as a wedding.</em>" })}
        ${simpleGallery(inCategory(gallery, "Everyday & Sympathy"))}
      </div>
    </section>

    ${courtney ? html`<section class="section reviews">
      <div class="container narrow">
        <div class="review-grid review-grid-single">${reviewCard(courtney, { feature: true })}</div>
      </div>
    </section>` : ""}

    <section class="section faq-section">
      <div class="container narrow">
        ${sectionHead({ eyebrow: "Good to Know", title: "Everyday <em>questions.</em>" })}
        ${faqList([...everydayFaq, ...faq.filter((f) => /located|Where do you deliver/i.test(f.Question))])}
      </div>
    </section>

${ctaBand({ title: "Order <em>online.</em>", text: "Choose an arrangement, pick a date, and Tiffany designs it fresh for delivery or pickup.", button: "Shop Arrangements", href: "/shop/", image: byId(gallery, "recGal09BlushRos") })}

${bookingSection({ type: "everyday", title: "Something <em>custom?</em>",
  intro: "Tell Tiffany who the flowers are for, when you need them and the feel you want, or call to talk it through." })}`,
  });

  // ---- Reviews ------------------------------------------------------------
  pages.push({
    slug: "reviews", path: "/reviews/", nav: "/reviews/", priority: 0.7, llms: "main", heading: "Reviews",
    title: `Reviews: ${business.rating.value} Stars from ${business.rating.count} Google Reviews | Pixie Dust Floral Design`,
    description: `Pixie Dust Floral Design is rated ${business.rating.value} stars from ${business.rating.count} Google reviews. Read what brides and families say about working with Tiffany.`,
    image: "images/review-sarah-aisle.jpg",
    schema: [florist, breadcrumbSchema(site, crumbs({ label: "Reviews", href: "/reviews/" }))],
    body: html`${pageHero({
      eyebrow: "Reviews", title: `${business.rating.value} stars from <em>${business.rating.count} Google reviews.</em>`,
      lede: `${business.rating.fiveStar} of them five stars. Here is what brides and their families say about working with Tiffany.`,
      crumbs: crumbs({ label: "Reviews", href: "/reviews/" }),
    })}
    <section class="section reviews">
      <div class="container">
        <div class="review-grid">
          ${testimonials.map((t) => reviewCard(t)).join("\n          ")}
        </div>
        <div class="center reveal reviews-cta">
          <a href="/book/" class="btn btn-primary btn-lg">Check Your Date</a>
          <a href="${business.googleReviews}" class="link-arrow" target="_blank" rel="noopener">Read all reviews on Google</a>
        </div>
      </div>
    </section>
${ctaBand({ title: "Your day <em>could be next.</em>", text: "Tell Tiffany your date and venue and start planning flowers your guests will talk about.", image: byId(gallery, "recGal13Ceremony") })}`,
  });

  // ---- About --------------------------------------------------------------
  const aboutQuotes = testimonials.filter((t) => t["Working With Tiffany"]);
  pages.push({
    slug: "about", path: "/about/", nav: "/about/", priority: 0.7, llms: "main", heading: "About Tiffany",
    title: "About Tiffany | Pixie Dust Floral Design, Kernersville NC Florist",
    description: "Pixie Dust Floral Design is Tiffany's women-owned, home-based floral studio in Kernersville, NC. Creativity is at our core.",
    image: "images/gallery-peach-ranunculus-bouquet.jpg",
    schema: [florist, breadcrumbSchema(site, crumbs({ label: "About", href: "/about/" }))],
    body: html`${pageHero({
      eyebrow: "About", title: "Creativity is <em>at our core.</em>",
      lede: "Pixie Dust Floral Design is Tiffany's women-owned, home-based floral studio in Kernersville, North Carolina.",
      crumbs: crumbs({ label: "About", href: "/about/" }), image: byId(gallery, "recGal01PeachBqt"),
    })}
    <section class="section">
      <div class="container about-grid">
        <div class="prose reveal">
          <h2>One designer, <em>every detail.</em></h2>
          <p>Every bouquet, arch and centerpiece is designed by Tiffany herself. Couples work directly with her from the first inquiry to the moment their flowers are set in place at the venue.</p>
          <p>Her favorite flowers to work with are ranunculus, coral charm peonies, astilbe and succulents, and each fall she designs her signature flower-filled pumpkin centerpieces.</p>
          <p>Beyond weddings, the studio designs everyday arrangements, corsages and sympathy flowers with the same care.</p>
        </div>
        <div class="about-quotes">
          ${aboutQuotes.map((t) => html`<blockquote class="about-quote reveal">
            <p>&ldquo;${esc(t["Working With Tiffany"])}&rdquo;</p>
            <cite>${esc(t.Name)}</cite>
          </blockquote>`).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section visit">
      <div class="container visit-grid">
        <div class="visit-info reveal">
          <p class="eyebrow">The Studio</p>
          <h2>Visit <em>Pixie Dust.</em></h2>
          ${visitDetails()}
          <a href="/book/" class="btn btn-primary btn-lg">Check Your Date</a>
        </div>
        ${mapEmbed()}
      </div>
    </section>`,
  });

  // ---- FAQ ----------------------------------------------------------------
  pages.push({
    slug: "faq", path: "/faq/", nav: "", priority: 0.7, llms: "main", heading: "FAQ",
    title: "Wedding Florist FAQ | Pixie Dust Floral Design, Kernersville NC",
    description: "Answers about booking wedding flowers, delivery, floral budgets, pumpkin centerpieces and studio hours at Pixie Dust Floral Design in Kernersville, NC.",
    schema: [florist, breadcrumbSchema(site, crumbs({ label: "FAQ", href: "/faq/" })), faqSchema(faq)],
    body: html`${pageHero({
      eyebrow: "FAQ", title: "Frequently asked <em>questions.</em>",
      lede: "Quick answers about booking, delivery, budgets and seasonal specials. Don't see yours? Call or send an inquiry.",
      crumbs: crumbs({ label: "FAQ", href: "/faq/" }),
    })}
    <section class="section faq-section">
      <div class="container narrow">
        ${faqList(faq)}
      </div>
    </section>
${ctaBand({ title: "Still have a <em>question?</em>", text: `Call ${business.phone} or send an inquiry and Tiffany will get back to you.`, image: byId(gallery, "recGal10Sunglass") })}`,
  });

  // ---- Book / contact -------------------------------------------------------
  pages.push({
    slug: "book", path: "/book/", nav: "", priority: 0.9, llms: "main", heading: "Check Your Date",
    title: "Check Your Wedding Date | Pixie Dust Floral Design, Kernersville NC",
    description: "Send a wedding or event inquiry to Pixie Dust Floral Design. Share your date, venue, guest count and floral budget, or call (336) 310-9001.",
    schema: [florist, breadcrumbSchema(site, crumbs({ label: "Check Your Date", href: "/book/" }))],
    body: html`${pageHero({
      eyebrow: "Wedding & Event Inquiry", title: "Let's check <em>your date.</em>",
      lede: "Tell Tiffany about your day in about two minutes. She reviews every inquiry and follows up to talk flowers, availability and next steps.",
      crumbs: crumbs({ label: "Check Your Date", href: "/book/" }), actions: false,
    })}
    <section class="section booking booking-page" id="book">
      <div class="container booking-grid">
        <div class="booking-intro reveal">
          <h2>Before you <em>start.</em></h2>
          <ul class="booking-points">
            <li>Have your date and venue handy</li>
            <li>Pick the budget range that fits</li>
            <li>Share colors, flowers and the feel you want</li>
          </ul>
          ${visitDetails()}
        </div>
        ${bookingForm("wedding")}
      </div>
    </section>

    <section class="section visit visit-map-only">
      <div class="container">${mapEmbed()}</div>
    </section>`,
  });

  // ---- Service area hub + city pages ---------------------------------------
  pages.push({
    slug: "area", path: "/wedding-florist/", nav: "", priority: 0.7, llms: "city", heading: "Service area",
    title: "Wedding Florist Serving the NC Triad | Pixie Dust Floral Design",
    description: "Pixie Dust Floral Design is a Kernersville wedding florist serving couples in Kernersville, Winston-Salem, Greensboro and High Point.",
    schema: [florist, breadcrumbSchema(site, crumbs({ label: "Service Area", href: "/wedding-florist/" }))],
    body: html`${pageHero({
      eyebrow: "Service Area", title: "Wedding florist <em>for the Triad.</em>",
      lede: "Designed in Kernersville and delivered to your venue. Choose your city for venues, real weddings and answers to local questions.",
      crumbs: crumbs({ label: "Service Area", href: "/wedding-florist/" }),
    })}
    <section class="section">
      <div class="container">
        <div class="city-cards">
          ${cities.map((c) => html`<a class="city-card reveal" href="${c.path}">
            <span class="eyebrow">${esc(c.County)}</span>
            <h2>${esc(c.Name)}, NC</h2>
            <p>${esc(c.Intro)}</p>
            <span class="link-arrow">Wedding flowers in ${esc(c.Name)}</span>
          </a>`).join("\n          ")}
        </div>
      </div>
    </section>
${bookingSection({})}`,
  });

  const featuredPool = [...inCategory(gallery, "Bridal Bouquets"), ...inCategory(gallery, "Ceremony & Reception")]
    .filter((r, i, a) => a.indexOf(r) === i);

  cities.forEach((city, n) => {
    const local = gallery.filter((g) => g.City === city.Name);
    // Rotate the rest of the work so each city page shows a different set of photos
    const offset = (n * 4) % featuredPool.length;
    const rotated = [...featuredPool.slice(offset), ...featuredPool.slice(0, offset)].filter((r) => !local.includes(r));
    const hero = rotated[0];
    const shown = [...local, ...rotated.slice(1)].slice(0, 6);
    const localReviews = testimonials.filter((t) => t.City === city.Name);
    const reviews = (localReviews.length ? localReviews : []).concat(testimonials.filter((t) => !localReviews.includes(t) && /bride/i.test(t.Role))).slice(0, 2);
    const cityFaq = [...city.faq, ...faq.filter((f) => /check if my wedding date|budget/i.test(f.Question)).map((f) => ({ question: f.Question, answer: f.Answer }))];
    const trail = crumbs({ label: "Service Area", href: "/wedding-florist/" }, { label: city.Name, href: city.path });

    pages.push({
      slug: `city-${city.Slug}`, path: city.path, nav: "", priority: 0.8, llms: "city", heading: `Wedding florist in ${city.Name}, NC`,
      title: `Wedding Florist in ${city.Name}, NC | Pixie Dust Floral Design`,
      description: `Wedding flowers for ${city.Name}, NC couples: bridal bouquets, ceremony arches and centerpieces by Tiffany at Pixie Dust Floral Design${city["Miles From Studio"] ? `, about ${city["Miles From Studio"]} miles away in Kernersville` : " in Kernersville"}.`,
      image: photoOf(hero),
      schema: [florist, breadcrumbSchema(site, trail), faqSchema(cityFaq),
        serviceSchema(site, { name: `Wedding florist in ${city.Name}, NC`, description: city.Intro, path: city.path, city: city["Delivery Confirmed"] ? city.Name : null })],
      body: html`${pageHero({
        eyebrow: `${esc(city.County)} &middot; Wedding Florist`, title: `Wedding flowers in <em>${esc(city.Name)}, NC.</em>`,
        lede: esc(city.Intro), crumbs: trail, image: hero,
      })}
    <section class="section">
      <div class="container city-intro-grid">
        <div class="prose reveal">
          <h2>Florals for your <em>${esc(city.Name)} wedding.</em></h2>
          <p>${esc(city["Delivery Note"])}</p>
          <p>Bridal bouquets, ceremony arches, centerpieces and installations are all designed by Tiffany in her Kernersville studio, built around your venue, your colors and your budget.</p>
          <div class="service-links">
            <a href="/book/" class="link-arrow">Check your date</a>
            <a href="/weddings/" class="link-quiet">Wedding services</a>
          </div>
        </div>
        <div class="venue-card reveal">
          <h3>Popular wedding venues in ${esc(city.Name)}</h3>
          <ul class="venue-list">
            ${city.venues.map((v) => `<li><strong>${esc(v.name)}</strong><span>${esc(v.description)}</span></li>`).join("\n            ")}
          </ul>
          <p class="venue-note">Getting married somewhere else? Share your venue in the inquiry form.</p>
        </div>
      </div>
    </section>

    <section class="section gallery">
      <div class="container">
        ${sectionHead({ eyebrow: "Real Weddings", title: local.length && local[0].Venue ? `From ${esc(local[0].Venue)} <em>and beyond.</em>` : "Recent work <em>from the studio.</em>" })}
        ${simpleGallery(shown)}
        <div class="gallery-cta reveal"><a href="/gallery/" class="btn btn-ghost btn-lg">See the Full Gallery</a></div>
      </div>
    </section>

    <section class="section reviews">
      <div class="container">
        ${reviewsHeader({ eyebrow: "Kind Words" })}
        <div class="review-grid review-grid-pair">
          ${reviews.map((t) => reviewCard(t, { feature: false })).join("\n          ")}
        </div>
      </div>
    </section>

    <section class="section faq-section">
      <div class="container narrow">
        ${sectionHead({ eyebrow: `${esc(city.Name)} FAQ`, title: "Good <em>to know.</em>" })}
        ${faqList(cityFaq)}
      </div>
    </section>

    <section class="section area-band">
      <div class="container">
        ${sectionHead({ eyebrow: "Also Serving", title: "Elsewhere <em>in the Triad.</em>" })}
        ${cityLinks(cities, city.Slug)}
      </div>
    </section>

${bookingSection({ title: `Planning a <em>${esc(city.Name)}</em> wedding?` })}`,
    });
  });

  // ---- 404 -----------------------------------------------------------------
  pages.push({
    slug: "not-found", path: "/404.html", nav: "", noindex: true, heading: "Not found",
    title: "Page Not Found | Pixie Dust Floral Design",
    description: "This page could not be found.",
    schema: [],
    body: html`${pageHero({
      eyebrow: "Page Not Found", title: "This bloom <em>has wandered off.</em>",
      lede: "The page you were looking for isn't here. Try the gallery, or check your wedding date with Tiffany.",
    })}`,
  });

  return pages;
}

function photoOf(record) {
  return record && record.Photo && record.Photo[0] ? record.Photo[0].url : undefined;
}
