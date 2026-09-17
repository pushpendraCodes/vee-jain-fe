"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, ShoppingBag, CheckCircle, ShieldCheck, ArrowRight } from "lucide-react";
import { formatINR } from "@/lib/format";
import { cartAdd } from "@/lib/cartActions";
import { hapticTap } from "@/lib/haptic";
import { useToast } from "@/components/ui/Toast";
import { findVariant, productVariants, unitPriceForQty } from "@/lib/pricing";
import VariantPicker from "@/components/products/VariantPicker";
import type { Product } from "@/types";

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [variantId, setVariantId] = useState("");
  const { showToast } = useToast();

  if (!product) return null;

  const variants = productVariants(product);
  const selected = findVariant(product, variantId || variants[0]?.id);
  const selectedImage =
    (selected.images || [])
      .map((item) => (typeof item === "string" ? item : item?.url || ""))
      .find(Boolean) || product.image;

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await cartAdd(product.id, qty, selected.id);
      hapticTap([14, 40, 22]);
      showToast(`Added ${qty} ${product.unit} of ${product.name} to your cart`, "View your cart at any time", "success");
      onClose();
    } catch {
      showToast("Could not add item", "Please try again", "error");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] flex animate-fade-in items-center justify-center p-4 sm:p-6 md:p-10">
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-surface md:flex-row">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-full bg-surface p-2 text-text-secondary transition hover:rotate-90 hover:text-text-primary"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Image */}
        <div className="relative flex flex-col border-b border-line bg-bg md:w-1/2 md:border-b-0 md:border-r">
          <div className="absolute left-4 top-4 z-10 flex gap-2">
            <span className="rounded-full bg-surface-2 px-3 py-1 text-[11px] font-medium text-on-dark">
              {product.category}
            </span>
            {product.colorHex && (
              <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-xs font-medium text-text-primary">
                <span className="h-3 w-3 rounded-full border" style={{ backgroundColor: product.colorHex }} />
                Swatch
              </span>
            )}
          </div>

          <div className="relative h-56 w-full overflow-hidden md:h-full md:min-h-72">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selectedImage} alt={product.name} className="absolute inset-0 h-full w-full object-contain" />
            <div className="absolute inset-x-3 bottom-3 z-10 grid grid-cols-2 gap-2">
              <div className="rounded-xl bg-surface p-3 text-center backdrop-blur-sm">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-text-secondary">Variant</span>
                <span className="text-xs font-semibold text-text-primary">{selected.name}</span>
              </div>
              <div className="rounded-xl bg-surface p-3 text-center backdrop-blur-sm">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-text-secondary">Stock</span>
                <span className="text-xs font-semibold text-ink-mute">
                  {selected.stock} {product.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="flex max-h-[60vh] flex-col justify-between overflow-y-auto p-6 md:max-h-none md:w-1/2 md:p-8">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-mono text-xs text-text-secondary">SKU: {product.sku}</span>
              <span className="text-text-secondary/40">•</span>
              <span className="text-xs font-medium text-ink-mute">{product.grade || product.category}</span>
            </div>

            <h2 className="mb-3 text-2xl font-semibold leading-snug text-text-primary">{product.name}</h2>
            <p className="mb-4 text-sm leading-relaxed text-text-secondary">{product.description}</p>

            {variants.length > 0 ? (
              <div className="mb-5">
                <VariantPicker product={product} variantId={selected.id} onChange={setVariantId} compact />
              </div>
            ) : null}

            <div className="mb-6 grid grid-cols-2 gap-3 rounded-xl bg-bg p-4">
              <div>
                <span className="block text-[11px] font-medium text-text-secondary">Price</span>
                <span className="text-sm font-semibold text-text-primary">{formatINR(selected.price)}</span>
              </div>
              <div>
                <span className="block text-[11px] font-medium text-text-secondary">Status</span>
                <span className={`flex items-center gap-1 text-sm font-semibold ${selected.stock > 0 ? "text-ink-mute" : "text-ink"}`}>
                  <CheckCircle className="h-3.5 w-3.5" />
                  {product.status === "preorder" ? "2 Wk Lead" : selected.stock > 0 ? "In Stock" : "Out of stock"}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-line pt-4">
            <div className="mb-5 flex items-baseline justify-between">
              <div>
                <span className="mb-1 block text-xs font-medium text-text-secondary">Unit Price</span>
                <div className="text-2xl font-bold text-text-primary">
                  {formatINR(unitPriceForQty(product, qty, selected.id))}{" "}
                  <span className="text-xs font-normal text-text-secondary">/ {product.unit}</span>
                </div>
              </div>
            </div>

            <div className="mb-4 flex items-center gap-3">
              <div className="flex shrink-0 items-center overflow-hidden rounded-full border border-line bg-bg">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-10 w-9 items-center justify-center font-bold text-text-secondary hover:bg-surface">-</button>
                <span className="w-10 text-center text-sm font-semibold text-text-primary">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="flex h-10 w-9 items-center justify-center font-bold text-text-secondary hover:bg-surface">+</button>
              </div>
              <button onClick={handleAddToCart} disabled={adding} className="vj-btn vj-btn-primary h-12 flex-1 gap-2 disabled:opacity-50">
                <ShoppingBag className="h-4 w-4" />
                {adding ? "Adding..." : "Add to Cart"}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-text-secondary">
                <ShieldCheck className="h-3.5 w-3.5 text-ink-mute" /> Quality Certified
              </span>
              <Link href={`/shop/${product.slug}`} onClick={onClose} className="flex items-center gap-1 font-medium text-ink-mute hover:text-ink">
                Full Page <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
