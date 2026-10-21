// Pixie Dust Floral Design: cart, product options and checkout.
// Prices and rules come from /data/shop-catalog.json (built from the Products, Delivery Zones
// and Shop Settings tables) and the shared rules in /assets/shop-rules.mjs, the same file the
// checkout function uses on the server.
import { priceOrder, earliestDate, dateProblem, zoneFor, priceFor, formatMoney, storeToday } from "/assets/shop-rules.mjs";

const CART_KEY = "pixie-cart-v1";
const LAST_ORDER_KEY = "pixie-last-order-v1";

// ---- Storage (wrapped: private windows can block it) ------------------------
function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function writeJSON(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* cart just won't persist */ }
}
const getCart = () => readJSON(CART_KEY, []);
const saveCart = (lines) => { writeJSON(CART_KEY, lines); updateBadge(); };

let catalogPromise = null;
function loadCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch("/data/shop-catalog.json", { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error("Could not load the shop menu");
      return r.json();
    });
  }
  return catalogPromise;
}

const el = (tag, attrs = {}, children = []) => {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (v === undefined || v === null || v === false) return;
    if (k === "text") node.textContent = v;
    else if (k === "className") node.className = v;
    else node.setAttribute(k, v === true ? "" : v);
  });
  children.filter(Boolean).forEach((c) => node.appendChild(typeof c === "string" ? document.createTextNode(c) : c));
  return node;
};

function prettyDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

const newId = () => (window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2));

// ---- Header badge + drawer ------------------------------------------------
function updateBadge() {
  const count = getCart().reduce((n, l) => n + (Number(l.qty) || 0), 0);
  document.querySelectorAll("[data-cart-count]").forEach((b) => {
    b.textContent = String(count);
    b.hidden = count === 0;
  });
  document.querySelectorAll("[data-cart-open]").forEach((btn) => btn.setAttribute("aria-label", `Cart, ${count} item${count === 1 ? "" : "s"}`));
}

function lineSummary(item, catalog, { editable }) {
  const product = catalog.products.find((p) => p.slug === item.slug);
  const where = item.fulfillment === "Delivery"
    ? `Delivery ${prettyDate(item.date)} to ${item.recipient?.name || "recipient"}, ${item.address?.city || ""}`
    : `Pickup ${prettyDate(item.date)}`;
  return el("li", { className: "cart-line" }, [
    product && product.image ? el("img", { src: product.image, alt: "", width: "72", height: "88", loading: "lazy" }) : null,
    el("div", { className: "cart-line-body" }, [
      el("p", { className: "cart-line-name", text: `${item.name} · ${item.size}` }),
      el("p", { className: "cart-line-meta", text: where }),
      item.cardMessage ? el("p", { className: "cart-line-meta", text: `Card: “${item.cardMessage}”` }) : null,
      editable ? el("div", { className: "cart-line-actions" }, [
        el("label", { className: "qty-label" }, ["Qty ", el("input", { type: "number", min: "1", max: "20", value: String(item.qty), "data-qty": item.id, "aria-label": `Quantity of ${item.name}` })]),
        el("button", { type: "button", className: "link-quiet", "data-remove": item.id, text: "Remove" }),
      ]) : el("p", { className: "cart-line-meta", text: `Qty ${item.qty}` }),
    ]),
    el("p", { className: "cart-line-price", text: formatMoney(item.lineTotal) }),
  ]);
}

function totalsBlock(order) {
  return el("dl", { className: "cart-totals" }, [
    el("div", {}, [el("dt", { text: "Subtotal" }), el("dd", { text: formatMoney(order.subtotal) })]),
    ...order.deliveries.map((d) => el("div", {}, [el("dt", { text: `Delivery · ${d.zone} · ${prettyDate(d.date)}` }), el("dd", { text: formatMoney(d.fee) })])),
    el("div", { className: "cart-total" }, [el("dt", { text: "Total" }), el("dd", { text: formatMoney(order.total) })]),
  ]);
}

async function renderDrawer() {
  const body = document.querySelector("[data-cart-body]");
  const foot = document.querySelector("[data-cart-foot]");
  if (!body) return;
  body.replaceChildren();
  foot.replaceChildren();

  const cart = getCart();
  if (!cart.length) {
    body.appendChild(el("div", { className: "cart-empty" }, [
      el("p", { text: "Your cart is empty." }),
      el("a", { href: "/shop/", className: "btn btn-primary", text: "Shop Flowers" }),
    ]));
    return;
  }

  const catalog = await loadCatalog();
  const order = priceOrder(catalog, cart);
  body.appendChild(el("ul", { className: "cart-lines" }, order.items.map((i) => lineSummary(i, catalog, { editable: true }))));
  if (order.errors.length) body.appendChild(el("div", { className: "order-errors" }, order.errors.map((e) => el("p", { text: e }))));
  foot.appendChild(totalsBlock(order));
  if (catalog.previewMode) foot.appendChild(el("p", { className: "cart-note", text: "Shop preview: sample prices, no payment taken." }));
  foot.appendChild(el("a", { href: "/shop/checkout/", className: "btn btn-primary btn-lg btn-block", text: "Checkout" }));
}

