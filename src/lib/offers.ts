import type { CatalogOffer, Product } from "@/types";

function keysOf(product: { id?: string; _id?: string; slug?: string; sku?: string; code?: string } | null | undefined) {
  if (!product) return [];
  return [product.id, product._id, product.slug, product.sku, product.code]
    .map((v) => String(v || "").trim())
    .filter(Boolean);
}

export function offerAppliesToProduct(offer: CatalogOffer, product: Product) {
  if (offer.appliesTo !== "products") return true;
  const keys = new Set(keysOf(product));
  const listed = offer.products?.length ? offer.products : (offer.productIds || []).map((id) => ({ id }));
  return listed.some((item) => keysOf(item).some((k) => keys.has(k)));
}

export function applicableOffers(offers: CatalogOffer[], products: Product[]) {
  return (offers || []).filter((offer) => products.some((product) => offerAppliesToProduct(offer, product)));
}

export function offerDiscountForLines(
  offer: CatalogOffer | null | undefined,
  lines: Array<{ product: Product; quantity: number; lineTotal: number }>
) {
  if (!offer) return 0;
  const eligible = lines.filter((line) => offerAppliesToProduct(offer, line.product));
  const base = eligible.reduce((n, line) => n + line.lineTotal, 0);
  return Math.round(base * (Number(offer.discountPercent) / 100) * 100) / 100;
}
