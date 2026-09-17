"use client";

import { useState } from "react";
import Link from "next/link";
import { formatINR } from "@/lib/format";
import { shadeSwatch, variantSizes, variantShades } from "@/lib/pricing";
import { useToast } from "@/components/ui/Toast";
import { StarRating } from "./StarRating";
import { OfferBadge } from "./OfferBadge";
import type { Product } from "@/types";
import AddToCartButton from "./AddToCartButton";
import { Eye, Heart, ArrowUpRight, Beaker } from "lucide-react";

export type RatingMap = Record<string, { average: number; count: number }>;

function StatusChip({ product }: { product: Product }) {
  if (product.status === "in-stock") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-medium text-ink backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-success-green" /> In Stock
      </span>
    );
  }
  if (product.status === "low-stock") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-medium text-ink backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-brand" /> Low Stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[10px] font-medium text-ink-mute backdrop-blur">
      Lead Time 2 Wks
    </span>
  );
}

function VariantSwatches({ product, limit = 4 }: { product: Product; limit?: number }) {
  const sizes = variantSizes(product);
  const shades = variantShades(product).filter(Boolean);
  if (sizes.length <= 1 && shades.length === 0) return null;

  const items: Array<{ label: string; color?: string; title: string }> = [];
  if (shades.length) {
    shades.slice(0, limit).forEach((shade) => {
      items.push({ label: shade, color: shadeSwatch(shade), title: `Shade: ${shade}` });
    });
  } else {
    sizes.slice(0, limit).forEach((size) => {
      items.push({ label: size, title: `Size: ${size}` });
    });
  }
  const more = Math.max(0, (shades.length || sizes.length) - limit);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item) => (
        <span
          key={item.title}
          title={item.title}
          className="inline-flex h-6 items-center gap-1.5 rounded-full border border-line bg-surface px-2 text-[10px] font-medium text-ink-mute"
        >
          {item.color ? (
            <span className="h-3 w-3 rounded-full border border-line" style={{ backgroundColor: item.color }} />
          ) : null}
          {item.label}
        </span>
      ))}
      {more > 0 ? (
        <span className="inline-flex h-6 items-center rounded-full border border-line bg-surface px-2 text-[10px] font-medium text-ink-dim">
          +{more}
        </span>
      ) : null}
    </div>
  );
}

function PriceBlock({ product }: { product: Product }) {
  const basePrice = Number(product.price) || 0;
  const discount = product.offer?.discountPercent ?? 0;
  const finalPrice = Math.round(basePrice * (1 - discount / 100));
  const hasDiscount = discount > 0 && finalPrice < basePrice;

  return (
    <div className="flex flex-col">
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold tabular-nums text-ink sm:text-xl">{formatINR(hasDiscount ? finalPrice : basePrice)}</span>
        <span className="text-xs text-ink-mute">/ {product.unit}</span>
      </div>
      {hasDiscount ? (
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-ink-dim line-through">{formatINR(basePrice)}</span>
          <span className="font-semibold text-success-green">-{discount}%</span>
        </div>
      ) : null}
    </div>
  );
}

