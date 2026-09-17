"use client";

import { useState } from "react";
import { cartAdd } from "@/lib/cartActions";
import { hapticTap } from "@/lib/haptic";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/types";

type Burst = { id: number; amount: number };

export default function AddToCartButton({
  product,
  variant = "primary",
  label,
  quantity = 1,
  showIcon = true,
  variantId = "",
}: {
  product: Product;
  variant?: "primary" | "outline" | "icon";
  label?: string;
  quantity?: number;
  showIcon?: boolean;
  variantId?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const { showToast } = useToast();
  const disabled = product.status === "preorder";
  const defaultLabel = disabled ? "Request Restock" : "Add to Cart";
  const text = label ?? defaultLabel;

  const spawnBurst = (amount: number) => {
    const id = Date.now() + Math.random();
    setBursts((prev) => [...prev, { id, amount }]);
    window.setTimeout(() => {
      setBursts((prev) => prev.filter((b) => b.id !== id));
    }, 900);
  };

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) {
      showToast("Restock Request Sent", `We will notify you when ${product.name} is available.`, "info");
      return;
    }

    setLoading(true);
    try {
      await cartAdd(product.id, quantity, variantId);
      hapticTap([14, 40, 22]);
      spawnBurst(quantity);
      setAdded(true);
      showToast(`Added to Cart`, `${quantity} ${product.unit} of ${product.name}`, "success");
      setTimeout(() => setAdded(false), 2000);
    } catch {
      showToast("Could not add item", "Please try again", "error");
    } finally {
      setLoading(false);
    }
  };

  const burstLayer =
    bursts.length > 0 ? (
      <span className="pointer-events-none absolute inset-0 z-20 overflow-visible" aria-hidden="true">
        {bursts.map((burst) => (
          <span
            key={burst.id}
            className="cart-plus-burst absolute left-1/2 top-0 -translate-x-1/2 font-display text-sm font-bold tabular-nums text-accent"
          >
            +{burst.amount}
          </span>
        ))}
      </span>
    ) : null;

  if (variant === "icon") {
    return (
      <span className="relative inline-flex">
        {burstLayer}
        <button
          onClick={onClick}
          disabled={loading}
          className={`flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-ink transition duration-150 hover:border-brand hover:text-brand active:scale-95 disabled:opacity-50 ${
            added ? "border-success-green bg-success-green text-white scale-110" : ""
          }`}
          aria-label="Add to cart"
        >
          <Icon
            name={added ? "check" : loading ? "sync" : "add"}
            className={`text-[18px] ${loading ? "animate-spin" : ""}`}
          />
        </button>
      </span>
    );
  }

  if (variant === "outline") {
    return (
      <span className="relative inline-flex w-full">
        {burstLayer}
        <button
          onClick={onClick}
          disabled={loading}
          className={`vj-btn h-11 w-full px-4 text-xs ${
            added
              ? "bg-success-green text-white"
              : "border border-line bg-transparent text-ink hover:border-brand hover:text-brand"
          } disabled:opacity-50`}
        >
          {showIcon ? (
            <Icon
              name={added ? "check" : loading ? "sync" : "shopping_cart"}
              className={`text-[16px] ${loading ? "animate-spin" : ""}`}
            />
          ) : null}
          {added ? "Added!" : text}
        </button>
      </span>
    );
  }

  return (
    <span className="relative inline-flex w-full">
      {burstLayer}
      <button
        onClick={onClick}
        disabled={loading}
        className={`vj-btn h-11 w-full px-5 text-xs ${
          added
            ? "bg-success-green text-white"
            : disabled
              ? "bg-surface-2 text-ink-dim"
              : "bg-brand text-brand-ink hover:bg-brand-hi"
        } disabled:opacity-50`}
      >
        {showIcon ? (
          <Icon
            name={added ? "check" : loading ? "sync" : disabled ? "mail" : "shopping_cart"}
            className={`text-[16px] ${loading ? "animate-spin" : ""}`}
          />
        ) : null}
        {added ? "Added!" : text}
      </button>
    </span>
  );
}
