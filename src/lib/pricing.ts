import type { Product, ProductVariant } from "@/types";

function variantDisplayName(size?: string, shade?: string, fallback = "") {
  const s = String(size || "").trim();
  const sh = String(shade || "").trim();
  if (s && sh) return `${s} / ${sh}`;
  return s || sh || fallback || "Standard";
}

export function productVariants(product: Product): ProductVariant[] {
  if (Array.isArray(product.variants) && product.variants.length) {
    return product.variants.map((v) => ({
      id: String(v.id),
      size: v.size || v.name || "",
      shade: v.shade || "",
      name: variantDisplayName(v.size || v.name, v.shade, v.name),
      sku: v.sku || "",
      price: Number(v.price) || 0,
      stock: Number(v.stock) || 0,
      images: v.images || [],
    }));
  }
  return [
    {
      id: "standard",
      size: "Standard",
      shade: "",
      name: "Standard",
      sku: product.sku,
      price: Number(product.price) || 0,
      stock: Number(product.stockKg) || 0,
      images: product.images?.map((url) => ({ url })) || (product.image ? [{ url: product.image }] : []),
    },
  ];
}

export function findVariant(product: Product, variantId?: string): ProductVariant {
  const list = productVariants(product);
  return list.find((v) => v.id === variantId) || list[0];
}

function unique(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export function variantSizes(product: Product): string[] {
  return unique(productVariants(product).map((v) => v.size || ""));
}

export function variantShades(product: Product): string[] {
  return unique(productVariants(product).map((v) => v.shade || ""));
}

export function findVariantByOptions(product: Product, size?: string, shade?: string): ProductVariant {
  const list = productVariants(product);
  const sizeOk = (v: ProductVariant) => !size || (v.size || "") === size;
  const shadeOk = (v: ProductVariant) => !shade || (v.shade || "") === shade;
  return (
    list.find((v) => sizeOk(v) && shadeOk(v) && v.stock > 0) ||
    list.find((v) => sizeOk(v) && shadeOk(v)) ||
    list.find((v) => sizeOk(v) && v.stock > 0) ||
    list.find((v) => shadeOk(v) && v.stock > 0) ||
    list.find((v) => sizeOk(v)) ||
    list.find((v) => shadeOk(v)) ||
    list[0]
  );
}

export function optionInStock(product: Product, size?: string, shade?: string) {
  return productVariants(product).some((v) => {
    if (size && (v.size || "") !== size) return false;
    if (shade && (v.shade || "") !== shade) return false;
    return v.stock > 0;
  });
}

const NAMED_SHADES: Record<string, string> = {
  red: "#c0392b",
  crimson: "#c0392b",
  blue: "#2563eb",
  navy: "#1e3a5f",
  yellow: "#d4a017",
  gold: "#c9a227",
  green: "#3d7a4a",
  orange: "#d4854a",
  violet: "#6d28d9",
  purple: "#6d28d9",
  black: "#1a1a1a",
  brown: "#6b3f2a",
  white: "#f4f1ec",
  pink: "#db7093",
  grey: "#6b7280",
  gray: "#6b7280",
};

export function shadeSwatch(shade: string) {
  const key = shade.trim().toLowerCase();
  if (key.startsWith("#") && /^#[0-9a-f]{3,8}$/i.test(key)) return shade.trim();
  if (NAMED_SHADES[key]) return NAMED_SHADES[key];
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) hash = key.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 42% 46%)`;
}

export function unitPriceForQty(product: Product, _qty: number, variantId?: string): number {
  const variant = findVariant(product, variantId);
  return Math.round((Number(variant.price) || Number(product.price) || 0) * 100) / 100;
}

/** @deprecated volume tiers removed — kept for any leftover imports */
export function productTiers() {
  return [];
}

export function tierLabel() {
  return "";
}

export function tierUnitPrice(product: Product) {
  return Number(product.price) || 0;
}
