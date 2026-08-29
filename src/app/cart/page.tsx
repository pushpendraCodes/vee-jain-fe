"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { fetchProducts } from "@/lib/api";
import { cartRemove, cartSetQuantity } from "@/lib/cartActions";
import { formatINR } from "@/lib/format";
import { unitPriceForQty } from "@/lib/pricing";
import { FREIGHT_FLAT, GST_RATE } from "@/lib/constants";
import { useAppSelector } from "@/store/hooks";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/types";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  Minus,
  Plus,
} from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const items = useAppSelector((s) => s.cart.items);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const products = await fetchProducts();
        if (!cancelled) setCatalog(products);
      } catch {
        if (!cancelled) setCatalog([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const lines = useMemo(
    () =>
      items
        .map((i) => {
          const product = catalog.find((p) => p.id === i.productId || p.slug === i.productId);
          return product ? { ...i, product } : null;
        })
        .filter(Boolean) as { productId: string; quantity: number; product: Product }[],
    [items, catalog]
  );

  const subtotal = lines.reduce((n, l) => n + unitPriceForQty(l.product, l.quantity) * l.quantity, 0);
  const freight = lines.length ? FREIGHT_FLAT : 0;
  const gst = (subtotal + freight) * GST_RATE;
  const total = subtotal + freight + gst;

  const handleRemove = async (productId: string, name: string) => {
    await cartRemove(productId);
    showToast("Item Removed", `${name} was removed from your cart`, "info");
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-sage-light" />
        <p className="text-sm text-text-secondary">Loading cart…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          Your Cart
        </h1>
        <p className="mt-1 text-base text-text-secondary">
          Review selected compounds and proceed to secure checkout.
        </p>
      </div>

      {lines.length === 0 ? (
        <div className="my-6 rounded-[2rem] bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage-light text-forest">
            <ShoppingBag className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary">Cart is empty</h3>
          <p className="mb-6 mt-1 text-sm text-text-secondary">
            Explore high-purity dyes, screen inks, and auxiliaries.
          </p>
          <Link href="/shop" className="vj-btn vj-btn-primary inline-flex h-11 px-8">
            Browse Catalog <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <section className="space-y-3 lg:col-span-8">
            {lines.map((line) => (
              <div
                key={line.productId}
                className="flex flex-col gap-4 rounded-[1.5rem] bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={line.product.image} alt="" className="max-h-full max-w-full object-contain" />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-medium uppercase tracking-wider text-text-secondary">
                    {line.product.category}
                  </span>
                  <h3 className="truncate text-base font-semibold text-text-primary">
                    {line.product.name}
                  </h3>
                  <span className="font-mono text-[10px] text-text-secondary">SKU: {line.product.sku}</span>
                </div>

                <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                  <div className="flex items-center overflow-hidden rounded-full border border-border-hairline bg-ivory">
                    <button className="flex h-9 w-9 items-center justify-center text-text-primary" onClick={() => void cartSetQuantity(line.productId, line.quantity - 1)} aria-label="Decrease">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-semibold tabular-nums text-text-primary">{line.quantity}</span>
                    <button className="flex h-9 w-9 items-center justify-center text-text-primary" onClick={() => void cartSetQuantity(line.productId, line.quantity + 1)} aria-label="Increase">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="min-w-[90px] text-right">
                    <span className="block font-semibold tabular-nums text-text-primary">{formatINR(unitPriceForQty(line.product, line.quantity) * line.quantity)}</span>
                    <span className="text-[10px] text-text-secondary">₹{unitPriceForQty(line.product, line.quantity)}/{line.product.unit}</span>
                  </div>

                  <button aria-label="Remove item" className="rounded-full p-2 text-text-secondary transition hover:bg-red-50 hover:text-red-600" onClick={() => handleRemove(line.productId, line.product.name)}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </section>

          <div className="sticky top-24 lg:col-span-4">
            <section className="rounded-[1.75rem] bg-white p-6 shadow-sm">
              <h2 className="mb-5 text-lg font-semibold text-text-primary">Order Summary</h2>

              <div className="space-y-3 text-sm text-text-secondary">
                <div className="flex justify-between">
                  <span>Subtotal ({lines.length})</span>
                  <span className="font-semibold tabular-nums text-text-primary">{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-accent" /> Freight</span>
                  <span className="font-semibold tabular-nums text-text-primary">{formatINR(freight)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (18%)</span>
                  <span className="font-semibold tabular-nums text-text-primary">{formatINR(gst)}</span>
                </div>
                <div className="border-t border-border-hairline pt-4">
                  <span className="block text-[10px] font-medium uppercase tracking-wider text-text-secondary">Total payable</span>
                  <span className="text-2xl font-bold tabular-nums text-text-primary">{formatINR(total)}</span>
                </div>
              </div>

              <button onClick={() => router.push("/checkout")} className="vj-btn vj-btn-primary mt-5 h-12 w-full">
                Proceed to Checkout <ArrowRight className="h-4 w-4" />
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-text-secondary">
                <ShieldCheck className="h-4 w-4 text-success-green" /> Razorpay & UPI encrypted
              </p>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
