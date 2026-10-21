// Pixie Dust Floral Design | concept site by Dupuis Designs
(function () {
  "use strict";

  // AIRTABLE: all services, gallery, specials and testimonials content comes from this one
  // file, which uses the Airtable REST API shape ({ records: [{ id, fields }] } per table).
  // To go live, point CONTENT_URL at a Netlify function (e.g. "/.netlify/functions/site-content")
  // that reads the Gallery, Specials, Testimonials and Services tables with AIRTABLE_PAT /
  // AIRTABLE_BASE_ID from Netlify env vars and returns the same shape. Nothing else in this
  // file needs to change. This demo deliberately uses the local file only: no API key here.
  var CONTENT_URL = "data/site-content.json";

  document.documentElement.classList.add("js");

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveal();
    initInquiryForm();
    initMobileCta();

    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();

    loadContent();
  });

  // ---- Content (Airtable-shaped data) -------------------------------------
  function loadContent() {
    fetch(CONTENT_URL, { cache: "no-cache" })
      .then(function (res) {
        if (!res.ok) throw new Error("Content request failed: " + res.status);
        return res.json();
      })
      .then(function (data) {
        var categories = (data._schema && data._schema.categories) || [];
        var specials = records(data, "Specials");

        renderServices(records(data, "Services"), specials);
        renderBanner(records(data, "Testimonials"));
        renderTestimonials(records(data, "Testimonials"));
        renderGallery(records(data, "Gallery"), specials, categories);
      })
      .catch(function (err) {
        console.error(err);
        showContentFallback();
      });
  }

  // Flatten a table to its visible records, sorted the way Tiffany ordered them in Airtable
  function records(data, table) {
    var list = (data[table] && data[table].records) || [];
    return list
      .map(function (r) { return Object.assign({ id: r.id }, r.fields); })
      .filter(function (r) { return r["Show on Website"] !== false; })
      .sort(function (a, b) { return (a["Sort Order"] || 0) - (b["Sort Order"] || 0); });
  }

  function photoOf(record) {
    return record.Photo && record.Photo[0];
  }

  // Small DOM helper. Text always goes in through textContent so content from Airtable
  // can never inject markup into the page.
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (key) {
      var value = attrs[key];
      if (value === undefined || value === null || value === false) return;
      if (key === "text") node.textContent = value;
      else if (key === "className") node.className = value;
      else node.setAttribute(key, value === true ? "" : value);
    });
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }

  function img(record, lazy) {
    var photo = photoOf(record);
    if (!photo) return null;
    return el("img", {
      src: photo.url,
      width: photo.width,
      height: photo.height,
      alt: record["Alt Text"] || "",
      loading: lazy === false ? null : "lazy",
      decoding: "async"
    });
  }

  function slugify(text) {
    return text.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function specialLabel(special) {
    return special.Badge + (special["Price From"] ? " from $" + special["Price From"] : "");
  }

  function showContentFallback() {
    var status = document.getElementById("gallery-status");
    if (status) {
      status.textContent = "";
      status.appendChild(document.createTextNode("See Tiffany's latest work on "));
      status.appendChild(el("a", { href: "https://www.instagram.com/pixiedustflorals/", target: "_blank", rel: "noopener", text: "Instagram @pixiedustflorals" }));
      status.appendChild(document.createTextNode("."));
    }
    ["service-grid", "review-grid", "gallery-filters"].forEach(function (id) {
      var node = document.getElementById(id);
      if (node) node.hidden = true;
    });
  }

  // ---- Services -------------------------------------------------------------
  function renderServices(services, specials) {
    var grid = document.getElementById("service-grid");
    if (!grid) return;

    services.forEach(function (service) {
      var special = (service["Featured Special"] || [])
        .map(function (id) { return specials.find(function (s) { return s.id === id; }); })
        .filter(Boolean)[0];

      var media = el("div", { className: "service-img" }, [
        img(service),
        special ? el("span", { className: "price-tag", text: specialLabel(special) }) : null
      ]);

      var seeWork = el("button", {
        type: "button",
        className: "link-quiet",
        "data-filter": slugify(service["Gallery Category"]),
        text: "See the work"
      });

      var body = el("div", { className: "service-body" }, [
        el("h3", { text: service.Name }),
        el("p", { text: service.Description }),
        el("div", { className: "service-links" }, [
          el("a", { href: "#book", className: "link-arrow", text: service["CTA Label"] }),
          seeWork
        ])
      ]);

      grid.appendChild(el("article", { className: "service-card reveal" }, [media, body]));
    });

    // "See the work" jumps to the gallery already filtered to that service
    grid.addEventListener("click", function (e) {
      var btn = e.target.closest("[data-filter]");
      if (!btn || !window.pixieGallery) return;
      window.pixieGallery.setFilter(btn.getAttribute("data-filter"));
      document.getElementById("gallery").scrollIntoView({ behavior: "smooth" });
    });

    observeReveals(grid);
  }

  // ---- Testimonials -------------------------------------------------------
  function stars(n) {
    return el("div", { className: "review-stars", "aria-label": n + " out of 5 stars", text: new Array(n + 1).join("★") });
  }

  function renderBanner(testimonials) {
    var quote = document.getElementById("banner-quote");
    var t = testimonials.find(function (r) { return r["Show in Banner"]; });
    if (!quote || !t) return;
    quote.appendChild(el("p", { text: "“" + (t["Pull Quote"] || t.Quote) + "”" }));
    quote.appendChild(el("cite", { text: t.Name + ", " + t.Role.toLowerCase() }));
  }

  function renderTestimonials(testimonials) {
    var grid = document.getElementById("review-grid");
    if (!grid) return;

    testimonials.forEach(function (t) {
      var hasPhoto = !!photoOf(t);
      var className = "review-card reveal" + (t.Featured ? " review-card-feature" : "") + (hasPhoto ? " review-card-photo" : "");
      var role = t.Role === t.Source || /·/.test(t.Role) ? t.Role : t.Role + " · " + t.Source;

      var content = [
        stars(t.Rating || 5),
        el("blockquote", {}, [el("p", { text: "“" + t.Quote + "”" })]),
        el("figcaption", {}, [el("strong", { text: t.Name }), el("span", { text: role })])
      ];

      var card = hasPhoto
        ? el("figure", { className: className }, [img(t), el("div", { className: "review-card-inner" }, content)])
        : el("figure", { className: className }, content);

      grid.appendChild(card);
    });

    observeReveals(grid);
  }

  // ---- Gallery: category filters + lightbox ------------------------------
  function renderGallery(gallery, specials, categoryOrder) {
    var grid = document.getElementById("gallery-grid");
    var filterBar = document.getElementById("gallery-filters");
    var status = document.getElementById("gallery-status");
    if (!grid || !filterBar) return;

    // Specials sit first so a current seasonal offer is the first thing brides see
    var items = specials.map(function (s) { return { type: "special", record: s }; })
      .concat(gallery.map(function (g) { return { type: "photo", record: g }; }));

    // Category list comes from the data (schema order first, then anything new in records)
    var categories = categoryOrder.slice();
    items.forEach(function (item) {
      (item.record.Categories || []).forEach(function (c) {
        if (categories.indexOf(c) === -1) categories.push(c);
      });
    });

    var cards = items.map(function (item) {
      var card = item.type === "special" ? specialCard(item.record) : photoCard(item.record);
      card.setAttribute("data-categories", (item.record.Categories || []).map(slugify).join(" "));
      grid.appendChild(card);
      return card;
    });

    // Filter buttons, each with a live count
    var buttons = [{ slug: "all", label: "All Work", count: cards.length }].concat(
      categories.map(function (c) {
        var slug = slugify(c);
        return { slug: slug, label: c, count: cards.filter(function (card) { return hasCategory(card, slug); }).length };
      }).filter(function (b) { return b.count > 0; })
    ).map(function (b) {
      var btn = el("button", { type: "button", className: "filter-btn", "data-filter": b.slug, "aria-pressed": "false" }, [
        el("span", { text: b.label }),
        el("span", { className: "filter-count", text: String(b.count) })
      ]);
      btn._label = b.label;
      filterBar.appendChild(btn);
      return btn;
    });

    function hasCategory(card, slug) {
      return (" " + card.getAttribute("data-categories") + " ").indexOf(" " + slug + " ") !== -1;
    }

    function setFilter(slug, opts) {
      var active = buttons.find(function (b) { return b.getAttribute("data-filter") === slug; }) || buttons[0];
      slug = active.getAttribute("data-filter");

      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === active)); });

      var shown = 0;
      cards.forEach(function (card) {
        var match = slug === "all" || hasCategory(card, slug);
        card.hidden = !match;
        card.classList.remove("is-entering");
        if (match) {
          shown++;
          void card.offsetWidth; // restart the fade-in
          card.classList.add("is-entering");
        }
      });

      status.textContent = slug === "all"
        ? "Showing all " + shown + " pieces"
        : "Showing " + shown + (shown === 1 ? " piece" : " pieces") + " in " + active._label;

      // Keep the choice in the URL (no reload) so a filtered gallery can be shared
      if (!(opts && opts.silent) && window.history && history.replaceState) {
        var url = new URL(window.location.href);
        if (slug === "all") url.searchParams.delete("category");
        else url.searchParams.set("category", slug);
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    }

    filterBar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (btn) setFilter(btn.getAttribute("data-filter"));
    });

    var initial = new URLSearchParams(window.location.search).get("category") || "all";
    setFilter(initial, { silent: true });

    window.pixieGallery = { setFilter: setFilter };
    initLightbox(grid, cards);
  }

  function photoCard(record) {
    var caption = el("figcaption", { text: record.Caption || record.Title }, [
      record["Photo Credit"] ? el("span", { className: "photo-credit", text: " · Photo: " + record["Photo Credit"] }) : null
    ]);
    return el("figure", { className: "gallery-item" }, [
      el("button", { type: "button", className: "gallery-open", "aria-label": "View larger: " + (record.Caption || record.Title) }, [img(record)]),
      caption
    ]);
  }

  function specialCard(record) {
    var meta = [record.Season, record.Availability].filter(Boolean).join(" · ");
    return el("figure", { className: "gallery-item special-card" }, [
      el("button", { type: "button", className: "gallery-open", "aria-label": "View larger: " + record.Name }, [
        img(record),
        el("span", { className: "special-flag", text: "Seasonal Special" })
      ]),
      el("figcaption", { className: "special-body", text: "" }, [
        el("p", { className: "special-meta", text: meta }),
        el("h3", { text: record.Name }),
        el("p", { text: record.Description }),
        el("div", { className: "special-footer" }, [
          record["Price From"] ? el("span", { className: "special-price", text: "From $" + record["Price From"] }) : null,
          el("a", { href: "#book", className: "btn btn-primary", text: "Pre-order" })
        ])
      ])
    ]);
  }

  function initLightbox(grid, cards) {
    var dialog = document.getElementById("lightbox");
    if (!dialog || typeof dialog.showModal !== "function") return;

    var figure = dialog.querySelector("figure");
    var caption = dialog.querySelector("figcaption");
    var image = document.createElement("img");
    var visible = [];
    var current = 0;

    function show(index) {
      if (!image.parentNode) figure.insertBefore(image, caption);
      current = (index + visible.length) % visible.length;
      var card = visible[current];
      var thumb = card.querySelector(".gallery-open img");
      var title = card.querySelector(".special-body h3");
      image.src = thumb.getAttribute("src");
      image.alt = thumb.alt;
      caption.textContent = title ? title.textContent : card.querySelector("figcaption").textContent;
    }

    grid.addEventListener("click", function (e) {
      var btn = e.target.closest(".gallery-open");
      if (!btn) return;
      visible = cards.filter(function (c) { return !c.hidden; });
      show(visible.indexOf(btn.closest(".gallery-item")));
      dialog.showModal();
    });

    dialog.querySelector(".lightbox-close").addEventListener("click", function () { dialog.close(); });
    dialog.querySelector(".lightbox-prev").addEventListener("click", function () { show(current - 1); });
    dialog.querySelector(".lightbox-next").addEventListener("click", function () { show(current + 1); });
    dialog.addEventListener("click", function (e) {
      if (e.target === dialog || e.target === figure) dialog.close();
    });
    dialog.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") show(current - 1);
      if (e.key === "ArrowRight") show(current + 1);
    });
    dialog.addEventListener("close", function () {
      var btn = visible[current] && visible[current].querySelector(".gallery-open");
      if (btn) btn.focus();
    });

    // Swipe between photos on phones
    var startX = null;
    dialog.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
    dialog.addEventListener("touchend", function (e) {
      if (startX === null) return;
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) show(dx < 0 ? current + 1 : current - 1);
      startX = null;
    });
  }

  // ---- Sticky header + mobile menu ---------------------------------------
  function initNav() {
    var header = document.querySelector(".site-header");
    var toggle = document.querySelector(".nav-toggle");
    var menu = document.getElementById("nav-menu");

    function onScroll() {
      header.classList.toggle("is-scrolled", window.scrollY > 10);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    function setOpen(open) {
      menu.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }

    toggle.addEventListener("click", function () {
      setOpen(!menu.classList.contains("is-open"));
    });
    menu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () { setOpen(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // ---- Fade sections in as they scroll into view -------------------------
  var revealObserver = null;

  function initReveal() {
    if ("IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    }
    observeReveals(document);
  }

  function observeReveals(root) {
    root.querySelectorAll(".reveal:not(.is-visible)").forEach(function (node) {
      if (revealObserver) revealObserver.observe(node);
      else node.classList.add("is-visible");
    });
  }

  // ---- Wedding inquiry form ----------------------------------------------
  function initInquiryForm() {
    var form = document.getElementById("inquiry-form");
    var success = document.getElementById("form-success");
    if (!form || !success) return;

    var dateInput = form.querySelector("#date");
    dateInput.min = toISODate(new Date());

    var messages = {
      name: "Please tell us your name.",
      email: "Please enter a valid email so Tiffany can reply.",
      phone: "Please enter a phone number we can reach you at.",
      date: "Please choose your wedding or event date.",
      venue: "Please add your venue or the city you're celebrating in.",
      guests: "Please add an estimated guest count.",
      budget: "Please choose a floral budget range.",
      vision: "Tell us a little about your vision: colors, flowers, the feel."
    };

    function fieldFor(node) { return node.closest(".field"); }

    function setError(name, message) {
      var node = form.elements[name];
      var input = node.length && !node.tagName ? node[0] : node;
      var field = fieldFor(input);
      field.classList.toggle("has-error", !!message);
      field.querySelector(".field-error").textContent = message || "";
      if (input.setAttribute) input.setAttribute("aria-invalid", message ? "true" : "false");
    }

    function validate(name) {
      var value = (form.elements[name].value || "").trim();
      var message = "";
      if (!value) message = messages[name];
      else if (name === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = messages.email;
      else if (name === "phone" && value.replace(/\D/g, "").length < 10) message = messages.phone;
      else if (name === "guests" && !(Number(value) > 0)) message = messages.guests;
      else if (name === "date" && value < dateInput.min) message = "Please choose a date in the future.";
      setError(name, message);
      return !message;
    }

    // Re-check a field as soon as the visitor fixes it
    Object.keys(messages).forEach(function (name) {
      var node = form.elements[name];
      var inputs = node.length && !node.tagName ? Array.prototype.slice.call(node) : [node];
      inputs.forEach(function (input) {
        input.addEventListener("change", function () { validate(name); });
        input.addEventListener("input", function () {
          if (fieldFor(input).classList.contains("has-error")) validate(name);
        });
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var firstInvalid = null;
      Object.keys(messages).forEach(function (name) {
        if (!validate(name) && !firstInvalid) firstInvalid = name;
      });
      if (firstInvalid) {
        var node = form.elements[firstInvalid];
        (node.length && !node.tagName ? node[0] : node).focus();
        return;
      }

      var data = Object.fromEntries(new FormData(form).entries());

      // GO-LIVE: send the inquiry to email / CRM here instead of only showing the
      // success message. On Netlify the simplest option is Netlify Forms (add
      // data-netlify="true" and a name to the <form>, then POST the fields here).
      // Or post `data` to Tiffany's HoneyBook inquiry form / a Zapier webhook so each
      // lead (with its budget range) lands straight in her CRM pipeline.

      showSuccess(data);
    });

    function showSuccess(data) {
      document.getElementById("success-name").textContent = data.name.split(" ")[0];
      document.getElementById("success-date").textContent = formatDate(data.date);
      form.hidden = true;
      success.hidden = false;
      success.focus();
      success.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function toISODate(d) {
    var tz = d.getTimezoneOffset() * 60000;
    return new Date(d - tz).toISOString().slice(0, 10);
  }

  function formatDate(iso) {
    var parts = iso.split("-");
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }

  // ---- Mobile "Check Your Date" bar --------------------------------------
  function initMobileCta() {
    var bar = document.querySelector(".mobile-cta");
    var hero = document.querySelector(".hero");
    var booking = document.getElementById("book");
    if (!bar || !hero || !booking || !("IntersectionObserver" in window)) return;

    var heroVisible = true;
    var bookingVisible = false;
    function update() { bar.classList.toggle("is-visible", !heroVisible && !bookingVisible); }

    new IntersectionObserver(function (entries) {
      heroVisible = entries[0].isIntersecting; update();
    }).observe(hero);
    new IntersectionObserver(function (entries) {
      bookingVisible = entries[0].isIntersecting; update();
    }, { threshold: 0.15 }).observe(booking);
  }
})();
