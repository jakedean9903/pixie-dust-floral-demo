// POST /.netlify/functions/create-checkout
// Re-prices the cart on the server from the published catalog, then either:
//   - Preview Mode (Shop Settings) or no STRIPE_SECRET_KEY: returns a preview order, charges nothing
//   - Live: creates a Stripe Checkout session and returns its URL
// The full order rides along in the session metadata so stripe-webhook can save it after payment.
import { priceOrder } from "../../shop/rules.mjs";

const json = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const cents = (n) => Math.round(n * 100);

// Stripe metadata values max out at 500 characters, so long orders are split across keys
function chunkMetadata(text, prefix = "order_", size = 480) {
  const out = {};
  for (let i = 0; i * size < text.length; i++) out[`${prefix}${i}`] = text.slice(i * size, (i + 1) * size);
  return out;
}

function form(params, prefix = "", out = new URLSearchParams()) {
  Object.entries(params).forEach(([key, value]) => {
    const name = prefix ? `${prefix}[${key}]` : key;
    if (value === undefined || value === null) return;
    if (typeof value === "object") form(value, name, out);
    else out.append(name, String(value));
  });
  return out;
}

export default async (req) => {
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  let body;
  try { body = await req.json(); } catch { return json(400, { error: "Invalid request" }); }
  const customer = body.customer || {};
  if (!customer.name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email || "")) {
    return json(400, { errors: ["Please add your name and a valid email."] });
  }

  const origin = new URL(req.url).origin;
  const catalogRes = await fetch(`${origin}/data/shop-catalog.json`);
  if (!catalogRes.ok) return json(500, { error: "Could not load the shop menu" });
  const catalog = await catalogRes.json();

  const order = priceOrder(catalog, body.lines);
  if (!order.ok) return json(400, { errors: order.errors });

  const number = "PD-" + Date.now().toString(36).toUpperCase();
  const fullOrder = { ...order, number, customer, placedAt: new Date().toISOString() };

  const secret = process.env.STRIPE_SECRET_KEY;
  if (catalog.previewMode) return json(200, { mode: "preview", order: fullOrder });
  if (!secret) return json(503, { error: "Online payments aren't switched on yet. Please call (336) 310-9001 to order." });

  const lineItems = [
    ...order.items.map((i) => ({
      quantity: i.qty,
      price_data: { currency: "usd", unit_amount: cents(i.unitPrice), product_data: { name: `${i.name} (${i.size})`, description: `${i.fulfillment} on ${i.date}` } },
    })),
    ...order.deliveries.map((d) => ({
      quantity: 1,
      price_data: { currency: "usd", unit_amount: cents(d.fee), product_data: { name: `Delivery: ${d.zone}`, description: `${d.date}, ${d.address.street}, ${d.address.city}` } },
    })),
  ];

  const stored = {
    number, customer,
    items: order.items.map((i) => ({ slug: i.slug, name: i.name, size: i.size, qty: i.qty, unitPrice: i.unitPrice, fulfillment: i.fulfillment, date: i.date, recipient: i.recipient, address: i.address, cardMessage: i.cardMessage, instructions: i.instructions })),
    subtotal: order.subtotal, deliveryTotal: order.deliveryTotal, total: order.total,
  };

  const params = {
    mode: "payment",
    customer_email: customer.email,
    success_url: `${origin}/shop/order-confirmed/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/shop/checkout/`,
    line_items: lineItems,
    metadata: { order_number: number, customer_name: customer.name, customer_phone: customer.phone || "", ...chunkMetadata(JSON.stringify(stored)) },
    ...(catalog.collectSalesTax ? { automatic_tax: { enabled: true } } : {}),
  };

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form(params),
  });
  const session = await res.json();
  if (!res.ok) {
    console.error("Stripe error", session);
    return json(502, { error: "Payment could not be started. Please call (336) 310-9001 to order." });
  }
  return json(200, { mode: "stripe", url: session.url, order: fullOrder });
};
