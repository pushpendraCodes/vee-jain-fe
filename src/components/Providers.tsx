"use client";

import { useEffect } from "react";
import { Provider, useSelector } from "react-redux";
import { store, type RootState } from "@/store";
import { hydrateCart } from "@/store/slices/cartSlice";
import { hydrateAuth, logout, updateUser } from "@/store/slices/authSlice";
import { fetchMe } from "@/lib/api";
import { syncCartAfterLogin } from "@/lib/cartActions";
import { registerWebPush } from "@/lib/firebase";
import { ToastProvider } from "@/components/ui/Toast";
import { SiteProvider } from "@/components/site/SiteProvider";

function Persist() {
  const token = useSelector((s: RootState) => s.auth.token);
  const hydrated = useSelector((s: RootState) => s.auth.hydrated);

  useEffect(() => {
    store.dispatch(hydrateCart());
    store.dispatch(hydrateAuth());
  }, []);

  useEffect(() => {
    if (!hydrated || !token || token.startsWith("demo-")) return;

    let cancelled = false;
    (async () => {
      try {
        const user = await fetchMe(token);
        if (cancelled) return;
        store.dispatch(updateUser(user));
        await syncCartAfterLogin(token);
        void registerWebPush(token);
      } catch {
        if (!cancelled) store.dispatch(logout());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hydrated, token]);

  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ToastProvider>
        <SiteProvider>
          <Persist />
          {children}
        </SiteProvider>
      </ToastProvider>
    </Provider>
  );
}
