// Pixie Dust Floral Design — concept site by Dupuis Designs
document.addEventListener("DOMContentLoaded", function () {
  // Mobile nav
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("mainNav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
      });
    });
  }

  // Inquiry form: demo success state (wire to email/CRM when the site goes live)
  var form = document.getElementById("inquiryForm");
  var success = document.getElementById("formSuccess");
  if (form && success) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      success.hidden = false;
      success.scrollIntoView({ behavior: "smooth", block: "center" });
      form.querySelector("button[type=submit]").textContent = "Inquiry Sent ✓";
    });
  }
});
