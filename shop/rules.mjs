// Order rules shared by the browser (cart and checkout) and the Netlify checkout function.
// The function re-runs priceOrder() on the server, so prices, dates and delivery fees can
// never be changed from the browser.

const STORE_TIMEZONE = "America/New_York";
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export const MAX_QTY = 20;

// Today's date at the studio, as YYYY-MM-DD
export function storeToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: STORE_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export function addDays(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

function weekday(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

function isOpen(catalog, iso) {
  return !catalog.closedWeekdays.includes(weekday(iso)) && !catalog.blackoutDates.includes(iso);
}

export function leadDaysFor(catalog, product) {
  return Math.max(catalog.leadDays, product.leadDays || 0);
}

// First date this product can be delivered or picked up
export function earliestDate(catalog, product, today = storeToday()) {
  let iso = addDays(today, leadDaysFor(catalog, product));
  for (let i = 0; i < 30 && !isOpen(catalog, iso); i++) iso = addDays(iso, 1);
  return iso;
}

export function dateProblem(catalog, product, iso, today = storeToday()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return "Please choose a date.";
  if (iso < earliestDate(catalog, product, today)) {
    const days = leadDaysFor(catalog, product);
    return `Please choose a date at least ${days} day${days === 1 ? "" : "s"} from today.`;
  }
  if (iso > addDays(today, 365)) return "Please choose a date within the next year.";
  if (catalog.closedWeekdays.includes(weekday(iso))) return `The studio is closed on ${WEEKDAYS[weekday(iso)]}s. Please choose another day.`;
  if (catalog.blackoutDates.includes(iso)) return "That date is fully booked. Please choose another day.";
  if (product.seasonStart && iso < product.seasonStart) return "This item is not available yet on that date.";
  if (product.seasonEnd && iso > product.seasonEnd) return "This item's season has ended for that date.";
  return "";
}

export function zoneFor(catalog, zip) {
  const clean = String(zip || "").trim().slice(0, 5);
  return catalog.zones.find((z) => z.zips.includes(clean)) || null;
}

export function priceFor(product, sizeName) {
  const size = product.sizes.find((s) => s.name === sizeName);
  return size ? size.price : null;
}

const money = (n) => Math.round(n * 100) / 100;

// Validates and prices a cart. Returns every problem found so the UI can show them all.
export function priceOrder(catalog, lines, today = storeToday()) {
  const errors = [];
  const items = [];
  const deliveries = new Map();

  if (!Array.isArray(lines) || lines.length === 0) errors.push("Your cart is empty.");

  (lines || []).forEach((line, i) => {
    const label = `Item ${i + 1}`;
    const product = catalog.products.find((p) => p.slug === line.slug);
    if (!product) { errors.push(`${label}: this item is no longer available.`); return; }

    const unitPrice = priceFor(product, line.size);
    if (unitPrice === null) errors.push(`${product.name}: please choose a size.`);

    const qty = Number(line.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) errors.push(`${product.name}: quantity must be between 1 and ${MAX_QTY}.`);

    const fulfillment = line.fulfillment;
    if (!product.fulfillment.includes(fulfillment) || (fulfillment === "Pickup" && !catalog.pickupEnabled)) {
      errors.push(`${product.name}: ${String(fulfillment || "that option").toLowerCase()} is not available for this item.`);
    }

    const dateMsg = dateProblem(catalog, product, line.date, today);
    if (dateMsg) errors.push(`${product.name}: ${dateMsg}`);

    if ((line.cardMessage || "").length > catalog.cardMessageLimit) {
      errors.push(`${product.name}: card message must be ${catalog.cardMessageLimit} characters or fewer.`);
    }

    if (fulfillment === "Delivery") {
      const a = line.address || {};
      const r = line.recipient || {};
      if (!r.name) errors.push(`${product.name}: please add the recipient's name.`);
      if (!a.street || !a.city) errors.push(`${product.name}: please add the delivery address.`);
      const zone = zoneFor(catalog, a.zip);
      if (!zone) {
        errors.push(`${product.name}: we don't deliver to ZIP code ${a.zip || "(blank)"} yet. Call (336) 310-9001 and Tiffany will see what she can do.`);
      } else {
        // One delivery fee per stop: same date and same address
        const key = [line.date, a.zip, String(a.street || "").trim().toLowerCase()].join("|");
        if (!deliveries.has(key)) deliveries.set(key, { key, date: line.date, zone: zone.name, fee: zone.fee, address: a, recipient: r.name });
      }
    }

    if (unitPrice !== null && Number.isInteger(qty)) {
      items.push({ ...line, qty, name: product.name, unitPrice, lineTotal: money(unitPrice * qty), priceConfirmed: product.priceConfirmed });
    }
  });

  const subtotal = money(items.reduce((s, i) => s + i.lineTotal, 0));
  const deliveryList = [...deliveries.values()];
  const deliveryTotal = money(deliveryList.reduce((s, d) => s + d.fee, 0));
  return { ok: errors.length === 0, errors, items, deliveries: deliveryList, subtotal, deliveryTotal, total: money(subtotal + deliveryTotal) };
}

export function formatMoney(n) {
  return "$" + (Number.isInteger(n) ? n : n.toFixed(2));
}
