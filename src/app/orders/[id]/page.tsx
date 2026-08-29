"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError, fetchOrder, fetchReviewEligibility, submitProductReview } from "@/lib/api";
import { formatINR } from "@/lib/format";
import { useAppSelector } from "@/store/hooks";
import { useToast } from "@/components/ui/Toast";
import type { Order, OrderStatus, ReviewEligibility } from "@/types";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Download,
  MapPin,
  MessageSquarePlus,
  Package,
  Phone,
  ShieldCheck,
  Star,
  Truck,
  XCircle,
} from "lucide-react";
import OrderInvoice from "@/components/orders/OrderInvoice";
import ReviewModal from "@/components/products/ReviewModal";
import { downloadInvoice, paymentMethodLabel } from "@/lib/invoice";

const STEPS: { id: string; label: string; statuses: OrderStatus[] }[] = [
  { id: "placed", label: "Placed", statuses: ["pending", "created", "paid", "processing", "shipped", "delivered"] },
  { id: "confirmed", label: "Confirmed", statuses: ["paid", "processing", "shipped", "delivered"] },
  { id: "processing", label: "Processing", statuses: ["processing", "shipped", "delivered"] },
  { id: "shipped", label: "Shipped", statuses: ["shipped", "delivered"] },
  { id: "delivered", label: "Delivered", statuses: ["delivered"] },
];

