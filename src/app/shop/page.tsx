import { Suspense } from "react";
import ShopClient from "./ShopClient";

export default function ShopRoute() {
  return (
    <Suspense fallback={<div className="p-8 text-text-muted">Loading catalog…</div>}>
      <ShopClient />
    </Suspense>
  );
}
