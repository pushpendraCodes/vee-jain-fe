"use client";

import { notFound, useRouter } from "next/navigation";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { fetchProduct, fetchProducts } from "@/lib/api";
import { cartAdd } from "@/lib/cartActions";
import { formatINR } from "@/lib/format";
import { findVariant, productVariants, unitPriceForQty } from "@/lib/pricing";
import AddToCartButton from "@/components/products/AddToCartButton";
import VariantPicker from "@/components/products/VariantPicker";
import { DyeDataCard } from "@/components/products/ProductCards";
import ProductReviews from "@/components/products/ProductReviews";
import QuickViewModal from "@/components/ui/QuickViewModal";
import Reveal from "@/components/visual/Reveal";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  PackageCheck,
  FlaskConical,
  Info,
  Minus,
  Plus,
} from "lucide-react";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "safety">("overview");
  const [selectedQuickView, setSelectedQuickView] = useState<Product | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [buying, setBuying] = useState(false);
  const [variantId, setVariantId] = useState("");

  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await fetchProduct(slug);
        if (cancelled) return;
        setProduct(p);
        if (p) {
          setActiveImage(0);
          setVariantId(productVariants(p)[0]?.id || "");
          const all = await fetchProducts({ category: p.category });
          if (!cancelled) setRelated(all.filter((x) => x.id !== p.id).slice(0, 3));
        }
      } catch {
        if (!cancelled) setProduct(null);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (product === undefined) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="aspect-[4/3] rounded-2xl bg-bg lg:aspect-[16/9]" />
          <div className="h-48 rounded-2xl bg-surface" />
        </div>
      </div>
    );
  }
  if (!product) notFound();

  const variants = productVariants(product);
  const selectedVariant = findVariant(product, variantId || variants[0]?.id);
  const variantGallery = (selectedVariant.images || [])
    .map((item) => (typeof item === "string" ? item : item?.url || ""))
    .filter(Boolean);
  const gallery = variantGallery.length
    ? variantGallery
    : product.images?.length
      ? product.images
      : product.image
        ? [product.image]
        : [];
  const currentImage = gallery[Math.min(activeImage, Math.max(gallery.length - 1, 0))] || product.image;
  const effectivePrice = unitPriceForQty(product, qty, selectedVariant.id);
  const applications = product.applications?.trim() || "Textile dyeing, pigment dispersion, screen printing inks, and chemical synthesis.";
  const storage = product.storage?.trim() || "Cool, sealed drums away from sunlight. 24-month shelf life under standard conditions.";
  const safety = product.safety?.trim() || "Use gloves, goggles, and a dust mask when handling bulk powders or solvents.";

  const buyNow = async () => {
    if (product.status === "preorder") {
      showToast("Restock Request Sent", `We will notify you when ${product.name} is available.`, "info");
      return;
    }
    setBuying(true);
    try {
      await cartAdd(product.id, qty, selectedVariant.id);
      router.push("/checkout");
    } catch {
      showToast("Could not start checkout", "Please try again", "error");
      setBuying(false);
    }
  };

  return (
    <div className="pb-28 md:pb-16">
      <QuickViewModal product={selectedQuickView} onClose={() => setSelectedQuickView(null)} />

      {/* Image section */}
      <section className="bg-bg pb-8 pt-6">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-2">
            <Link
              href="/shop"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-text-primary transition hover:bg-surface-2"
              aria-label="Back to catalog"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-text-secondary">
              <Link href="/" className="hover:text-text-primary">Home</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/shop" className="hover:text-text-primary">Catalog</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="truncate font-medium text-text-primary">{product.name}</span>
            </nav>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-12">
            {/* Image */}
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-2xl bg-surface">
                <div className="relative aspect-square overflow-hidden bg-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="absolute inset-0 h-full w-full object-contain"
                  />
                  {product.colorHex && (
                    <div
                      className="absolute bottom-4 right-4 h-10 w-10 rounded-full border-2 border-white"
                      style={{ backgroundColor: product.colorHex }}
                    />
                  )}
                </div>
                {gallery.length > 1 ? (
                  <div className="flex gap-2 overflow-x-auto bg-surface p-3">
                    {gallery.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${
                          index === activeImage ? "border-line-hi" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-contain" />
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-5 lg:col-span-5 lg:sticky lg:top-24">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-medium text-on-dark">
                  {product.category}
                </span>
                <span className="rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-medium text-ink">
                  {product.status === "preorder"
                    ? "Lead time 2 weeks"
                    : selectedVariant.stock > 0
                      ? "In Stock"
                      : "Out of stock"}
                </span>
                {product.offer?.label ? (
                  <span className="rounded-full bg-brand px-3 py-1.5 text-[11px] font-medium text-white">
                    {product.offer.label}
                  </span>
                ) : null}
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
                  {product.name}
                </h1>
                <a href="#reviews" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-ink-mute hover:text-ink">
                  Customer reviews
                </a>
              </div>
              <p className="font-mono text-xs text-text-secondary">SKU {selectedVariant.sku || product.sku}</p>

              <div>
                <p className={`text-base leading-relaxed text-text-secondary ${expanded ? "" : "line-clamp-3"}`}>
                  {product.description}
                </p>
                <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-sm font-medium text-ink-mute link-underline">
                  {expanded ? "Show less" : "Read more"}
                </button>
              </div>

              {variants.length > 0 ? (
                <div className="border-t border-line pt-4">
                  <VariantPicker
                    product={product}
                    variantId={selectedVariant.id}
                    onChange={(id) => {
                      setVariantId(id);
                      setActiveImage(0);
                    }}
                  />
                </div>
              ) : null}

              <div className="flex items-end justify-between border-t border-line pt-5">
                <div>
                  <span className="text-3xl font-bold tabular-nums text-text-primary">{formatINR(effectivePrice)}</span>
                  <span className="ml-1 text-sm text-text-secondary">/ {product.unit}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content section */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-surface p-6">
          <div role="tablist" className="mb-5 flex flex-wrap gap-2">
            {[
              { id: "overview", label: "Overview" },
              { id: "specs", label: "Properties" },
              { id: "safety", label: "Safety" },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-surface-2 text-on-dark"
                    : "bg-surface-2 text-ink hover:bg-surface-2"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="animate-fade-in" key={activeTab}>
            {activeTab === "overview" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-bg p-5">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <FlaskConical className="h-4 w-4 text-ink-mute" /> Applications
                  </h4>
                  <p className="whitespace-pre-line text-sm text-text-secondary">{applications}</p>
                </div>
                <div className="rounded-xl bg-bg p-5">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <PackageCheck className="h-4 w-4 text-ink-mute" /> Storage
                  </h4>
                  <p className="whitespace-pre-line text-sm text-text-secondary">{storage}</p>
                </div>
              </div>
            )}
            {activeTab === "specs" && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: "Grade", value: product.grade || "—" },
                  { label: "Size", value: selectedVariant.size || "—" },
                  { label: "Shade", value: selectedVariant.shade || "—" },
                  { label: "Stock", value: `${selectedVariant.stock} ${product.unit}` },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-bg p-4">
                    <span className="block text-[10px] font-medium text-text-secondary">{s.label}</span>
                    <span className="text-sm font-semibold text-text-primary">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "safety" && (
              <div className="flex gap-3 rounded-xl bg-surface-2 p-5 text-text-primary">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <h4 className="text-sm font-semibold">Handling precautions</h4>
                  <p className="mt-1 whitespace-pre-line text-sm text-text-secondary">{safety}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <ProductReviews slug={product.slug} productName={product.name} />
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="mx-auto max-w-7xl space-y-6 px-5 pt-8 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display text-2xl font-bold text-text-primary">
              Related in {product.category}
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 md:grid-cols-3">
            {related.map((p, i) => (
              <Reveal key={p.id} delayMs={i * 70}>
                <DyeDataCard product={p} onQuickView={setSelectedQuickView} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 border-t border-line bg-surface px-3 py-2.5 backdrop-blur-xl sm:px-5 sm:py-3 md:bottom-0">
        <div className="mx-auto flex max-w-7xl items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-center overflow-hidden rounded-full border border-line bg-surface">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="flex h-11 w-9 items-center justify-center text-text-primary sm:w-10">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-sm font-semibold tabular-nums sm:w-10">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity" className="flex h-11 w-9 items-center justify-center text-text-primary sm:w-10">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden min-w-0 flex-1 sm:block">
            <span className="block text-[10px] text-text-secondary">Total</span>
            <span className="text-lg font-bold tabular-nums text-text-primary">{formatINR(effectivePrice * qty)}</span>
          </div>

          <div className="min-w-0 flex-1 [&_button]:h-11 [&_button]:w-full [&_button]:rounded-full [&_button]:px-2 [&_button]:text-[12px] sm:[&_button]:px-5 sm:[&_button]:text-xs">
            <AddToCartButton
              product={product}
              quantity={qty}
              label="Add to Cart"
              showIcon={false}
              variantId={selectedVariant.id}
            />
          </div>

          <button
            type="button"
            onClick={() => void buyNow()}
            disabled={buying}
            className="vj-btn vj-btn-accent h-11 shrink-0 px-3 text-[12px] disabled:opacity-50 sm:px-5 sm:text-xs"
          >
            {buying ? "…" : "Buy Now"}
          </button>
        </div>
        <p className="mx-auto mt-2 hidden max-w-7xl items-center gap-1 text-[11px] text-text-secondary md:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-ink-mute" /> Batch lab analysis included
        </p>
      </div>
    </div>
  );
}
