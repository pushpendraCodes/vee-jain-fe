import { BRAND } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import type { Order, PaymentMethod } from "@/types";

export const SELLER = {
  name: BRAND,
  address: "Plot No. 45, GIDC Industrial Estate, Phase 2, Vatva, Ahmedabad 382445, Gujarat, India",
  phone: "+91 79 2583 1200",
  email: "sales@veejaindyes.com",
};

export function paymentMethodLabel(method?: PaymentMethod | string) {
  const map: Record<string, string> = {
    razorpay: "Razorpay",
    upi: "UPI",
    netbanking: "Net banking",
    rtgs: "RTGS / NEFT",
    card: "Card",
  };
  return map[String(method || "")] || String(method || "—");
}

export function isPaidOrder(order: Order) {
  return (
    order.paymentStatus === "captured" ||
    ["paid", "processing", "shipped", "delivered"].includes(order.status)
  );
}

export function invoiceTitle(order: Order) {
  return isPaidOrder(order) ? "Tax Invoice" : "Proforma Invoice";
}

export function formatInvoiceDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigitWords(n: number) {
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const one = n % 10;
  return `${TENS[ten]}${one ? ` ${ONES[one]}` : ""}`.trim();
}

function chunkWords(n: number, suffix: string) {
  if (!n) return "";
  return `${twoDigitWords(n)} ${suffix}`.trim();
}

