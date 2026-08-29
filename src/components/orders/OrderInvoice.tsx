"use client";

import { Download, Printer } from "lucide-react";
import { formatINR } from "@/lib/format";
import {
  SELLER,
  amountInWordsINR,
  downloadInvoice,
  formatInvoiceDate,
  invoiceTitle,
  paymentMethodLabel,
  printInvoice,
} from "@/lib/invoice";
import type { Order } from "@/types";

export default function OrderInvoice({ order }: { order: Order }) {
  const title = invoiceTitle(order);
  const address = order.address;

  return (
    <section className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-hairline px-5 py-4 sm:px-6">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Invoice</p>
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => printInvoice(order)} className="vj-btn vj-btn-ghost h-10 px-4 text-sm">
            <Printer className="h-4 w-4" /> Print / PDF
          </button>
          <button type="button" onClick={() => downloadInvoice(order)} className="vj-btn vj-btn-primary h-10 px-4 text-sm">
            <Download className="h-4 w-4" /> Download
          </button>
        </div>
      </div>

      <div className="px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-forest pb-4">
          <div>
            <p className="font-display text-xl font-bold text-text-primary">{SELLER.name}</p>
            <p className="mt-1 max-w-md text-sm leading-relaxed text-text-secondary">{SELLER.address}</p>
            <p className="mt-1 text-sm text-text-secondary">
              {SELLER.phone} · {SELLER.email}
            </p>
          </div>
          <div className="text-right text-sm">
            <span className="rounded-full bg-forest px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-on-dark">
              {title}
            </span>
            <p className="mt-3 text-[11px] uppercase tracking-wider text-text-secondary">Invoice no.</p>
            <p className="font-mono font-semibold text-text-primary">{order.id}</p>
            <p className="mt-2 text-[11px] uppercase tracking-wider text-text-secondary">Date</p>
            <p className="font-medium text-text-primary">{formatInvoiceDate(order.createdAt)}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-ivory p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Bill from</p>
            <p className="mt-1 text-sm font-semibold text-text-primary">{SELLER.name}</p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{SELLER.address}</p>
          </div>
          <div className="rounded-2xl bg-ivory p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">Bill to</p>
            {address ? (
              <div className="mt-1 text-sm leading-relaxed text-text-secondary">
                <p className="font-semibold text-text-primary">{address.name || "Buyer"}</p>
                <p>{address.line1}</p>
                {address.line2 ? <p>{address.line2}</p> : null}
                <p>{[address.city, address.state, address.pincode].filter(Boolean).join(", ")}</p>
                {address.phone ? <p>Phone: +91 {address.phone}</p> : null}
                {address.gstin ? <p className="font-mono text-xs">GSTIN {address.gstin}</p> : null}
              </div>
            ) : (
              <p className="mt-1 text-sm text-text-secondary">No billing address</p>
            )}
          </div>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-hairline text-[11px] uppercase tracking-wider text-text-secondary">
                <th className="py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-2 font-medium">Description</th>
                <th className="py-2 pr-2 text-right font-medium">Qty</th>
                <th className="py-2 pr-2 text-right font-medium">Rate</th>
                <th className="py-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(order.items || []).map((item, i) => (
                <tr key={`${item.productId || item.sku}-${i}`} className="border-b border-border-hairline">
                  <td className="py-3 pr-2 text-text-secondary">{i + 1}</td>
                  <td className="py-3 pr-2">
                    <p className="font-medium text-text-primary">{item.name}</p>
                    {item.sku ? <p className="font-mono text-[10px] text-text-secondary">SKU: {item.sku}</p> : null}
                  </td>
                  <td className="py-3 pr-2 text-right tabular-nums">{item.quantity}</td>
                  <td className="py-3 pr-2 text-right tabular-nums">{formatINR(item.price)}</td>
                  <td className="py-3 text-right font-medium tabular-nums text-text-primary">
                    {formatINR(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 ml-auto w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between text-text-secondary">
            <span>Subtotal</span>
            <span className="tabular-nums text-text-primary">{formatINR(order.subtotal)}</span>
          </div>
          {Number(order.discount) > 0 ? (
            <div className="flex justify-between text-text-secondary">
              <span>{order.offerTitle || "Offer"}</span>
              <span className="tabular-nums text-text-primary">-{formatINR(Number(order.discount) || 0)}</span>
            </div>
          ) : null}
          <div className="flex justify-between text-text-secondary">
            <span>Freight</span>
            <span className="tabular-nums text-text-primary">{formatINR(order.freight)}</span>
          </div>
          <div className="flex justify-between text-text-secondary">
            <span>GST (18%)</span>
            <span className="tabular-nums text-text-primary">{formatINR(order.gst)}</span>
          </div>
          <div className="flex justify-between border-t border-forest pt-3 text-base font-semibold text-text-primary">
            <span>Total</span>
            <span className="tabular-nums">{formatINR(order.total)}</span>
          </div>
        </div>

        <p className="mt-5 rounded-2xl bg-cream px-4 py-3 text-xs leading-relaxed text-text-secondary">
          <span className="font-semibold text-text-primary">Amount in words: </span>
          {amountInWordsINR(order.total)}
        </p>
        <p className="mt-3 text-[11px] text-text-secondary">
          Payment: {paymentMethodLabel(order.paymentMethod)} · {(order.paymentStatus || "pending").toUpperCase()}. This is a computer-generated invoice.
        </p>
      </div>
    </section>
  );
}
