import { neon } from "@neondatabase/serverless";
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const json = (res, status, data) => { res.status(status).setHeader("Content-Type", "application/json; charset=utf-8"); res.setHeader("Cache-Control", "no-store"); return res.end(JSON.stringify(data)); };
export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow", "POST"); return json(res, 405, { error: "Method not allowed." }); }
  const allowed = new Set(["https://unsent-flame.vercel.app", process.env.SITE_ORIGIN].filter(Boolean));
  if (req.headers.origin && !allowed.has(req.headers.origin)) return json(res, 403, { error: "Origin not allowed." });
  if (Number(req.headers["content-length"] || 0) > 24000) return json(res, 413, { error: "Request too large." });
  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch { return json(res, 400, { error: "Invalid request." }); } }
  if (!b || typeof b !== "object" || Array.isArray(b)) return json(res, 400, { error: "Invalid request." });
  if (String(b.website || "").trim()) return json(res, 200, { ok: true });
  const letter = typeof b.letter === "string" ? b.letter.trim() : "";
  const sender = typeof b.senderEmail === "string" ? b.senderEmail.trim().toLowerCase() : "";
  const delivery = ["online", "physical"].includes(b.delivery) ? b.delivery : "";
  const recipient = typeof b.recipientName === "string" ? b.recipientName.trim().slice(0,160) : "";
  const recipientEmail = typeof b.recipientEmail === "string" ? b.recipientEmail.trim().toLowerCase().slice(0,254) : "";
  const address = typeof b.recipientAddress === "string" ? b.recipientAddress.trim().slice(0,500) : "";
  const city = typeof b.recipientCity === "string" ? b.recipientCity.trim().slice(0,160) : "";
  const postal = typeof b.postalCode === "string" ? b.postalCode.trim().slice(0,32) : "";
  if (!letter || letter.length > 12000 || !emailPattern.test(sender) || !recipient || !delivery || b.consent !== true) return json(res, 400, { error: "Check the letter, sender email, recipient, delivery, and consent." });
  if (delivery === "online" && !emailPattern.test(recipientEmail)) return json(res, 400, { error: "Enter a valid recipient email." });
  if (delivery === "physical" && (!address || !city || !postal)) return json(res, 400, { error: "Complete the physical delivery address." });
  if (!process.env.DATABASE_URL || !process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) return json(res, 503, { error: "Letter submission is not fully configured yet." });
  try {
    const sql = neon(process.env.DATABASE_URL);
    await sql.query("CREATE TABLE IF NOT EXISTS unsent_letters (id text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now(), letter text NOT NULL, sender_email text NOT NULL, delivery text NOT NULL CHECK (delivery IN ('online','physical')), recipient_name text NOT NULL, recipient_email text, recipient_address text, recipient_city text, postal_code text, anonymous boolean NOT NULL DEFAULT true)");
    const id = crypto.randomUUID();
    await sql.query("INSERT INTO unsent_letters (id, letter, sender_email, delivery, recipient_name, recipient_email, recipient_address, recipient_city, postal_code, anonymous) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)", [id, letter, sender, delivery, recipient, delivery === "online" ? recipientEmail : null, delivery === "physical" ? address : null, delivery === "physical" ? city : null, delivery === "physical" ? postal : null, b.anonymous === true]);
    const mail = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [sender], subject: "We received your letter — UNSENT", text: "Hello,\n\nWe received your UNSENT letter request (" + id + ").\nDelivery type: " + (delivery === "online" ? "Online" : "Physical") + ".\nWe will contact you at this email if we need anything else.\n\nFor privacy, this confirmation does not include the contents of your letter.\n\nUNSENT" }) });
    if (!mail.ok) { console.error("Resend response status", mail.status); return json(res, 202, { ok: true, emailSent: false, message: "Your letter was saved, but we could not send the confirmation email." }); }
    return json(res, 201, { ok: true, emailSent: true, message: "Your letter was saved. A confirmation email is on its way." });
  } catch (e) { console.error("Submission failed", e?.message || "unknown error"); return json(res, 500, { error: "We could not save your letter right now. Please try again later." }); }
}
