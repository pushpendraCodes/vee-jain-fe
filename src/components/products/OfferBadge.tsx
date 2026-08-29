import type { Product } from "@/types";

export function OfferBadge({ product, className = "" }: { product: Product; className?: string }) {
  if (!product.offer?.label) return null;
  return (
    <span
      className={`inline-flex items-center rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold text-white shadow-sm ${className}`}
    >
      {product.offer.label}
    </span>
  );
}
