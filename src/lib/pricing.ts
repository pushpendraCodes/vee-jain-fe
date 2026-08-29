import type { Product, VolumeTier } from "@/types";

export const DEFAULT_VOLUME_TIERS: VolumeTier[] = [
  { minQty: 1, discountPercent: 0 },
  { minQty: 100, discountPercent: 5 },
  { minQty: 500, discountPercent: 10 },
];

export function productTiers(product: Product): VolumeTier[] {
  const list = Array.isArray(product.volumeTiers) ? product.volumeTiers.filter((t) => Number(t.minQty) > 0) : [];
  return (list.length ? list : DEFAULT_VOLUME_TIERS).slice().sort((a, b) => a.minQty - b.minQty);
}

export function unitPriceForQty(product: Product, qty: number): number {
  const amount = Math.max(1, Number(qty) || 1);
  const tiers = productTiers(product);
  let match = tiers[0];
  for (const tier of tiers) {
    if (amount >= Number(tier.minQty)) match = tier;
  }
  if (!match) return Number(product.price) || 0;
  if (Number(match.price) > 0) return Math.round(Number(match.price) * 100) / 100;
  const discount = Math.min(90, Math.max(0, Number(match.discountPercent) || 0));
  return Math.round(Number(product.price) * (1 - discount / 100) * 100) / 100;
}

export function tierLabel(tier: VolumeTier, next: VolumeTier | undefined, unit: string) {
  if (tier.label?.trim()) return tier.label.trim();
  const min = Number(tier.minQty) || 1;
  if (next) return `${min}–${Number(next.minQty) - 1} ${unit}`;
  const discount = Number(tier.discountPercent) || 0;
  if (discount > 0) return `${min}+ · ${discount}% off`;
  return `${min}+ ${unit}`;
}

export function tierUnitPrice(product: Product, tier: VolumeTier) {
  if (Number(tier.price) > 0) return Math.round(Number(tier.price) * 100) / 100;
  const discount = Math.min(90, Math.max(0, Number(tier.discountPercent) || 0));
  return Math.round(Number(product.price) * (1 - discount / 100) * 100) / 100;
}
