"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, ShoppingBag, CheckCircle, ShieldCheck, Download, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cartAdd } from "@/lib/cartActions";
import { useToast } from "@/components/ui/Toast";
import { unitPriceForQty } from "@/lib/pricing";
import type { Product } from "@/types";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const { showToast } = useToast();

  if (!product) return null;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await cartAdd(product.id, qty);
      showToast(`Added ${qty} ${product.unit} of ${product.name} to your cart`, "View your cart at any time", "success");
      onClose();
    } catch {
      showToast("Could not add item", "Please try again", "error");
    } finally {
      setAdding(false);
    }
  };

  const downloadSpecSheet = () => {
    if (product.certificateUrl?.trim()) {
      window.open(product.certificateUrl.trim(), "_blank", "noopener,noreferrer");
      return;
    }
    showToast(`Downloading TDS Spec Sheet for ${product.name}`, "PDF document prepared", "info");
  };

  return (
    <div className="fixed inset-0 z-[9990] flex animate-fade-in items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl md:flex-row">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-ivory p-2 text-text-secondary transition hover:rotate-90 hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        <div className="relative flex flex-col items-center justify-center border-b border-border-hairline bg-cream p-6 md:w-1/2 md:border-b-0 md:border-r md:p-8">
          <div className="absolute left-4 top-4 flex gap-2">
            <span className="rounded-full bg-forest px-3 py-1 text-[11px] font-medium text-on-dark">
              {product.category}
            </span>
            {product.colorHex && (
              <span className="flex items-center gap-1.5 rounded-full border border-border-hairline bg-white px-2.5 py-1 text-xs font-medium text-text-primary">
                <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: product.colorHex }} />
                Swatch
              </span>
            )}
          </div>

          <div className="my-4 flex h-56 w-full items-center justify-center md:h-72">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain drop-shadow-xl transition-transform duration-500 hover:scale-105" />
          </div>

          <div className="mt-auto grid w-full grid-cols-2 gap-2">
            <div className="rounded-xl bg-white p-3 text-center">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-text-secondary">CAS</span>
              <span className="font-mono text-xs font-semibold text-text-primary">{product.cas || "N/A"}</span>
            </div>
            <div className="rounded-xl bg-white p-3 text-center">
              <span className="block text-[10px] font-medium uppercase tracking-wider text-text-secondary">Purity</span>
              <span className="text-xs font-semibold text-success-green">≥ {product.purity}%</span>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex max-h-[60vh] flex-col justify-between overflow-y-auto p-6 md:max-h-none md:w-1/2 md:p-8">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-xs text-text-secondary">SKU: {product.sku}</span>
              <span className="text-text-secondary/40">•</span>
              <span className="text-xs font-medium text-accent">{product.grade}</span>
            </div>

            <h2 className="mb-3 text-2xl font-semibold leading-snug text-text-primary">{product.name}</h2>
            <p className="mb-6 text-sm leading-relaxed text-text-secondary">{product.description}</p>

            <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl bg-cream p-4">
              <div>
                <span className="block text-[11px] font-medium text-text-secondary">Packaging</span>
                <span className="text-sm font-semibold text-text-primary">{product.packing}</span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-text-secondary">Status</span>
                <span className="flex items-center gap-1 text-sm font-semibold text-success-green">
                  <CheckCircle className="h-3.5 w-3.5" />
                  {product.status === "preorder" ? "2 Wk Lead" : `In Stock`}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-border-hairline pt-4">
            <div className="mb-5 flex items-baseline justify-between">
              <div>
                <span className="mb-1 block text-xs font-medium text-text-secondary">Unit Price</span>
                <div className="text-2xl font-bold text-text-primary">
                  {formatINR(unitPriceForQty(product, qty))} <span className="text-xs font-normal text-text-secondary">/ {product.unit}</span>
                </div>
              </div>
              <button onClick={downloadSpecSheet} className="flex items-center gap-1.5 rounded-full border border-border-hairline px-3 py-1.5 text-xs font-medium text-text-secondary transition hover:border-accent hover:text-accent">
                <Download className="h-3.5 w-3.5" /> TDS
              </button>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex shrink-0 items-center overflow-hidden rounded-full border border-border-hairline bg-cream">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-10 w-9 items-center justify-center font-bold text-text-secondary hover:bg-white">-</button>
                <span className="w-10 text-center text-sm font-semibold text-text-primary">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="flex h-10 w-9 items-center justify-center font-bold text-text-secondary hover:bg-white">+</button>
              </div>
              <button onClick={handleAddToCart} disabled={adding} className="vj-btn vj-btn-primary h-12 flex-1 gap-2 disabled:opacity-50">
                <ShoppingBag className="h-4 w-4" />
                {adding ? "Adding..." : `Add ${qty} ${product.unit}`}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-text-secondary">
                <ShieldCheck className="h-3.5 w-3.5 text-success-green" /> Quality Certified
              </span>
              <Link href={`/shop/${product.slug}`} onClick={onClose} className="flex items-center gap-1 font-medium text-accent hover:underline">
                Full Page <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
