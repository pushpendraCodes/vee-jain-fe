"use client";

import {
  findVariant,
  findVariantByOptions,
  optionInStock,
  shadeSwatch,
  variantShades,
  variantSizes,
} from "@/lib/pricing";
import type { Product } from "@/types";

export default function VariantPicker({
  product,
  variantId,
  onChange,
  compact = false,
}: {
  product: Product;
  variantId: string;
  onChange: (id: string) => void;
  compact?: boolean;
}) {
  const selected = findVariant(product, variantId);
  const sizes = variantSizes(product);
  const shades = variantShades(product);
  const selectedSize = selected.size || sizes[0] || "";
  const selectedShade = selected.shade || shades[0] || "";
  const low = Math.max(0, Number(product.stockAlertLimit ?? 10));
  const out = selected.stock <= 0;
  const lowStock = !out && selected.stock <= low;

  if (!sizes.length && !shades.length) return null;

  function pick(size?: string, shade?: string) {
    const next = findVariantByOptions(product, size, shade);
    onChange(next.id);
  }

  return (
    <div className={compact ? "space-y-3" : "space-y-4"}>
      {sizes.length ? (
        <div>
          <p className="mb-2 text-sm text-text-primary">
            Size: <span className="font-semibold">{selectedSize || "—"}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {sizes.map((size) => {
              const active = selectedSize === size;
              const available = optionInStock(product, size, shades.length ? selectedShade : undefined) || optionInStock(product, size);
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => pick(size, selectedShade)}
                  className={`relative min-w-13 rounded-md border px-3 py-1.5 text-sm transition ${
                    active
                      ? "border-line-hi bg-surface font-semibold text-text-primary ring-1 ring-forest"
                      : "border-line bg-surface text-text-primary hover:border-line-hi/50"
                  } ${available ? "" : "text-text-secondary"}`}
                  aria-pressed={active}
                >
                  {size}
                  {!available ? (
                    <span className="pointer-events-none absolute inset-x-1 top-1/2 h-px -rotate-12 bg-text-secondary/50" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {shades.length ? (
        <div>
          <p className="mb-2 text-sm text-text-primary">
            Shade: <span className="font-semibold">{selectedShade || "—"}</span>
          </p>
          <div className="flex flex-wrap items-center gap-2.5">
            {shades.map((shade) => {
              const active = selectedShade === shade;
              const available = optionInStock(product, sizes.length ? selectedSize : undefined, shade) || optionInStock(product, undefined, shade);
              const hex = shadeSwatch(shade);
              return (
                <button
                  key={shade}
                  type="button"
                  title={shade}
                  onClick={() => pick(selectedSize, shade)}
                  className={`group flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm transition ${
                    active
                      ? "border-line-hi bg-surface ring-1 ring-forest"
                      : "border-line bg-surface hover:border-line-hi/50"
                  }`}
                  aria-pressed={active}
                  aria-label={shade}
                >
                  <span
                    className={`relative h-6 w-6 shrink-0 rounded-full border ${active ? "border-line-hi" : "border-black/10"}`}
                    style={{ backgroundColor: hex }}
                  >
                    {!available ? <span className="absolute inset-x-0.5 top-1/2 h-px -rotate-12 bg-surface" /> : null}
                  </span>
                  <span className={`pr-1 ${active ? "font-semibold text-text-primary" : "text-text-secondary"}`}>{shade}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="space-y-0.5">
        <p
          className={`text-sm font-semibold ${
            out ? "text-ink" : lowStock ? "text-ink-mute" : "text-ink-mute"
          }`}
        >
          {out ? "Currently unavailable" : lowStock ? `Only ${selected.stock} ${product.unit} left` : "In stock"}
        </p>
        {!out ? (
          <p className="text-xs text-text-secondary">
            {selected.stock} {product.unit} available
            {selected.sku ? ` · SKU ${selected.sku}` : ""}
          </p>
        ) : selected.sku ? (
          <p className="text-xs text-text-secondary">SKU {selected.sku}</p>
        ) : null}
      </div>
    </div>
  );
}
