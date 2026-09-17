"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { fetchMyOrders } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";
import type { Order } from "@/types";
import { ArrowRight, Package } from "lucide-react";

export default function OrdersPage() {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.token);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hydrated && !token) router.replace("/login?next=/orders");
  }, [hydrated, token, router]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await fetchMyOrders(token);
        if (!cancelled) setOrders(list);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!hydrated || !token) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-surface-2" />
        <p className="text-sm text-text-secondary">Checking account…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-surface-2" />
        <p className="text-sm text-text-secondary">Loading orders…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
          My Orders
        </h1>
        <p className="mt-1 text-base text-text-secondary">
          Track dye and chemical shipments from placement to delivery.
        </p>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      {orders.length === 0 ? (
        <div className="my-6 rounded-2xl bg-surface p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-ink">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary">No orders yet</h3>
          <p className="mb-6 mt-1 text-sm text-text-secondary">
            Explore high-purity dyes, screen inks, and auxiliaries.
          </p>
          <Link href="/shop" className="vj-btn vj-btn-primary inline-flex h-11 px-8">
            Browse Catalog <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/orders/${o.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl bg-surface p-5 transition hover:bg-surface-2/30"
            >
              <div className="min-w-0">
                <span className="block font-mono text-[10px] font-medium uppercase tracking-wider text-text-secondary">
                  Order
                </span>
                <h3 className="truncate text-base font-semibold text-text-primary">{o.id}</h3>
                <p className="mt-1 text-sm text-text-secondary">
                  {o.items?.length || 0} items · {formatINR(o.total)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-2 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink">
                {o.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
