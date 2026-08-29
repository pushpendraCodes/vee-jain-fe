"use client";

import { notFound } from "next/navigation";
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { fetchProduct, fetchProducts } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { productTiers, tierLabel, tierUnitPrice, unitPriceForQty } from "@/lib/pricing";
import AddToCartButton from "@/components/products/AddToCartButton";
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
  Download,
  FileCheck2,
  PackageCheck,
  FlaskConical,
  CheckCircle2,
  Info,
  Minus,
  Plus,
} from "lucide-react";

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [related, setRelated] = useState<Product[]>([]);
  const [qty, setQty] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"overview" | "specs" | "safety" | "tds">("overview");
  const [selectedQuickView, setSelectedQuickView] = useState<Product | null>(null);
  const [expanded, setExpanded] = useState(false);

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
          <div className="aspect-[4/3] rounded-[2rem] bg-cream lg:aspect-[16/9]" />
          <div className="h-48 rounded-[1.75rem] bg-white" />
        </div>
      </div>
    );
  }
  if (!product) notFound();

  const gallery = product.images?.length ? product.images : product.image ? [product.image] : [];
  const currentImage = gallery[Math.min(activeImage, Math.max(gallery.length - 1, 0))] || product.image;
  const tiers = productTiers(product);
  const effectivePrice = unitPriceForQty(product, qty);
  const applications = product.applications?.trim() || "Textile dyeing, pigment dispersion, screen printing inks, and chemical synthesis.";
  const storage = product.storage?.trim() || "Cool, sealed drums away from sunlight. 24-month shelf life under standard conditions.";
  const safety = product.safety?.trim() || "Use gloves, goggles, and a dust mask when handling bulk powders or solvents.";
  const certificateTitle = product.certificateTitle?.trim() || "Batch certificate";
  const certificateNote = product.certificateNote?.trim() || "Lab analysis available on request";

  const downloadTds = () => {
    if (product.certificateUrl?.trim()) {
      window.open(product.certificateUrl.trim(), "_blank", "noopener,noreferrer");
      return;
    }
    showToast(`Downloading TDS Document for ${product.name}`, "Technical Data Sheet generated", "info");
  };

  return (
    <div className="pb-28 md:pb-16">
      <QuickViewModal product={selectedQuickView} onClose={() => setSelectedQuickView(null)} />

      {/* Image section */}
      <section className="bg-cream pb-8 pt-6">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center gap-2">
            <Link
              href="/shop"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border-hairline bg-white text-text-primary transition hover:bg-sage-light"
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
              <div className="relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm">
                <div className="relative mx-auto flex aspect-square max-w-lg items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentImage}
                    alt={product.name}
                    className="max-h-[85%] max-w-[85%] object-contain drop-shadow-xl"
                  />
                  {product.colorHex && (
                    <div
                      className="absolute bottom-4 right-4 h-10 w-10 rounded-full border-2 border-white shadow-lg"
                      style={{ backgroundColor: product.colorHex }}
                    />
                  )}
                </div>
                {gallery.length > 1 ? (
                  <div className="mt-4 flex justify-center gap-2">
                    {gallery.map((src, index) => (
                      <button
                        key={`${src}-${index}`}
                        type="button"
                        onClick={() => setActiveImage(index)}
                        className={`h-14 w-14 overflow-hidden rounded-xl border-2 bg-cream ${
                          index === activeImage ? "border-forest" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                        aria-label={`View image ${index + 1}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt="" className="h-full w-full object-contain p-1" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-1.5">
                    <span className="h-1.5 w-6 rounded-full bg-forest" />
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="space-y-5 lg:col-span-5 lg:sticky lg:top-24">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-forest px-3 py-1.5 text-[11px] font-medium text-on-dark">
                  {product.category}
                </span>
                <span className="rounded-full bg-sage-light px-3 py-1.5 text-[11px] font-medium text-forest">
                  {product.status === "preorder" ? "Lead time 2 weeks" : "In Stock"}
                </span>
                <span className="rounded-full bg-sage-light px-3 py-1.5 text-[11px] font-medium text-forest">
                  ≥ {product.purity}% purity
                </span>
                {product.offer?.label ? (
                  <span className="rounded-full bg-accent px-3 py-1.5 text-[11px] font-medium text-white">
                    {product.offer.label}
                  </span>
                ) : null}
              </div>

              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
                  {product.name}
                </h1>
                <a href="#reviews" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline">
                  Customer reviews
                </a>
              </div>
              <p className="font-mono text-xs text-text-secondary">
                SKU {product.sku}{product.cas ? ` · CAS ${product.cas}` : ""}
              </p>

              <div>
                <p className={`text-base leading-relaxed text-text-secondary ${expanded ? "" : "line-clamp-3"}`}>
                  {product.description}
                </p>
                <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-sm font-medium text-accent link-underline">
                  {expanded ? "Show less" : "Read more"}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "CAS", value: product.cas || "N/A" },
                  { label: "Purity", value: `≥ ${product.purity}%` },
                  { label: "Pack", value: product.packing },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-sage-light p-3 text-center">
                    <span className="block text-[10px] font-medium text-text-secondary">{item.label}</span>
                    <span className="text-sm font-semibold text-forest">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-end justify-between border-t border-border-hairline pt-5">
                <div>
                  <span className="text-3xl font-bold tabular-nums text-text-primary">{formatINR(effectivePrice)}</span>
                  <span className="ml-1 text-sm text-text-secondary">/ {product.unit}</span>
                </div>
                <button onClick={downloadTds} className="inline-flex items-center gap-1.5 text-sm font-medium text-accent link-underline">
                  <Download className="h-4 w-4" /> TDS
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content section */}
      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        {/* Tier pricing */}
        <div className="mb-8 rounded-[1.75rem] bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="font-semibold text-text-primary">Volume Tier Pricing</span>
            <span className="flex items-center gap-1 text-xs font-medium text-success-green">
              <CheckCircle2 className="h-3.5 w-3.5" /> Factory rate
            </span>
          </div>
          <div className={`grid gap-3 text-center ${tiers.length === 3 ? "grid-cols-3" : tiers.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
            {tiers.map((tier, index) => {
              const next = tiers[index + 1];
              const active = qty >= Number(tier.minQty) && (!next || qty < Number(next.minQty));
              return (
                <button
                  key={`${tier.minQty}-${index}`}
                  type="button"
                  onClick={() => setQty(Number(tier.minQty) || 1)}
                  className={`rounded-xl p-3 ${active ? "bg-forest text-on-dark" : "bg-sage-light text-forest"}`}
                >
                  <span className="block text-[11px]">{tierLabel(tier, next, product.unit)}</span>
                  <span className="text-sm font-semibold tabular-nums">{formatINR(tierUnitPrice(product, tier))}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tabs */}
        <div className="rounded-[1.75rem] bg-white p-6 shadow-sm">
          <div role="tablist" className="mb-5 flex flex-wrap gap-2">
            {[
              { id: "overview", label: "Overview" },
              { id: "specs", label: "Properties" },
              { id: "safety", label: "Safety" },
              { id: "tds", label: "Certificates" },
            ].map((tab) => (
              <button
                key={tab.id}
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? "bg-forest text-on-dark"
                    : "bg-sage-light text-forest hover:bg-sage"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="animate-fade-in" key={activeTab}>
            {activeTab === "overview" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-cream p-5">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <FlaskConical className="h-4 w-4 text-accent" /> Applications
                  </h4>
                  <p className="whitespace-pre-line text-sm text-text-secondary">{applications}</p>
                </div>
                <div className="rounded-xl bg-cream p-5">
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold text-text-primary">
                    <PackageCheck className="h-4 w-4 text-accent" /> Storage
                  </h4>
                  <p className="whitespace-pre-line text-sm text-text-secondary">{storage}</p>
                </div>
              </div>
            )}
            {activeTab === "specs" && (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { label: "Grade", value: product.grade },
                  { label: "Purity", value: `≥ ${product.purity}%` },
                  { label: "CAS", value: product.cas || "N/A" },
                  { label: "Stock", value: `${product.stockKg} ${product.unit}` },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl bg-cream p-4">
                    <span className="block text-[10px] font-medium text-text-secondary">{s.label}</span>
                    <span className="text-sm font-semibold text-text-primary">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "safety" && (
              <div className="flex gap-3 rounded-xl bg-amber-50 p-5 text-text-primary">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <h4 className="text-sm font-semibold">Handling precautions</h4>
                  <p className="mt-1 whitespace-pre-line text-sm text-text-secondary">{safety}</p>
                </div>
              </div>
            )}
            {activeTab === "tds" && (
              <div className="flex flex-col items-start justify-between gap-4 rounded-xl bg-cream p-5 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-forest p-3 text-on-dark">
                    <FileCheck2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-text-primary">{certificateTitle}</h4>
                    <p className="text-xs text-text-secondary">{certificateNote}</p>
                  </div>
                </div>
                <button onClick={downloadTds} className="vj-btn vj-btn-primary h-10 px-5 text-sm">
                  Download
                </button>
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {related.map((p, i) => (
              <Reveal key={p.id} delayMs={i * 70}>
                <DyeDataCard product={p} onQuickView={setSelectedQuickView} />
              </Reveal>
            ))}
          </div>
        </section>
      )}

      {/* Sticky bottom bar */}
      <div className="fixed bottom-[72px] left-0 right-0 z-40 border-t border-border-hairline bg-ivory/95 px-5 py-3 backdrop-blur-xl md:bottom-0">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="flex items-center overflow-hidden rounded-full border border-border-hairline bg-white">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease quantity" className="flex h-11 w-10 items-center justify-center text-text-primary">
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-semibold tabular-nums">{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} aria-label="Increase quantity" className="flex h-11 w-10 items-center justify-center text-text-primary">
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="hidden min-w-0 flex-1 sm:block">
            <span className="block text-[10px] text-text-secondary">Total</span>
            <span className="text-lg font-bold tabular-nums text-text-primary">{formatINR(effectivePrice * qty)}</span>
          </div>

          <div className="min-w-0 flex-1 [&_button]:h-11 [&_button]:w-full [&_button]:rounded-full">
            <AddToCartButton product={product} quantity={qty} label={`Add ${qty} ${product.unit}`} />
          </div>

          <Link href="/contact" className="vj-btn vj-btn-accent hidden h-11 shrink-0 px-5 md:inline-flex">
            Request Quote
          </Link>
        </div>
        <p className="mx-auto mt-2 hidden max-w-7xl items-center gap-1 text-[11px] text-text-secondary md:flex">
          <ShieldCheck className="h-3.5 w-3.5 text-success-green" /> Batch lab analysis included
        </p>
      </div>
    </div>
  );
}