function initDrawer() {
  const drawer = document.getElementById("cart-drawer");
  if (!drawer || typeof drawer.showModal !== "function") return;

  document.querySelectorAll("[data-cart-open]").forEach((btn) => btn.addEventListener("click", (e) => {
    e.preventDefault();
    renderDrawer();
    drawer.showModal();
  }));
  drawer.querySelector(".cart-close").addEventListener("click", () => drawer.close());
  drawer.addEventListener("click", (e) => { if (e.target === drawer) drawer.close(); });

  drawer.addEventListener("click", (e) => {
    const remove = e.target.closest("[data-remove]");
    if (!remove) return;
    saveCart(getCart().filter((l) => l.id !== remove.getAttribute("data-remove")));
    renderDrawer();
  });
  drawer.addEventListener("change", (e) => {
    const input = e.target.closest("[data-qty]");
    if (!input) return;
    const qty = Math.min(20, Math.max(1, parseInt(input.value, 10) || 1));
    saveCart(getCart().map((l) => (l.id === input.getAttribute("data-qty") ? { ...l, qty } : l)));
    renderDrawer();
  });

  window.pixieOpenCart = () => { renderDrawer(); drawer.showModal(); };
}

// ---- Product page ---------------------------------------------------------
async function initProductForm() {
  const form = document.getElementById("order-form");
  if (!form) return;
  const catalog = await loadCatalog();
  const product = catalog.products.find((p) => p.slug === form.getAttribute("data-product"));
  if (!product) return;

  const dateInput = form.elements.date;
  dateInput.min = earliestDate(catalog, product);
  dateInput.value = dateInput.min;

  const deliveryFields = form.querySelector("[data-delivery-fields]");
  const pickupNote = form.querySelector("[data-pickup-note]");
  const zipResult = form.querySelector("[data-zip-result]");
  const errorsBox = form.querySelector("[data-order-errors]");
  const dateError = dateInput.closest(".field").querySelector(".field-error");

  const fulfillment = () => (form.querySelector('input[name="fulfillment"]:checked') || {}).value;
  const size = () => (form.querySelector('input[name="size"]:checked') || {}).value;

  function refresh() {
    const isDelivery = fulfillment() === "Delivery";
    deliveryFields.hidden = !isDelivery;
    pickupNote.hidden = isDelivery;

    const qty = Math.max(1, parseInt(form.elements.qty.value, 10) || 1);
    const unit = priceFor(product, size()) || 0;
    form.querySelector("[data-price]").textContent = formatMoney(unit);
    form.querySelector("[data-total]").textContent = formatMoney(unit * qty);
    form.querySelector("[data-card-count]").textContent = String(form.elements.cardMessage.value.length);

    const zip = form.elements.zip.value.trim();
    if (!isDelivery || zip.length < 5) zipResult.textContent = "";
    else {
      const zone = zoneFor(catalog, zip);
      zipResult.textContent = zone
        ? `Delivers to ${zone.name} · ${formatMoney(zone.fee)} delivery${zone.feeConfirmed ? "" : " (sample fee)"}`
        : "Outside the delivery area. Call (336) 310-9001 and Tiffany will see what she can do.";
      zipResult.classList.toggle("zip-bad", !zone);
    }
  }

  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  dateInput.addEventListener("change", () => { dateError.textContent = dateProblem(catalog, product, dateInput.value); });
  refresh();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = form.elements;
    const line = {
      id: newId(),
      slug: product.slug,
      size: size(),
      qty: parseInt(f.qty.value, 10),
      fulfillment: fulfillment(),
      date: f.date.value,
      recipient: { name: f.recipientName.value.trim(), phone: f.recipientPhone.value.trim() },
      address: { street: f.street.value.trim(), city: f.city.value.trim(), zip: f.zip.value.trim() },
      cardMessage: f.cardMessage.value.trim(),
      instructions: f.instructions.value.trim(),
    };
    if (line.fulfillment === "Pickup") { line.recipient = {}; line.address = {}; }

    const check = priceOrder(catalog, [line]);
    errorsBox.replaceChildren(...check.errors.map((msg) => {
      const text = msg.replace(`${product.name}: `, "");
      return el("p", { text: text.charAt(0).toUpperCase() + text.slice(1) });
    }));
    errorsBox.hidden = check.ok;
    if (!check.ok) { errorsBox.scrollIntoView({ behavior: "smooth", block: "center" }); return; }

    saveCart([...getCart(), line]);
    form.reset();
    dateInput.value = dateInput.min;
    refresh();
    if (window.pixieOpenCart) window.pixieOpenCart();
  });
}

