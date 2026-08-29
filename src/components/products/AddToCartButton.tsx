"use client";

import { useState } from "react";
import { cartAdd } from "@/lib/cartActions";
import Icon from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/types";

export default function AddToCartButton({
  product,
  variant = "primary",
  label,
  quantity = 1,
}: {
  product: Product;
  variant?: "primary" | "outline" | "icon";
  label?: string;
  quantity?: number;
}) {
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const { showToast } = useToast();
  const disabled = product.status === "preorder";
  const defaultLabel = disabled ? "Request Restock" : "Add to Cart";
  const text = label ?? defaultLabel;

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) {
      showToast("Restock Request Sent", `We will notify you when ${product.name} is available.`, "info");
      return;
    }

    setLoading(true);
    try {
      await cartAdd(product.id, quantity);
      setAdded(true);
      showToast(`Added to Cart`, `${quantity} ${product.unit} of ${product.name}`, "success");
      setTimeout(() => setAdded(false), 2000);
    } catch {
      showToast("Could not add item", "Please try again", "error");
    } finally {
      setLoading(false);
    }
  };

  if (variant === "icon") {
    return (
      <button
        onClick={onClick}
        disabled={loading}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition duration-150 ${
          added
            ? "bg-success-green text-white"
            : "bg-forest text-on-dark hover:bg-accent hover:text-white"
        } active:scale-95 disabled:opacity-50`}
        aria-label="Add to cart"
      >
        <Icon
          name={added ? "check" : loading ? "sync" : "add"}
          className={`text-[18px] ${loading ? "animate-spin" : ""}`}
        />
      </button>
    );
  }

  if (variant === "outline") {
    return (
      <button
        onClick={onClick}
        disabled={loading}
        className={`vj-btn h-11 w-full px-4 text-xs ${
          added
            ? "bg-success-green text-white"
            : "border border-border-hairline bg-transparent text-text-primary hover:bg-forest hover:text-on-dark"
        } disabled:opacity-50`}
      >
        <Icon
          name={added ? "check" : loading ? "sync" : "shopping_cart"}
          className={`text-[16px] ${loading ? "animate-spin" : ""}`}
        />
        {added ? "Added!" : text}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`vj-btn h-11 px-5 text-xs ${
        added
          ? "bg-success-green text-white"
          : disabled
            ? "bg-cream text-text-secondary"
            : "bg-forest text-on-dark hover:bg-accent hover:text-white"
      } disabled:opacity-50`}
    >
      <Icon
        name={added ? "check" : loading ? "sync" : disabled ? "mail" : "shopping_cart"}
        className={`text-[16px] ${loading ? "animate-spin" : ""}`}
      />
      {added ? "Added!" : text}
    </button>
  );
}
