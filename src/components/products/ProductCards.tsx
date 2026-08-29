"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { formatINR } from "@/lib/format";
import type { Product } from "@/types";
import AddToCartButton from "./AddToCartButton";
import { OfferBadge } from "./OfferBadge";
import { Eye, ArrowUpRight } from "lucide-react";

function StatusChip({ product }: { product: Product }) {
  if (product.status === "in-stock") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-forest/90 px-2.5 py-1 text-[10px] font-medium text-on-dark backdrop-blur">
        <Icon name="check_circle" className="text-[12px]" /> In Stock
      </span>
    );
  }
  if (product.status === "low-stock") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-accent/90 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur">
        Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-medium text-text-secondary backdrop-blur">
      Lead Time 2 Wks
    </span>
  );
}

export function CatalogCard({
  product,
  featured = false,
  onQuickView,
}: {
  product: Product;
  featured?: boolean;
  onQuickView?: (product: Product) => void;
}) {
  return (
    <article
      className={`product-card group relative flex flex-col overflow-hidden ${
        featured ? "sm:col-span-2 sm:flex-row" : ""
      }`}
    >
      <div
        className={`product-card-media relative flex items-center justify-center overflow-hidden ${
          featured ? "aspect-[4/3] w-full sm:aspect-auto sm:min-h-[260px] sm:w-[44%]" : "aspect-[4/3]"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="relative z-[1] max-h-[75%] max-w-[75%] object-contain drop-shadow-lg transition duration-300 ease-out group-hover:-translate-y-1 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 z-[2] flex flex-col items-start gap-1.5">
          <StatusChip product={product} />
          <OfferBadge product={product} />
        </div>
        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="absolute bottom-3 right-3 z-[2] inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[11px] font-medium text-text-primary shadow-lg opacity-0 transition group-hover:opacity-100 max-md:opacity-100"
          >
            <Eye className="h-3.5 w-3.5" /> View
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <span className="tech-label mb-1 text-text-secondary">{product.category}</span>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="mb-1.5 line-clamp-1 text-base font-semibold tracking-tight text-text-primary transition group-hover:text-accent">
            {product.name}
          </h3>
        </Link>
        <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-text-secondary">
          {product.description}
        </p>

        <div className="mb-4 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-sage-light px-2.5 py-1 text-[10px] font-medium text-forest">
            ≥ {product.purity}% purity
          </span>
          <span className="rounded-full bg-sage-light px-2.5 py-1 text-[10px] font-medium text-forest">
            {product.packing}
          </span>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-border-hairline pt-4">
          <div>
            <span className="text-lg font-semibold tabular-nums text-text-primary">
              {formatINR(product.price)}
            </span>
            <span className="ml-1 text-xs text-text-secondary">/ {product.unit}</span>
            {product.offer?.label ? (
              <span className="mt-0.5 block text-[11px] font-medium text-accent">{product.offer.label}</span>
            ) : null}
          </div>
          <AddToCartButton product={product} variant="icon" />
        </div>
      </div>
    </article>
  );
}

export function SpecCard({
  product,
  onQuickView,
}: {
  product: Product;
  onQuickView?: (product: Product) => void;
}) {
  return (
    <article className="product-card group flex min-w-[250px] snap-start flex-col overflow-hidden md:min-w-[280px]">
      <div className="product-card-media relative aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain p-6 drop-shadow-lg transition duration-300 group-hover:-translate-y-1 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 z-[2]">
          <OfferBadge product={product} />
        </div>
        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="absolute inset-0 flex items-center justify-center bg-forest/10 text-xs font-medium text-forest opacity-0 transition group-hover:opacity-100"
          >
            <Eye className="mr-1.5 h-4 w-4" /> Quick View
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/shop/${product.slug}`}>
          <h4 className="mb-1 line-clamp-1 text-base font-semibold text-text-primary">
            {product.name}
          </h4>
        </Link>
        <p className="mb-3 line-clamp-2 text-sm text-text-secondary">{product.description}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-semibold tabular-nums text-text-primary">
            {formatINR(product.price)}
            <span className="text-xs font-normal text-text-secondary">/{product.unit}</span>
          </span>
          <AddToCartButton product={product} variant="icon" />
        </div>
      </div>
    </article>
  );
}

export function DyeDataCard({
  product,
  onQuickView,
}: {
  product: Product;
  onQuickView?: (product: Product) => void;
}) {
  return (
    <article className="product-card group relative flex h-full flex-col overflow-hidden">
      <div className="product-card-media relative aspect-[4/3] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain p-7 drop-shadow-lg transition duration-300 ease-out group-hover:-translate-y-1.5 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3.5 top-3.5 z-[2] flex flex-col items-start gap-1.5">
          <StatusChip product={product} />
          <OfferBadge product={product} />
        </div>
        {product.colorHex && (
          <div
            className="absolute right-3.5 top-3.5 z-[2] h-7 w-7 rounded-full border-2 border-white shadow-md"
            style={{ backgroundColor: product.colorHex }}
            title={`Shade: ${product.colorHex}`}
          />
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <span className="tech-label mb-1 text-text-secondary">{product.category}</span>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="mb-1.5 line-clamp-1 text-base font-semibold tracking-tight text-text-primary transition group-hover:text-accent">
            {product.name}
          </h3>
        </Link>
        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-text-secondary">
          {product.description}
        </p>

        <div className="mb-4 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-sage-light px-2.5 py-1 font-mono text-[10px] font-medium text-forest">
            ≥ {product.purity}%
          </span>
          {product.cas && (
            <span className="rounded-full bg-sage-light px-2.5 py-1 font-mono text-[10px] font-medium text-forest">
              CAS {product.cas}
            </span>
          )}
          <span className="rounded-full bg-sage-light px-2.5 py-1 text-[10px] font-medium text-forest">
            {product.packing}
          </span>
        </div>

        <div className="mt-auto space-y-3 border-t border-border-hairline pt-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="text-xl font-semibold tabular-nums text-text-primary">
                {formatINR(product.price)}
              </span>
              <span className="ml-1 text-xs text-text-secondary">/ {product.unit}</span>
              {product.offer?.label ? (
                <span className="mt-0.5 block text-[11px] font-medium text-accent">{product.offer.label}</span>
              ) : null}
            </div>
            <Link
              href={`/shop/${product.slug}`}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent transition hover:text-accent-deep"
            >
              Details <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex items-center gap-2">
            {onQuickView && (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage-light text-forest transition hover:bg-forest hover:text-on-dark"
                aria-label="Quick view"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0 flex-1 [&_button]:h-10 [&_button]:w-full [&_button]:rounded-full">
              <AddToCartButton product={product} label="Add to Cart" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
