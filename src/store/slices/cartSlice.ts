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

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] as CartItem[], hydrated: false },
  reducers: {
    hydrateCart(state) {
      state.items = loadCart();
      state.hydrated = true;
    },
    addToCart(state, action: PayloadAction<{ productId: string; quantity?: number }>) {
      const qty = action.payload.quantity ?? 1;
      const existing = state.items.find((i) => i.productId === action.payload.productId);
      if (existing) existing.quantity += qty;
      else state.items.push({ productId: action.payload.productId, quantity: qty });
      persist(state.items);
    },
    setQuantity(state, action: PayloadAction<{ productId: string; quantity: number }>) {
      const item = state.items.find((i) => i.productId === action.payload.productId);
      if (!item) return;
      item.quantity = Math.max(1, action.payload.quantity);
      persist(state.items);
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter((i) => i.productId !== action.payload);
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
