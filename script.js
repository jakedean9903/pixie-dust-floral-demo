// Pixie Dust Floral Design | concept site by Dupuis Designs
(function () {
  "use strict";

  document.documentElement.classList.add("js");

  document.addEventListener("DOMContentLoaded", function () {
    initNav();
    initReveal();
    initGallery();
    initInquiryForm();
    initMobileCta();

    var year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
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

  // ---- Gallery lightbox --------------------------------------------------
  function initGallery() {
    var buttons = Array.prototype.slice.call(document.querySelectorAll(".gallery-open"));
    var dialog = document.getElementById("lightbox");
    if (!buttons.length || !dialog || typeof dialog.showModal !== "function") return;

    var figure = dialog.querySelector("figure");
    var caption = dialog.querySelector("figcaption");
    var img = document.createElement("img");
    figure.insertBefore(img, caption);
    var current = 0;

    function show(index) {
      current = (index + buttons.length) % buttons.length;
      var thumb = buttons[current].querySelector("img");
      img.src = thumb.getAttribute("src");
      img.alt = thumb.alt;
      caption.textContent = buttons[current].parentElement.querySelector("figcaption").textContent;
    }

    buttons.forEach(function (btn, i) {
      btn.addEventListener("click", function () {
        show(i);
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
    dialog.addEventListener("close", function () { buttons[current].focus(); });

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

    function fieldFor(el) { return el.closest(".field"); }

    function setError(name, message) {
      var el = form.elements[name];
      var input = el.length && !el.tagName ? el[0] : el;
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
      var el = form.elements[name];
      var inputs = el.length && !el.tagName ? Array.prototype.slice.call(el) : [el];
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
        var el = form.elements[firstInvalid];
        (el.length && !el.tagName ? el[0] : el).focus();
        return;
      }

      var data = Object.fromEntries(new FormData(form).entries());

      // GO-LIVE: send the inquiry to email / CRM here instead of only showing the
      // success message. For example, with Formspree:
      //
      //   fetch("https://formspree.io/f/YOUR_FORM_ID", {
      //     method: "POST",
      //     headers: { "Content-Type": "application/json", "Accept": "application/json" },
      //     body: JSON.stringify(data)
      //   }).then(showSuccess);
      //
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
