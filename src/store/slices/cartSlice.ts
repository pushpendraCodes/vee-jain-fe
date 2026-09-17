import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { CartItem } from "@/types";

const STORAGE_KEY = "vjain-cart";

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartItem[]) : [];
  } catch {
    return [];
  }
}

function persist(items: CartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function sameItem(a: CartItem, productId: string, variantId?: string) {
  return a.productId === productId && String(a.variantId || "") === String(variantId || "");
}

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] as CartItem[], hydrated: false },
  reducers: {
    hydrateCart(state) {
      state.items = loadCart();
      state.hydrated = true;
    },
    addToCart(state, action: PayloadAction<{ productId: string; quantity?: number; variantId?: string }>) {
      const qty = action.payload.quantity ?? 1;
      const variantId = action.payload.variantId || "";
      const existing = state.items.find((i) => sameItem(i, action.payload.productId, variantId));
      if (existing) existing.quantity += qty;
      else state.items.push({ productId: action.payload.productId, variantId, quantity: qty });
      persist(state.items);
    },
    setQuantity(state, action: PayloadAction<{ productId: string; quantity: number; variantId?: string }>) {
      const item = state.items.find((i) => sameItem(i, action.payload.productId, action.payload.variantId));
      if (!item) return;
      item.quantity = Math.max(1, action.payload.quantity);
      persist(state.items);
    },
    removeFromCart(state, action: PayloadAction<{ productId: string; variantId?: string } | string>) {
      if (typeof action.payload === "string") {
        state.items = state.items.filter((i) => i.productId !== action.payload);
      } else {
        state.items = state.items.filter(
          (i) => !sameItem(i, action.payload.productId, action.payload.variantId)
        );
      }
      persist(state.items);
    },
    clearCart(state) {
      state.items = [];
      persist(state.items);
    },
    setCartItems(state, action: PayloadAction<CartItem[]>) {
      state.items = action.payload;
      persist(state.items);
    },
  },
});

export const { hydrateCart, addToCart, setQuantity, removeFromCart, clearCart, setCartItems } =
  cartSlice.actions;
export default cartSlice.reducer;
