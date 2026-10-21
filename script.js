// Pixie Dust Floral Design | concept site by Dupuis Designs
// Every page is pre-rendered by build/build.mjs from data/site-content.json; this file only
// adds behavior: menu, scroll reveals, gallery filters + lightbox, and the inquiry form.
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveal();
    initGalleryFilters();
    initLightbox();
    initInquiryForm();
    initMobileCta();
  });

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
  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (el) { el.classList.add("is-visible"); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { observer.observe(el); });
  }

  // ---- Gallery category filters (no page reload) -------------------------
  function initGalleryFilters() {
    var bar = document.getElementById("gallery-filters");
    var grid = document.getElementById("gallery-grid");
    var status = document.getElementById("gallery-status");
    if (!bar || !grid) return;

    var buttons = Array.prototype.slice.call(bar.querySelectorAll(".filter-btn"));
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".gallery-item"));

    function hasCategory(card, slug) {
      return (" " + card.getAttribute("data-categories") + " ").indexOf(" " + slug + " ") !== -1;
    }

    function setFilter(slug, silent) {
      var active = buttons.filter(function (b) { return b.getAttribute("data-filter") === slug; })[0] || buttons[0];
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

      var label = active.querySelector("span").textContent;
      status.textContent = slug === "all"
        ? "Showing all " + shown + " pieces"
        : "Showing " + shown + (shown === 1 ? " piece" : " pieces") + " in " + label;

      // Keep the choice in the URL so a filtered gallery can be shared
      if (!silent && window.history && history.replaceState) {
        var url = new URL(window.location.href);
        if (slug === "all") url.searchParams.delete("category");
        else url.searchParams.set("category", slug);
        history.replaceState(null, "", url.pathname + url.search + url.hash);
      }
    }

    bar.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter-btn");
      if (btn) setFilter(btn.getAttribute("data-filter"));
    });

    var initial = new URLSearchParams(window.location.search).get("category");
    if (initial) setFilter(initial, true);
  }

  // ---- Lightbox for any gallery on the page ------------------------------
  function initLightbox() {
    var grids = document.querySelectorAll(".gallery-grid");
    var dialog = document.getElementById("lightbox");
    if (!grids.length || !dialog || typeof dialog.showModal !== "function") return;

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

    Array.prototype.forEach.call(grids, function (grid) {
      grid.addEventListener("click", function (e) {
        var btn = e.target.closest(".gallery-open");
        if (!btn) return;
        visible = Array.prototype.filter.call(grid.querySelectorAll(".gallery-item"), function (c) { return !c.hidden; });
        show(visible.indexOf(btn.closest(".gallery-item")));
        dialog.showModal();
      });
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

  // ---- Inquiry form ------------------------------------------------------
  function initInquiryForm() {
    var form = document.getElementById("inquiry-form");
    var success = document.getElementById("form-success");
    if (!form || !success) return;

    var typeSelect = form.elements.type;
    var dateInput = form.querySelector("#date");
    dateInput.min = toISODate(new Date());

    // ?type=pumpkins (etc.) preselects what the visitor is planning
    var requested = new URLSearchParams(window.location.search).get("type");
    if (requested && typeSelect.querySelector('option[value="' + requested + '"]')) typeSelect.value = requested;

    function isWedding() {
      return typeSelect.value === "wedding" || typeSelect.value === "event";
    }

    // Guest count and budget only apply to weddings and events
    function applyType() {
      var wedding = isWedding();
      form.querySelectorAll("[data-wedding-only]").forEach(function (field) {
        field.hidden = !wedding;
        field.querySelectorAll("input").forEach(function (input) {
          if (input.type !== "radio" || input === field.querySelector("input")) input.required = wedding;
        });
        if (!wedding) {
          field.classList.remove("has-error");
          var err = field.querySelector(".field-error");
          if (err) err.textContent = "";
        }
      });
      form.querySelectorAll("[data-label-wedding]").forEach(function (label) {
        label.textContent = label.getAttribute(wedding ? "data-label-wedding" : "data-label-other");
      });
      form.querySelectorAll("[data-placeholder-wedding]").forEach(function (input) {
        input.placeholder = input.getAttribute(wedding ? "data-placeholder-wedding" : "data-placeholder-other");
      });
      form.querySelector("button[type=submit]").textContent = wedding ? "Check My Date" : "Send My Inquiry";
    }
    typeSelect.addEventListener("change", applyType);
    applyType();

    var messages = {
      name: "Please tell us your name.",
      email: "Please enter a valid email so Tiffany can reply.",
      phone: "Please enter a phone number we can reach you at.",
      date: "Please choose the date you need flowers.",
      venue: "Please add your venue or the city you're celebrating in.",
      guests: "Please add an estimated guest count.",
      budget: "Please choose a floral budget range.",
      vision: "Tell us a little about what you'd like: colors, flowers, the feel."
    };

    function fieldFor(node) { return node.closest(".field"); }

    function activeFields() {
      return Object.keys(messages).filter(function (name) {
        return isWedding() || (name !== "guests" && name !== "budget");
      });
    }

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
      activeFields().forEach(function (name) {
        if (!validate(name) && !firstInvalid) firstInvalid = name;
      });
      if (firstInvalid) {
        var node = form.elements[firstInvalid];
        (node.length && !node.tagName ? node[0] : node).focus();
        return;
      }

      var data = Object.fromEntries(new FormData(form).entries());
      data.page = window.location.pathname;

      // GO-LIVE: send the inquiry to email / CRM here instead of only showing the
      // success message. On Netlify the simplest option is Netlify Forms (add
      // data-netlify="true" and a name to the <form>, then POST the fields here).
      // Or post `data` to Tiffany's HoneyBook inquiry form / a Zapier webhook so each
      // lead (with its type, budget range and source page) lands straight in her CRM.

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
  // Shows once the first screen is scrolled past, and hides while a booking form is on screen.
  function initMobileCta() {
    var bar = document.querySelector(".mobile-cta");
    var top = document.querySelector(".hero, .page-hero");
    var booking = document.getElementById("book");
    if (!bar || !top || !("IntersectionObserver" in window)) return;

    var topVisible = true;
    var bookingVisible = false;
    function update() { bar.classList.toggle("is-visible", !topVisible && !bookingVisible); }

    new IntersectionObserver(function (entries) {
      topVisible = entries[0].isIntersecting; update();
    }).observe(top);
    if (booking) {
      new IntersectionObserver(function (entries) {
        bookingVisible = entries[0].isIntersecting; update();
      }, { threshold: 0.15 }).observe(booking);
    }
  }
})();
