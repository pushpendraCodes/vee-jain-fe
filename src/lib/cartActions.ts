"use client";

import {
  addCartItem,
  clearServerCart,
  fetchCart,
  removeCartItem,
  updateCartItem,
} from "@/lib/api";
import { store } from "@/store";
import {
  addToCart,
  clearCart,
  removeFromCart,
  setCartItems,
  setQuantity,
} from "@/store/slices/cartSlice";

function token() {
  return store.getState().auth.token;
}

/** Local Redux cart + optional server sync when logged in */
export async function cartAdd(productId: string, quantity = 1) {
  store.dispatch(addToCart({ productId, quantity }));
  const t = token();
  if (!t || t.startsWith("demo-")) return;
  try {
    const cart = await addCartItem(t, productId, quantity);
    store.dispatch(
      setCartItems(cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })))
    );
  } catch {
    /* keep local cart */
  }
}

export async function cartSetQuantity(productId: string, quantity: number) {
  if (quantity <= 0) {
    await cartRemove(productId);
    return;
  }
  store.dispatch(setQuantity({ productId, quantity }));
  const t = token();
  if (!t || t.startsWith("demo-")) return;
  try {
    const cart = await updateCartItem(t, productId, quantity);
    store.dispatch(
      setCartItems(cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })))
    );
  } catch {
    /* keep local */
  }
}

export async function cartRemove(productId: string) {
  store.dispatch(removeFromCart(productId));
  const t = token();
  if (!t || t.startsWith("demo-")) return;
  try {
    await removeCartItem(t, productId);
  } catch {
    /* keep local */
  }
}

export async function cartClear() {
  store.dispatch(clearCart());
  const t = token();
  if (!t || t.startsWith("demo-")) return;
  try {
    await clearServerCart(t);
  } catch {
    /* ignore */
  }
}

/** Pull server cart after login; merge local guest items up first */
export async function syncCartAfterLogin(authToken: string) {
  const local = store.getState().cart.items;
  try {
    for (const item of local) {
      await addCartItem(authToken, item.productId, item.quantity);
    }
    const cart = await fetchCart(authToken);
    store.dispatch(
      setCartItems(cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity })))
    );
  } catch {
    /* keep local cart if sync fails */
  }
}