function WishlistButton({ className = "" }: { className?: string }) {
  const [liked, setLiked] = useState(false);
  const { showToast } = useToast();
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setLiked(!liked);
        showToast(liked ? "Removed from wishlist" : "Saved to wishlist", "", "info");
      }}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink-mute transition hover:border-brand hover:text-brand ${className}`}
      aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart className={`h-3.5 w-3.5 ${liked ? "fill-brand text-brand" : ""}`} />
    </button>
  );
}

function QuickViewButton({ product, onQuickView }: { product: Product; onQuickView?: (product: Product) => void }) {
  if (!onQuickView) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onQuickView(product);
      }}
      className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line bg-surface px-3 text-[11px] font-medium text-ink shadow-card transition hover:border-brand hover:text-brand"
    >
      <Eye className="h-3.5 w-3.5" /> Quick View
    </button>
  );
}

export function CatalogCard({
  product,
  featured = false,
  onQuickView,
  rating,
}: {
  product: Product;
  featured?: boolean;
  onQuickView?: (product: Product) => void;
  rating?: { average: number; count: number };
}) {
  return (
    <article
      className={`product-card group relative flex flex-col overflow-hidden ${
        featured ? "sm:col-span-2 sm:flex-row" : ""
      }`}
    >
      <div
        className={`product-card-media relative flex items-center justify-center overflow-hidden ${
          featured ? "aspect-square w-full sm:aspect-auto sm:min-h-[260px] sm:w-[44%]" : "aspect-square"
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 z-[1] h-full w-full object-contain p-4 transition duration-300 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 z-[2] flex flex-col items-start gap-1.5">
          <StatusChip product={product} />
          <OfferBadge product={product} />
        </div>
        <div className="absolute right-3 top-3 z-[2] flex flex-col gap-1.5 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
          <WishlistButton />
        </div>
        {onQuickView && (
          <div className="absolute bottom-3 left-1/2 z-[2] -translate-x-1/2 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
            <QuickViewButton product={product} onQuickView={onQuickView} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <span className="tech-label mb-1 text-ink-mute">{product.category}</span>
        <Link href={`/shop/${product.slug}`}>
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold tracking-tight text-ink transition group-hover:text-brand sm:line-clamp-1 sm:text-base">
            {product.name}
          </h3>
        </Link>
        {rating && rating.count > 0 ? (
          <div className="mb-2 flex items-center gap-1.5">
            <StarRating value={rating.average} size="sm" />
            <span className="text-xs text-ink-mute">({rating.count})</span>
          </div>
        ) : null}
        <p className="mb-3 hidden line-clamp-2 text-sm leading-relaxed text-ink-mute sm:mb-4 sm:block">
          {product.description}
        </p>

        <div className="mb-3 hidden flex-wrap gap-1.5 sm:mb-4 sm:flex">
          <VariantSwatches product={product} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-line pt-3 sm:pt-4">
          <PriceBlock product={product} />
          <AddToCartButton product={product} variant="icon" />
        </div>
      </div>
    </article>
  );
}

export function CatalogGridCard({
  product,
  onQuickView,
  rating,
}: {
  product: Product;
  onQuickView?: (product: Product) => void;
  rating?: { average: number; count: number };
}) {
  return (
    <article className="product-card group relative flex flex-col overflow-hidden">
      <div className="product-card-media relative flex items-center justify-center overflow-hidden aspect-square">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 z-[1] h-full w-full object-contain p-4 transition duration-300 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 z-[2] flex flex-col items-start gap-1.5">
          <StatusChip product={product} />
          <OfferBadge product={product} />
        </div>
        <div className="absolute right-3 top-3 z-[2] flex flex-col gap-1.5 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
          <WishlistButton />
        </div>
        {onQuickView && (
          <div className="absolute bottom-3 left-1/2 z-[2] -translate-x-1/2 opacity-0 transition group-hover:opacity-100 max-md:opacity-100">
            <QuickViewButton product={product} onQuickView={onQuickView} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="tech-label text-ink-mute">{product.category}</span>
          {product.colorHex && (
            <span
              className="h-5 w-5 rounded-full border border-line shadow-sm"
              style={{ backgroundColor: product.colorHex }}
              title={`Shade: ${product.color}`}
            />
          )}
        </div>

        <Link href={`/shop/${product.slug}`}>
          <h3 className="mb-1 line-clamp-2 text-sm font-semibold tracking-tight text-ink transition group-hover:text-brand sm:line-clamp-1 sm:text-base">
            {product.name}
          </h3>
        </Link>

        {rating && rating.count > 0 ? (
          <div className="mb-2 flex items-center gap-1.5">
            <StarRating value={rating.average} size="sm" />
            <span className="text-xs text-ink-mute">{rating.average.toFixed(1)}</span>
            <span className="text-xs text-ink-dim">({rating.count})</span>
          </div>
        ) : (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-ink-dim">
            <Beaker className="h-3 w-3" /> Lab verified
          </div>
        )}

        <p className="mb-3 hidden line-clamp-2 text-sm leading-relaxed text-ink-mute sm:block">
          {product.description}
        </p>

        <div className="mb-3 hidden flex-wrap gap-1.5 sm:flex">
          <VariantSwatches product={product} />
        </div>

        <div className="mt-auto space-y-3 border-t border-line pt-3 sm:space-y-4 sm:pt-4">
          <div className="flex items-end justify-between gap-2">
            <PriceBlock product={product} />
            <Link
              href={`/shop/${product.slug}`}
              className="hidden items-center gap-1 text-xs font-medium text-brand transition hover:text-brand-hi sm:inline-flex"
            >
              Details <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="flex items-center gap-2">
            {onQuickView && (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink-mute transition hover:border-brand hover:text-brand sm:flex"
                aria-label="Quick view"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <div className="min-w-0 flex-1 [&_button]:h-10 [&_button]:w-full [&_button]:rounded-xl [&_button]:text-[11px] sm:[&_button]:h-11 sm:[&_button]:text-xs">
              <AddToCartButton product={product} label="Add to Cart" showIcon />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function CatalogListCard({
  product,
  onQuickView,
  rating,
}: {
  product: Product;
  onQuickView?: (product: Product) => void;
  rating?: { average: number; count: number };
}) {
  return (
    <article className="product-card group relative flex flex-col overflow-hidden sm:flex-row">
      <div className="product-card-media relative flex items-center justify-center overflow-hidden aspect-square sm:aspect-auto sm:w-[240px] sm:shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="absolute inset-0 z-[1] h-full w-full object-contain p-5 transition duration-300 ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 z-[2] flex flex-col items-start gap-1.5">
          <StatusChip product={product} />
          <OfferBadge product={product} />
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <span className="tech-label text-ink-mute">{product.category}</span>
          <div className="flex items-center gap-2">
            {product.colorHex && (
              <span
                className="h-5 w-5 rounded-full border border-line shadow-sm"
                style={{ backgroundColor: product.colorHex }}
                title={`Shade: ${product.color}`}
              />
            )}
            <WishlistButton />
          </div>
        </div>

        <Link href={`/shop/${product.slug}`}>
          <h3 className="mb-1 text-base font-semibold tracking-tight text-ink transition group-hover:text-brand sm:text-lg">
            {product.name}
          </h3>
        </Link>

        {rating && rating.count > 0 ? (
          <div className="mb-2 flex items-center gap-1.5">
            <StarRating value={rating.average} size="sm" />
            <span className="text-xs text-ink-mute">{rating.average.toFixed(1)}</span>
            <span className="text-xs text-ink-dim">({rating.count} reviews)</span>
          </div>
        ) : (
          <div className="mb-2 flex items-center gap-1.5 text-xs text-ink-dim">
            <Beaker className="h-3 w-3" /> Lab verified formulation
          </div>
        )}

        <p className="mb-3 line-clamp-2 max-w-2xl text-sm leading-relaxed text-ink-mute">
          {product.description}
        </p>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <VariantSwatches product={product} limit={6} />
        </div>

        <div className="mt-auto flex flex-col items-start justify-between gap-4 border-t border-line pt-4 sm:flex-row sm:items-center">
          <PriceBlock product={product} />
          <div className="flex w-full items-center gap-2 sm:w-auto">
            {onQuickView && (
              <button
                type="button"
                onClick={() => onQuickView(product)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface text-ink-mute transition hover:border-brand hover:text-brand"
                aria-label="Quick view"
              >
                <Eye className="h-4 w-4" />
              </button>
            )}
            <Link
              href={`/shop/${product.slug}`}
              className="flex h-11 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-4 text-xs font-medium text-ink transition hover:border-line-hi hover:bg-surface-2"
            >
              Details <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <div className="min-w-0 flex-1 [&_button]:h-11 [&_button]:w-full [&_button]:rounded-xl [&_button]:text-xs sm:[&_button]:px-6">
              <AddToCartButton product={product} label="Add to Cart" showIcon />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export function DyeDataCard({
  product,
  onQuickView,
  rating,
}: {
  product: Product;
  onQuickView?: (product: Product) => void;
  rating?: { average: number; count: number };
}) {
  // Grid card is the new default catalog card.
  return <CatalogGridCard product={product} onQuickView={onQuickView} rating={rating} />;
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
      <div className="product-card-media relative aspect-square overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain p-4 transition duration-300 group-hover:scale-[1.04]"
        />
        <div className="absolute left-3 top-3 z-[2]">
          <OfferBadge product={product} />
        </div>
        {onQuickView && (
          <button
            type="button"
            onClick={() => onQuickView(product)}
            className="absolute inset-0 flex items-center justify-center bg-bg/40 text-sm font-medium text-ink opacity-0 transition group-hover:opacity-100"
          >
            <Eye className="mr-1.5 h-4 w-4" /> Quick View
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <Link href={`/shop/${product.slug}`}>
          <h4 className="mb-1 line-clamp-1 text-base font-semibold text-ink transition group-hover:text-brand">
            {product.name}
          </h4>
        </Link>
        <p className="mb-3 line-clamp-2 text-sm text-ink-mute">{product.description}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="font-semibold tabular-nums text-ink">
            {formatINR(product.price)}
            <span className="text-xs font-normal text-ink-mute">/{product.unit}</span>
          </span>
          <AddToCartButton product={product} variant="icon" />
        </div>
      </div>
    </article>
  );
}