function statusLabel(status?: string) {
  if (!status) return "Unknown";
  return status.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusClass(status?: string) {
  if (status === "delivered") return "bg-emerald-50 text-emerald-700";
  if (status === "shipped" || status === "processing" || status === "paid") return "bg-sage-light text-forest";
  if (status === "failed" || status === "cancelled") return "bg-red-50 text-error";
  return "bg-cream text-text-secondary";
}

function formatOrderDate(value?: string) {
  if (!value) return "";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.token);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [eligibilityByProduct, setEligibilityByProduct] = useState<Record<string, ReviewEligibility>>({});
  const [reviewTarget, setReviewTarget] = useState<{ productId: string; name: string } | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    if (hydrated && !token) router.replace(`/login?next=/orders/${id}`);
  }, [hydrated, token, router, id]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchOrder(token, id);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Order not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, id]);

  useEffect(() => {
    if (!token || order?.status !== "delivered") {
      setEligibilityByProduct({});
      return;
    }
    const ids = [
      ...new Set(
        (order.items || [])
          .map((item) => item.productId || item.sku)
          .filter((value): value is string => Boolean(value))
      ),
    ];
    if (!ids.length) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        ids.map(async (productId) => {
          try {
            const eligibility = await fetchReviewEligibility(productId, token);
            return [productId, eligibility] as const;
          } catch {
            return [productId, { canReview: false, alreadyReviewed: false, reason: "not_purchased" as const }] as const;
          }
        })
      );
      if (!cancelled) setEligibilityByProduct(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, [token, order]);

  const currentStep = useMemo(() => {
    if (!order) return -1;
    return STEPS.reduce((idx, step, i) => (step.statuses.includes(order.status) ? i : idx), -1);
  }, [order]);

  const isTerminalFail = order?.status === "failed" || order?.status === "cancelled";

  const openReview = (productId: string, name: string) => {
    setReviewError("");
    setReviewTarget({ productId, name });
  };

  const handleSubmitReview = async (payload: { rating: number; description: string; images: File[] }) => {
    if (!token || !reviewTarget) return;
    setSubmittingReview(true);
    setReviewError("");
    try {
      await submitProductReview(reviewTarget.productId, token, payload);
      setEligibilityByProduct((prev) => ({
        ...prev,
        [reviewTarget.productId]: { canReview: false, alreadyReviewed: true, reason: "already_reviewed" },
      }));
      setReviewTarget(null);
      showToast("Review published", "Thank you for sharing your experience", "success");
    } catch (err) {
      setReviewError(err instanceof ApiError ? err.message : "Could not submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (!hydrated || !token) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-sage-light" />
        <p className="text-sm text-text-secondary">Checking account…</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-sage-light" />
        <p className="text-sm text-text-secondary">Loading order…</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] bg-white p-12 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-error">
            <XCircle className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary">Order not found</h3>
          <p className="mb-6 mt-1 text-sm text-text-secondary">{error || "This order could not be loaded."}</p>
          <Link href="/orders" className="vj-btn vj-btn-primary inline-flex h-11 px-8">
            Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const address = order.address;
  const itemCount = order.items?.reduce((n, i) => n + (i.quantity || 0), 0) || 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-5 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/orders"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-forest transition hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> All orders
          </Link>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            {order.id}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Placed {formatOrderDate(order.createdAt)}
            {itemCount ? ` · ${itemCount} item${itemCount === 1 ? "" : "s"}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider ${statusClass(order.status)}`}>
            {statusLabel(order.status)}
          </span>
          <button
            type="button"
            onClick={() => downloadInvoice(order)}
            className="vj-btn vj-btn-primary h-10 px-4 text-sm"
          >
            <Download className="h-4 w-4" /> Invoice
          </button>
        </div>
      </div>

      <section className="rounded-[1.75rem] bg-white p-5 shadow-sm sm:p-6">
        <p className="mb-5 text-[11px] font-semibold uppercase tracking-wider text-accent">Order status</p>
        {isTerminalFail ? (
          <div className="flex items-start gap-3 rounded-2xl bg-red-50 px-4 py-4 text-sm text-error">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">This order was {order.status}</p>
              <p className="mt-0.5 text-error/80">
                {order.paymentStatus === "failed"
                  ? "Payment did not go through. Place a new order from the catalog."
                  : "This order is no longer being fulfilled."}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-5 hidden h-1.5 overflow-hidden rounded-full bg-sage-light sm:block">
              <div
                className="h-full rounded-full bg-forest transition-all"
                style={{ width: `${Math.max(0, ((currentStep + 1) / STEPS.length) * 100)}%` }}
              />
            </div>
            <ol className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {STEPS.map((step, index) => {
              const done = index <= currentStep;
              const active = index === currentStep;
              return (
                <li key={step.id} className="flex flex-col items-center text-center">
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                      done ? "bg-forest text-on-dark" : "bg-sage-light text-text-secondary"
                    } ${active ? "ring-4 ring-forest/15" : ""}`}
                  >
                    {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : index + 1}
                  </span>
                  <span className={`mt-2 text-xs font-medium ${done ? "text-text-primary" : "text-text-secondary"}`}>
                    {step.label}
                  </span>
                </li>
              );
            })}
          </ol>
          </>
        )}
      </section>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <section className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-accent">Items</h2>
            {(order.items || []).map((item, idx) => {
              const productKey = item.productId || item.sku;
              const eligibility = productKey ? eligibilityByProduct[productKey] : undefined;
              return (
              <article
                key={`${item.productId || item.sku || item.name}-${idx}`}
                className="flex flex-col gap-3 rounded-[1.5rem] bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="flex flex-1 gap-4 sm:items-center">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-cream p-2">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt="" className="max-h-full max-w-full object-contain" />
                  ) : (
                    <Package className="h-7 w-7 text-forest" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold text-text-primary">{item.name}</h3>
                  {item.sku ? (
                    <p className="font-mono text-[10px] text-text-secondary">SKU: {item.sku}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-text-secondary">
                    Qty {item.quantity} · {formatINR(item.price)} each
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span className="block font-semibold tabular-nums text-text-primary">
                    {formatINR(item.price * item.quantity)}
                  </span>
                </div>
                </div>
                {order.status === "delivered" && productKey && eligibility?.alreadyReviewed ? (
                  <span className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-sage-light px-3 text-xs font-medium text-forest sm:ml-2">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" /> Reviewed
                  </span>
                ) : order.status === "delivered" && productKey ? (
                  <button
                    type="button"
                    onClick={() => openReview(productKey, item.name)}
                    className="vj-btn vj-btn-primary h-10 shrink-0 px-4 text-sm sm:ml-2"
                  >
                    <MessageSquarePlus className="h-4 w-4" /> Write a review
                  </button>
                ) : null}
              </article>
              );
            })}
          </section>

          <section className="rounded-[1.75rem] bg-white p-5 shadow-sm sm:p-6">
            <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
              <MapPin className="h-3.5 w-3.5" /> Shipping address
            </p>
            {address ? (
              <div className="text-sm leading-relaxed text-text-primary">
                <p className="font-semibold">{address.name || "Delivery address"}</p>
                {address.phone ? (
                  <p className="mt-1 inline-flex items-center gap-1.5 text-text-secondary">
                    <Phone className="h-3.5 w-3.5" /> +91 {address.phone}
                  </p>
                ) : null}
                <p className="mt-3 text-text-secondary">
                  {address.line1}
                  {address.line2 ? (
                    <>
                      <br />
                      {address.line2}
                    </>
                  ) : null}
                  <br />
                  {[address.city, address.state, address.pincode].filter(Boolean).join(", ")}
                </p>
                {address.gstin ? (
                  <p className="mt-3 font-mono text-xs text-text-secondary">GSTIN {address.gstin}</p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-text-secondary">No shipping address on this order.</p>
            )}
          </section>

          <OrderInvoice order={order} />
        </div>

        <div className="sticky top-24 space-y-4 lg:col-span-4">
          <section className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-semibold text-text-primary">Order summary</h2>
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="flex justify-between">
                <span>Subtotal ({itemCount})</span>
                <span className="font-semibold tabular-nums text-text-primary">{formatINR(order.subtotal)}</span>
              </div>
              {Number(order.discount) > 0 ? (
                <div className="flex justify-between text-accent">
                  <span>{order.offerTitle || "Offer"}{order.offerPercent ? ` · ${order.offerPercent}% off` : ""}</span>
                  <span className="font-semibold tabular-nums">-{formatINR(Number(order.discount) || 0)}</span>
                </div>
              ) : null}
              <div className="flex justify-between">
                <span className="inline-flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-accent" /> Freight
                </span>
                <span className="font-semibold tabular-nums text-text-primary">{formatINR(order.freight)}</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span className="font-semibold tabular-nums text-text-primary">{formatINR(order.gst)}</span>
              </div>
              <div className="border-t border-border-hairline pt-4">
                <span className="block text-[10px] font-medium uppercase tracking-wider text-text-secondary">
                  Total paid
                </span>
                <span className="text-2xl font-bold tabular-nums text-text-primary">{formatINR(order.total)}</span>
              </div>
            </div>
          </section>

          <section className="rounded-[1.75rem] bg-white p-6 shadow-sm">
            <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
              <CreditCard className="h-3.5 w-3.5" /> Payment
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-text-secondary">Method</span>
                <span className="font-medium text-text-primary">{paymentMethodLabel(order.paymentMethod)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-text-secondary">Status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${statusClass(order.paymentStatus)}`}>
                  {statusLabel(order.paymentStatus || "pending")}
                </span>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-[11px] text-text-secondary">
              <ShieldCheck className="h-4 w-4 text-success-green" /> Encrypted checkout
            </p>
          </section>

          <Link href="/shop" className="vj-btn vj-btn-primary h-12 w-full">
            Continue shopping
          </Link>
        </div>
      </div>

      {reviewTarget && (
        <ReviewModal
          key={reviewTarget.productId}
          productName={reviewTarget.name}
          submitting={submittingReview}
          error={reviewError}
          onClose={() => !submittingReview && setReviewTarget(null)}
          onSubmit={handleSubmitReview}
        />
      )}
    </div>
  );
}