// ---- Checkout ---------------------------------------------------------------
async function initCheckout() {
  const form = document.getElementById("checkout-form");
  const summary = document.getElementById("checkout-summary");
  if (!form || !summary) return;
  const catalog = await loadCatalog();
  const errorsBox = form.querySelector("[data-checkout-errors]");

  function renderSummary() {
    summary.replaceChildren();
    const cart = getCart();
    if (!cart.length) {
      summary.appendChild(el("div", { className: "cart-empty" }, [el("p", { text: "Your cart is empty." }), el("a", { href: "/shop/", className: "btn btn-primary", text: "Shop Flowers" })]));
      form.hidden = true;
      return null;
    }
    const order = priceOrder(catalog, cart);
    summary.appendChild(el("h2", { text: "Your order" }));
    summary.appendChild(el("ul", { className: "cart-lines" }, order.items.map((i) => lineSummary(i, catalog, { editable: false }))));
    summary.appendChild(totalsBlock(order));
    if (!catalog.collectSalesTax) summary.appendChild(el("p", { className: "cart-note", text: "Sales tax, if any, is confirmed at payment." }));
    summary.appendChild(el("button", { type: "button", className: "link-quiet", "data-edit-cart": "", text: "Edit cart" }));
    if (order.errors.length) summary.appendChild(el("div", { className: "order-errors" }, order.errors.map((e) => el("p", { text: e }))));
    return order;
  }
  let order = renderSummary();
  summary.addEventListener("click", (e) => {
    if (e.target.closest("[data-edit-cart]") && window.pixieOpenCart) window.pixieOpenCart();
  });
  document.getElementById("cart-drawer")?.addEventListener("close", () => { order = renderSummary(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = form.elements;
    const customer = { name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim() };
    const problems = [];
    if (!customer.name) problems.push("Please add your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) problems.push("Please add a valid email.");
    if (customer.phone.replace(/\D/g, "").length < 10) problems.push("Please add a phone number.");
    if (!f.agree.checked) problems.push("Please confirm you've read the ordering policies.");
    order = renderSummary();
    if (order && !order.ok) problems.push("Please fix the items in your cart.");
    errorsBox.replaceChildren(...problems.map((p) => el("p", { text: p })));
    errorsBox.hidden = problems.length === 0;
    if (problems.length || !order) return;

    const button = form.querySelector("[data-pay-button]");
    button.disabled = true;
    button.textContent = "Placing your order…";

    let result;
    try {
      const res = await fetch("/.netlify/functions/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: getCart(), customer }),
      });
      result = await res.json();
      if (!res.ok) throw new Error((result.errors || [result.error || "Checkout failed"]).join(" "));
    } catch (err) {
      // Previewing without the function (e.g. a local file server): finish the demo in the browser
      if (catalog.previewMode && !result) {
        result = { mode: "preview", order: { ...order, number: "PD-PREVIEW", customer, placedAt: storeToday() } };
      } else {
        errorsBox.replaceChildren(el("p", { text: err.message || "Something went wrong. Please call (336) 310-9001." }));
        errorsBox.hidden = false;
        button.disabled = false;
        button.textContent = catalog.previewMode ? "Place Preview Order" : "Continue to Secure Payment";
        return;
      }
    }

    writeJSON(LAST_ORDER_KEY, { ...result.order, mode: result.mode });
    if (result.url) {
      window.location.href = result.url; // Stripe hosted checkout
    } else {
      saveCart([]);
      window.location.href = "/shop/order-confirmed/";
    }
  });
}

// ---- Confirmation -------------------------------------------------------------
async function initConfirmation() {
  const box = document.getElementById("order-confirmed");
  if (!box) return;
  const order = readJSON(LAST_ORDER_KEY, null);
  if (new URLSearchParams(location.search).get("session_id")) saveCart([]); // returned from Stripe
  if (!order) return;
  const catalog = await loadCatalog();
  const lede = box.querySelector("[data-confirm-lede]");
  lede.textContent = order.mode === "preview"
    ? `Preview order ${order.number} placed. In live mode this is where ${order.customer?.name?.split(" ")[0] || "the customer"} lands after paying, and Tiffany receives the order in Airtable.`
    : `Order ${order.number} is in. A receipt is on its way to ${order.customer?.email || "your email"}.`;
  const target = box.querySelector("[data-confirm-summary]");
  target.appendChild(el("ul", { className: "cart-lines" }, order.items.map((i) => lineSummary(i, catalog, { editable: false }))));
  target.appendChild(totalsBlock(order));
}

updateBadge();
initDrawer();
initProductForm();
initCheckout();
initConfirmation();
