"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Calculator, ArrowRight, CheckCircle, Percent, Truck, FileText } from "lucide-react";
import { formatINR } from "@/lib/format";
import { FREIGHT_FLAT, GST_RATE } from "@/lib/constants";

export default function QuoteCalculator() {
  const router = useRouter();
  const [quantity, setQuantity] = useState(250);
  const [basePrice, setBasePrice] = useState(480);
  const [grade, setGrade] = useState("Industrial High Purity");

  let discountRate = 0;
  if (quantity >= 1000) discountRate = 0.15;
  else if (quantity >= 500) discountRate = 0.10;
  else if (quantity >= 100) discountRate = 0.05;

  const rawSubtotal = quantity * basePrice;
  const discountAmount = rawSubtotal * discountRate;
  const discountedSubtotal = rawSubtotal - discountAmount;
  const freight = quantity > 0 ? FREIGHT_FLAT : 0;
  const gst = (discountedSubtotal + freight) * GST_RATE;
  const estimatedTotal = discountedSubtotal + freight + gst;

  function goToContact() {
    const qs = new URLSearchParams({
      type: "Bulk Purchase Quote",
      product: grade,
      qty: String(quantity),
      estimate: String(Math.round(estimatedTotal)),
    });
    router.push(`/contact?${qs}`);
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-6 text-ink shadow-card md:p-10">
      <div className="relative z-10 grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-xs font-medium text-ink">
            <Calculator className="h-4 w-4 text-brand" /> Bulk Pricing Calculator
          </div>

          <div>
            <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
              Estimate Your Bulk Order
            </h3>
            <p className="mt-2 text-sm text-ink-mute">
              Adjust volume to see tier discounts, GST breakdown, and freight.
            </p>
          </div>

          <div className="space-y-5 rounded-2xl border border-line bg-bg p-5 sm:p-6">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="text-xs font-medium text-ink-mute">Order Quantity (kg)</label>
                <span className="rounded-full bg-brand/10 px-3 py-0.5 text-lg font-bold text-brand">{quantity} kg</span>
              </div>
              <input
                type="range"
                min={25}
                max={2000}
                step={25}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-brand"
              />
              <div className="mt-2 flex justify-between font-mono text-[10px] text-ink-dim">
                <span>25 kg</span>
                <span>100+ (5%)</span>
                <span>500+ (10%)</span>
                <span>1000+ (15%)</span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-ink-mute">Grade</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "Technical Grade", price: 380 },
                  { name: "Industrial High Purity", price: 480 },
                  { name: "Lab / Analytical", price: 650 },
                ].map((g) => (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => { setGrade(g.name); setBasePrice(g.price); }}
                    className={`rounded-full border px-3 py-2 text-center text-xs font-medium transition ${
                      grade === g.name
                        ? "border-brand bg-brand text-brand-ink"
                        : "border-line bg-surface text-ink-mute hover:border-line-hi hover:text-ink"
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between space-y-6 rounded-2xl border border-line bg-forest p-6 text-on-dark sm:p-8 lg:col-span-5">
          <div>
            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-white/70">Estimate</span>
              {discountRate > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                  <Percent className="h-3 w-3" /> {(discountRate * 100).toFixed(0)}% Off
                </span>
              )}
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between text-white/75">
                <span>Base ({quantity} kg × ₹{basePrice})</span>
                <span>{formatINR(rawSubtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between font-medium text-sage-light">
                  <span>Discount ({discountRate * 100}%)</span>
                  <span>-{formatINR(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-white/75">
                <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Freight</span>
                <span>{formatINR(freight)}</span>
              </div>
              <div className="flex justify-between text-white/75">
                <span>GST (18%)</span>
                <span>{formatINR(gst)}</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-white/15 pt-4">
                <div>
                  <span className="block text-xs font-medium text-white/70">Estimated Total</span>
                  <span className="text-2xl font-bold text-white sm:text-3xl">{formatINR(estimatedTotal)}</span>
                </div>
                <span className="text-right text-[11px] text-white/60">Incl. GST & Shipping</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button type="button" onClick={goToContact} className="vj-btn vj-btn-accent flex w-full items-center justify-center gap-2 py-3.5 px-6">
              <FileText className="h-4 w-4" /> Request Proforma Quote <ArrowRight className="h-4 w-4" />
            </button>
            <p className="flex items-center justify-center gap-1 text-center text-[11px] text-white/70">
              <CheckCircle className="h-3 w-3" /> Continue on Contact to send your inquiry
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
