// POST /.netlify/functions/stripe-webhook (set as the endpoint in Stripe > Developers > Webhooks)
// On checkout.session.completed, verifies Stripe's signature, rebuilds the order from the session
// metadata and saves one row per item to the Airtable "Orders" table. An Airtable automation on
// that table can then email or text Tiffany each new order.
// Inactive until STRIPE_WEBHOOK_SECRET is set; Airtable saving also needs AIRTABLE_PAT and
// AIRTABLE_BASE_ID. Without Airtable, orders are written to the Netlify function log.
import crypto from "node:crypto";

const ok = () => new Response("ok", { status: 200 });

function verify(raw, header, secret, toleranceSeconds = 300) {
  const parts = Object.fromEntries(String(header || "").split(",").map((p) => p.split("=")));
  if (!parts.t || !parts.v1) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > toleranceSeconds) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${raw}`).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(parts.v1);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function readOrder(metadata) {
  const chunks = Object.keys(metadata).filter((k) => /^order_\d+$/.test(k))
    .sort((x, y) => Number(x.slice(6)) - Number(y.slice(6)))
    .map((k) => metadata[k]);
  return JSON.parse(chunks.join(""));
}

async function saveToAirtable(order, session) {
  const pat = process.env.AIRTABLE_PAT;
  const base = process.env.AIRTABLE_BASE_ID;
  if (!pat || !base) {
    console.log("New order (Airtable not connected):", JSON.stringify(order));
    return;
  }
  const records = order.items.map((i) => ({
    fields: {
      "Order Number": order.number,
      Status: "Paid",
      "Customer Name": order.customer.name,
      "Customer Email": order.customer.email,
      "Customer Phone": order.customer.phone || "",
      Items: `${i.qty} x ${i.name} (${i.size})`,
      "Fulfillment Date": i.date,
      Fulfillment: i.fulfillment,
      Recipient: i.recipient?.name || "",
      "Recipient Phone": i.recipient?.phone || "",
      Address: i.fulfillment === "Delivery" ? `${i.address.street}, ${i.address.city} ${i.address.zip}` : "Pickup",
      "Card Message": i.cardMessage || "",
      Instructions: i.instructions || "",
      Subtotal: i.unitPrice * i.qty,
      "Delivery Fee": order.deliveryTotal,
      Total: (session.amount_total || 0) / 100,
      "Stripe Session": session.id,
    },
  }));
  // Airtable accepts up to 10 records per request
  for (let i = 0; i < records.length; i += 10) {
    const res = await fetch(`https://api.airtable.com/v0/${base}/Orders`, {
      method: "POST",
      headers: { Authorization: `Bearer ${pat}`, "Content-Type": "application/json" },
      body: JSON.stringify({ records: records.slice(i, i + 10), typecast: true }),
    });
    if (!res.ok) throw new Error(`Airtable error ${res.status}: ${await res.text()}`);
  }
}

export default async (req) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook not configured", { status: 503 });

  const raw = await req.text();
  if (!verify(raw, req.headers.get("stripe-signature"), secret)) return new Response("Bad signature", { status: 400 });

  const event = JSON.parse(raw);
  if (event.type !== "checkout.session.completed") return ok();

  const session = event.data.object;
  try {
    await saveToAirtable(readOrder(session.metadata || {}), session);
  } catch (err) {
    console.error(err);
    return new Response("Could not save order", { status: 500 }); // Stripe retries automatically
  }
  return ok();
};