export function amountInWordsINR(amount: number) {
  const safe = Math.max(0, Number(amount) || 0);
  const rupees = Math.floor(safe);
  const paise = Math.round((safe - rupees) * 100);

  if (!rupees && !paise) return "Zero Rupees Only";

  const crore = Math.floor(rupees / 1_00_00_000);
  const lakh = Math.floor((rupees % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((rupees % 1_00_000) / 1000);
  const hundred = Math.floor((rupees % 1000) / 100);
  const rest = rupees % 100;

  const parts = [
    chunkWords(crore, "Crore"),
    chunkWords(lakh, "Lakh"),
    chunkWords(thousand, "Thousand"),
    hundred ? `${ONES[hundred]} Hundred` : "",
    twoDigitWords(rest),
  ].filter(Boolean);

  let text = parts.join(" ").replace(/\s+/g, " ").trim();
  text = `${text || "Zero"} Rupees`;
  if (paise) text += ` and ${twoDigitWords(paise)} Paise`;
  return `${text} Only`;
}

function billToLines(order: Order) {
  const a = order.address;
  if (!a) return ["Buyer"];
  return [
    a.name,
    a.line1,
    a.line2,
    [a.city, a.state, a.pincode].filter(Boolean).join(", "),
    a.phone ? `Phone: +91 ${a.phone}` : "",
    a.gstin ? `GSTIN: ${a.gstin}` : "",
  ].filter(Boolean);
}

export function buildInvoiceHtml(order: Order) {
  const title = invoiceTitle(order);
  const items = order.items || [];
  const rows = items
    .map(
      (item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            ${item.sku ? `<div class="muted">SKU: ${escapeHtml(item.sku)}</div>` : ""}
          </td>
          <td class="num">${escapeHtml(item.quantity)}</td>
          <td class="num">${escapeHtml(formatINR(item.price))}</td>
          <td class="num">${escapeHtml(formatINR(item.price * item.quantity))}</td>
        </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice-${escapeHtml(order.id)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; font-family: "Segoe UI", Arial, sans-serif; color: #1a2b1e; background: #fff; }
    .sheet { max-width: 800px; margin: 0 auto; border: 1px solid #d9d3cc; padding: 28px 32px; }
    .top { display: flex; justify-content: space-between; gap: 24px; border-bottom: 3px solid #2b3a2e; padding-bottom: 18px; }
    .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .muted { color: #5a6b5c; font-size: 12px; line-height: 1.5; }
    .badge { display: inline-block; background: #2b3a2e; color: #faf8f5; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; padding: 6px 10px; border-radius: 999px; }
    h1 { margin: 18px 0 6px; font-size: 20px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 18px 0 22px; }
    .box { background: #faf8f5; border: 1px solid #ece7e1; padding: 14px 16px; border-radius: 12px; }
    .box h2 { margin: 0 0 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #d4854a; }
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: #5a6b5c; border-bottom: 1px solid #d9d3cc; padding: 8px 6px; }
    td { padding: 10px 6px; border-bottom: 1px solid #eee; font-size: 13px; vertical-align: top; }
    .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .totals { width: 280px; margin-left: auto; margin-top: 16px; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .totals .grand { border-top: 2px solid #2b3a2e; margin-top: 6px; padding-top: 10px; font-size: 16px; font-weight: 700; }
    .words { margin-top: 18px; font-size: 12px; background: #f2ede7; padding: 12px 14px; border-radius: 10px; }
    .foot { margin-top: 28px; display: flex; justify-content: space-between; gap: 24px; font-size: 11px; color: #5a6b5c; }
    .sign { text-align: right; }
    .sign .line { margin-top: 42px; border-top: 1px solid #cfc8bf; display: inline-block; padding-top: 6px; min-width: 180px; }
    @media print { body { padding: 0; } .sheet { border: none; } }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="brand">${escapeHtml(SELLER.name)}</div>
        <div class="muted">${escapeHtml(SELLER.address)}<br/>${escapeHtml(SELLER.phone)} · ${escapeHtml(SELLER.email)}</div>
      </div>
      <div style="text-align:right">
        <span class="badge">${escapeHtml(title)}</span>
        <div class="muted" style="margin-top:10px">Invoice No.<br/><strong style="color:#1a2b1e;font-size:14px">${escapeHtml(order.id)}</strong></div>
        <div class="muted" style="margin-top:8px">Date<br/><strong style="color:#1a2b1e">${escapeHtml(formatInvoiceDate(order.createdAt))}</strong></div>
      </div>
    </div>
    <div class="meta">
      <div class="box">
        <h2>Bill from</h2>
        <div><strong>${escapeHtml(SELLER.name)}</strong></div>
        <div class="muted">${escapeHtml(SELLER.address)}</div>
      </div>
      <div class="box">
        <h2>Bill to</h2>
        ${billToLines(order).map((line, i) => (i === 0 ? `<div><strong>${escapeHtml(line)}</strong></div>` : `<div class="muted">${escapeHtml(line)}</div>`)).join("")}
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:40px">#</th>
          <th>Description</th>
          <th class="num" style="width:70px">Qty</th>
          <th class="num" style="width:110px">Rate</th>
          <th class="num" style="width:120px">Amount</th>
        </tr>
      </thead>
      <tbody>${rows || `<tr><td colspan="5">No items</td></tr>`}</tbody>
    </table>
    <div class="totals">
      <div><span>Subtotal</span><span>${escapeHtml(formatINR(order.subtotal))}</span></div>
      ${Number(order.discount) > 0 ? `<div><span>${escapeHtml(order.offerTitle || "Offer")}</span><span>-${escapeHtml(formatINR(order.discount))}</span></div>` : ""}
      <div><span>Freight</span><span>${escapeHtml(formatINR(order.freight))}</span></div>
      <div><span>GST (18%)</span><span>${escapeHtml(formatINR(order.gst))}</span></div>
      <div class="grand"><span>Total</span><span>${escapeHtml(formatINR(order.total))}</span></div>
    </div>
    <div class="words"><strong>Amount in words:</strong> ${escapeHtml(amountInWordsINR(order.total))}</div>
    <div class="foot">
      <div>
        Payment: ${escapeHtml(paymentMethodLabel(order.paymentMethod))} · ${escapeHtml((order.paymentStatus || "pending").toUpperCase())}<br/>
        This is a computer-generated invoice.
      </div>
      <div class="sign">
        For ${escapeHtml(SELLER.name)}
        <div class="line">Authorised signatory</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function downloadInvoice(order: Order) {
  const html = buildInvoiceHtml(order);
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Invoice-${order.id}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function printInvoice(order: Order) {
  const html = buildInvoiceHtml(order);
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    downloadInvoice(order);
    frame.remove();
    return;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const cleanup = () => frame.remove();
  frame.contentWindow?.addEventListener("afterprint", cleanup);
  setTimeout(() => {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
    setTimeout(cleanup, 1500);
  }, 300);
}
