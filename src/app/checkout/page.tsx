"use client";

import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { ApiError, createOrder, fetchMyCredit, fetchOffers, fetchProducts, verifyCredit, verifyPayment } from "@/lib/api";
import { cartClear } from "@/lib/cartActions";
import { formatINR } from "@/lib/format";
import { unitPriceForQty } from "@/lib/pricing";
import { applicableOffers, offerDiscountForLines } from "@/lib/offers";
import { FREIGHT_FLAT, GST_RATE } from "@/lib/constants";
import { useAppSelector } from "@/store/hooks";
import type { CatalogOffer, PaymentMethod, Product } from "@/types";

let razorpayLoader: Promise<void> | null = null;

function loadRazorpay() {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  if (razorpayLoader) return razorpayLoader;

  razorpayLoader = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src*="checkout.razorpay.com"]');
    const done = () => {
      if (window.Razorpay) resolve();
      else reject(new Error("Unable to load Razorpay checkout"));
    };
    if (existing) {
      if (window.Razorpay) {
        resolve();
        return;
      }
      existing.addEventListener("load", done, { once: true });
      existing.addEventListener("error", () => reject(new Error("Unable to load Razorpay checkout")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = done;
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
    document.body.appendChild(script);
    window.setTimeout(() => {
      if (!window.Razorpay) reject(new Error("Unable to load Razorpay checkout"));
    }, 12000);
  }).catch((err) => {
    razorpayLoader = null;
    throw err;
  });

  return razorpayLoader;
}

function checkoutErrorMessage(err: unknown) {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return "Checkout failed. Please try again.";
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useAppSelector((s) => s.cart.items);
  const user = useAppSelector((s) => s.auth.user);
  const token = useAppSelector((s) => s.auth.token);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const [method, setMethod] = useState<PaymentMethod>("razorpay");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [offers, setOffers] = useState<CatalogOffer[]>([]);
  const [offerId, setOfferId] = useState("");
  const [showExtras, setShowExtras] = useState(false);
  const [showItems, setShowItems] = useState(false);
  const [creditAvailable, setCreditAvailable] = useState<number | null>(null);
  const [creditStatus, setCreditStatus] = useState("");
  const submitting = useRef(false);
  const [form, setForm] = useState({
    email: "",
    phone: "",
    firstName: "",
    lastName: "",
    company: "",
    line1: "",
    line2: "",
    city: "Ahmedabad",
    state: "Gujarat",
    pincode: "",
  });

  useEffect(() => {
    if (hydrated && !user) router.replace("/login?next=/checkout");
  }, [hydrated, user, router]);

  useEffect(() => {
    if (!user) return;
    setForm((f) => ({
      ...f,
      email: user.email || f.email,
      phone: user.phone || f.phone,
      firstName: user.name?.split(" ")[0] || f.firstName,
      lastName: user.name?.split(" ").slice(1).join(" ") || f.lastName,
      company: user.company?.name || f.company,
      line1: user.address?.line1 || f.line1,
      line2: user.address?.line2 || f.line2,
      city: user.address?.city || f.city,
      state: user.address?.state || f.state,
      pincode: user.address?.pincode || f.pincode,
    }));
    if (user.company?.name || user.address?.line2) setShowExtras(true);
  }, [user]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetchMyCredit(token)
      .then((data) => {
        if (cancelled) return;
        if (data.account?.status === "active") {
          setCreditAvailable(data.account.available);
          setCreditStatus("active");
        } else {
          setCreditAvailable(null);
          setCreditStatus(data.account?.status || "");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCreditAvailable(null);
          setCreditStatus("");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [products, liveOffers] = await Promise.all([fetchProducts(), fetchOffers()]);
        if (!cancelled) {
          setCatalog(products);
          setOffers(liveOffers);
        }
      } catch {
        if (!cancelled) {
          setCatalog([]);
          setOffers([]);
        }
      } finally {
        if (!cancelled) setCatalogReady(true);
      }
    })();
    void loadRazorpay().catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  const lines = useMemo(
    () =>
      items
        .map((i) => {
          const product = catalog.find((p) => p.id === i.productId || p.slug === i.productId);
          return product ? { ...i, product } : null;
        })
        .filter(Boolean) as { productId: string; quantity: number; product: Product }[],
    [items, catalog]
  );

  const availableOffers = useMemo(() => applicableOffers(offers, lines.map((l) => l.product)), [offers, lines]);
  const selectedOffer = availableOffers.find((offer) => offer.id === offerId) || null;

  useEffect(() => {
    if (offerId && !availableOffers.some((offer) => offer.id === offerId)) setOfferId("");
  }, [offerId, availableOffers]);
  const lineTotals = lines.map((l) => ({
    product: l.product,
    quantity: l.quantity,
    lineTotal: unitPriceForQty(l.product, l.quantity) * l.quantity,
  }));
  const subtotal = lineTotals.reduce((n, l) => n + l.lineTotal, 0);
  const discount = offerDiscountForLines(selectedOffer, lineTotals);
  const freight = lines.length ? FREIGHT_FLAT : 0;
  const gst = (Math.max(0, subtotal - discount) + freight) * GST_RATE;
  const total = Math.max(0, subtotal - discount) + freight + gst;

  const methods = useMemo(() => {
    const rows: Array<{ id: PaymentMethod; title: string; short: string; desc: string; icon: string }> = [
      { id: "razorpay", title: "Credit / Debit Card", short: "Card", desc: "Visa, MasterCard, RuPay — via Razorpay", icon: "credit_card" },
      { id: "upi", title: "UPI (GPay, PhonePe, Paytm)", short: "UPI", desc: "Pay instantly using UPI ID or QR Code", icon: "qr_code_scanner" },
      { id: "netbanking", title: "Net Banking", short: "Net banking", desc: "All major Indian banks supported", icon: "account_balance" },
      { id: "rtgs", title: "NEFT / RTGS (Offline Transfer)", short: "NEFT / RTGS", desc: "Proforma invoice generated. Order processed upon realization.", icon: "corporate_fare" },
    ];
    if (creditStatus === "active") {
      rows.push({
        id: "credit",
        title: "Business Credit",
        short: "Credit",
        desc: creditAvailable != null
          ? `Charge your approved account · ${formatINR(creditAvailable)} available`
          : "Charge this order to your approved business credit account",
        icon: "account_balance_wallet",
      });
    }
    return rows;
  }, [creditStatus, creditAvailable]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lines.length || submitting.current) return;
    if (!user || !token) {
      router.push("/login?next=/checkout");
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError("");
    const payload = {
      items: lines.map((l) => ({
        productId: l.product.id || l.product._id || l.productId,
        quantity: l.quantity,
      })),
      paymentMethod: method,
      email: form.email.trim(),
      offerId: selectedOffer?.id || undefined,
      address: {
        name: `${form.firstName} ${form.lastName}`.trim(),
        phone: form.phone,
        line1: form.line1,
        line2: form.line2,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        gstin: user.company?.gstin || "",
      },
    };

    try {
      if (method === "credit") {
        await verifyCredit(token, total);
      }
      const data = await createOrder(token, payload);
      const payment = data.payment;

      if (payment?.razorpayOrderId && payment?.keyId) {
        await loadRazorpay();
        if (!window.Razorpay) {
          setError("Unable to load Razorpay checkout");
          submitting.current = false;
          setBusy(false);
          return;
        }
        let completed = false;
        const rzp = new window.Razorpay({
          key: payment.keyId,
          amount: payment.amount,
          currency: payment.currency || "INR",
          name: payment.name || "Vee Jain Dyes & Chemicals",
          description: payment.description,
          order_id: payment.razorpayOrderId,
          prefill: payment.prefill,
          retry: { enabled: true, max_count: 1 },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            completed = true;
            try {
              const verified = await verifyPayment(token, response);
              await cartClear();
              router.push(`/orders/${verified.order.id}`);
            } catch (err) {
              setError(
                err instanceof ApiError
                  ? err.message
                  : "Payment succeeded but order could not be confirmed. Please contact us."
              );
              submitting.current = false;
              setBusy(false);
            }
          },
          modal: {
            ondismiss: () => {
              if (completed) return;
              submitting.current = false;
              setBusy(false);
              setError("Payment cancelled. No order was placed.");
            },
          },
        });
        rzp.on?.("payment.failed", () => {
          completed = true;
          submitting.current = false;
          setBusy(false);
          setError("Payment failed. No order was placed.");
        });
        rzp.open();
        return;
      }

      if (!data.order?.id) {
        setError("Checkout could not be started. Please try again.");
        submitting.current = false;
        setBusy(false);
        return;
      }

      await cartClear();
      router.push(`/orders/${data.order.id}`);
    } catch (err) {
      setError(checkoutErrorMessage(err));
      submitting.current = false;
      setBusy(false);
    }
  };

  if (!hydrated || !user) {
    return <div className="p-12 text-center text-text-muted">Checking account…</div>;
  }

  if (!catalogReady) {
    return <div className="p-12 text-center text-text-muted">Preparing checkout…</div>;
  }

  if (!items.length) {
    return (
      <div className="mx-auto max-w-xl p-12 text-center">
        <p className="mb-4 text-text-secondary">Your cart is empty.</p>
        <button onClick={() => router.push("/shop")} className="vj-btn vj-btn-accent h-11 px-6">
          Go to shop
        </button>
      </div>
    );
  }

  if (!lines.length) {
    return (
      <div className="mx-auto max-w-xl p-12 text-center">
        <p className="mb-4 text-text-secondary">Could not load the products in your cart. Please refresh and try again.</p>
        <button onClick={() => window.location.reload()} className="vj-btn vj-btn-accent h-11 px-6">
          Refresh
        </button>
      </div>
    );
  }

  const itemCount = lines.reduce((n, l) => n + l.quantity, 0);

  return (
    <form onSubmit={onSubmit} className="px-4 py-4 pb-28 sm:px-6 md:py-8 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-3 flex items-center justify-between md:mb-8">
          <h1 className="font-display text-2xl font-bold tracking-tight text-text-primary md:text-3xl lg:text-4xl">Checkout</h1>
          <span className="hidden items-center gap-2 text-sm text-text-secondary sm:flex">
            <Icon name="lock" fill className="text-ink" /> Secure Checkout
          </span>
        </div>

        <div className="flex flex-col gap-3 md:gap-8 lg:flex-row">
          <div className="flex flex-1 flex-col gap-3 md:gap-8">
            <section className="rounded-2xl bg-surface p-4 md:rounded-2xl md:p-6">
              <div className="mb-3 flex items-center gap-2 border-b border-line pb-2 md:mb-6 md:gap-3 md:pb-3">
                <Icon name="local_shipping" className="text-ink" />
                <h2 className="text-base font-semibold text-text-primary md:text-lg">Your details</h2>
              </div>
              <div className="grid grid-cols-2 gap-2.5 md:gap-4">
                <div>
                  <label className="industrial-label">First name</label>
                  <input className="industrial-input !rounded-xl !px-3 !py-2.5" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                </div>
                <div>
                  <label className="industrial-label">Last name</label>
                  <input className="industrial-input !rounded-xl !px-3 !py-2.5" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                </div>
                <div>
                  <label className="industrial-label">Email</label>
                  <input className="industrial-input !rounded-xl !px-3 !py-2.5" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
                </div>
                <div>
                  <label className="industrial-label">Phone</label>
                  <input className="industrial-input !rounded-xl !px-3 !py-2.5" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
                </div>
                <div className="col-span-2">
                  <label className="industrial-label">Address</label>
                  <input className="industrial-input !rounded-xl !px-3 !py-2.5" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} required placeholder="Factory / warehouse" />
                </div>
                <div>
                  <label className="industrial-label">City</label>
                  <input className="industrial-input !rounded-xl !px-3 !py-2.5" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
                </div>
                <div>
                  <label className="industrial-label">State</label>
                  <input className="industrial-input !rounded-xl !px-3 !py-2.5" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="industrial-label">PIN code</label>
                  <input className="industrial-input !rounded-xl !px-3 !py-2.5" value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} required />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExtras((v) => !v)}
                className="mt-2 text-xs font-medium text-ink-mute md:mt-3"
              >
                {showExtras ? "Hide extra fields" : "Add company / address line 2"}
              </button>
              {showExtras ? (
                <div className="mt-2 grid grid-cols-1 gap-2.5 md:mt-3 md:grid-cols-2 md:gap-4">
                  <div>
                    <label className="industrial-label">Company</label>
                    <input className="industrial-input !rounded-xl !px-3 !py-2.5" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  </div>
                  <div>
                    <label className="industrial-label">Address line 2</label>
                    <input className="industrial-input !rounded-xl !px-3 !py-2.5" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} />
                  </div>
                </div>
              ) : null}
            </section>

            {availableOffers.length ? (
              <section className="rounded-2xl bg-surface p-4 md:rounded-2xl md:p-6">
                <div className="mb-2 flex items-center gap-2 border-b border-line pb-2 md:mb-5 md:gap-3 md:pb-3">
                  <Icon name="sell" className="text-ink" />
                  <h2 className="text-base font-semibold text-text-primary md:text-lg">Offers</h2>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-3 md:overflow-visible">
                  <label
                    className={`flex min-w-[140px] shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 md:min-w-0 md:items-start md:gap-3 md:p-4 ${
                      !offerId ? "border-line-hi bg-surface-2" : "border-line bg-bg"
                    }`}
                  >
                    <input type="radio" name="offer" checked={!offerId} onChange={() => setOfferId("")} className="accent-forest" />
                    <span className="text-xs font-semibold text-text-primary md:text-sm">No offer</span>
                  </label>
                  {availableOffers.map((offer) => (
                    <label
                      key={offer.id}
                      className={`flex min-w-[170px] shrink-0 cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 md:min-w-0 md:items-start md:gap-3 md:p-4 ${
                        offerId === offer.id ? "border-line-hi bg-surface-2" : "border-line bg-bg"
                      }`}
                    >
                      <input type="radio" name="offer" checked={offerId === offer.id} onChange={() => setOfferId(offer.id)} className="accent-forest" />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-xs font-semibold text-text-primary md:text-sm">{offer.title}</span>
                          <span className="shrink-0 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-white">{offer.label}</span>
                        </span>
                        {offer.description ? <span className="mt-1 hidden text-xs text-text-secondary md:block">{offer.description}</span> : null}
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-2xl bg-surface p-4 md:rounded-2xl md:p-6">
              <div className="mb-2 flex items-center justify-between border-b border-line pb-2 md:mb-6 md:pb-3">
                <div className="flex items-center gap-2 md:gap-3">
                  <Icon name="payments" className="text-ink" />
                  <h2 className="text-base font-semibold text-text-primary md:text-lg">Payment</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 md:block md:space-y-3">
                {methods.map((m) => (
                  <label
                    key={m.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 md:items-start md:gap-4 md:p-4 ${
                      method === m.id
                        ? "border-line-hi bg-surface-2 text-text-primary"
                        : "border-line bg-bg text-text-secondary"
                    }`}
                  >
                    <input type="radio" name="pay" checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-forest" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-text-primary md:hidden">{m.short}</span>
                        <span className="hidden text-sm font-semibold text-text-primary md:inline">{m.title}</span>
                        <Icon name={m.icon} className={`hidden md:inline ${method === m.id ? "text-ink" : "text-text-secondary"}`} />
                      </div>
                      <p className="mt-0.5 hidden text-xs text-text-secondary md:block">{m.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </section>
          </div>

          <aside className="w-full shrink-0 lg:w-96">
            <div className="rounded-2xl bg-surface p-4 md:sticky md:top-24 md:rounded-2xl md:p-6">
              <button
                type="button"
                onClick={() => setShowItems((v) => !v)}
                className="mb-2 flex w-full items-center justify-between border-b border-line pb-2 text-left md:mb-6 md:pointer-events-none md:pb-3"
              >
                <h2 className="flex items-center gap-2 text-base font-semibold text-text-primary md:text-lg">
                  <Icon name="receipt_long" className="text-ink" /> Summary
                </h2>
                <span className="text-xs text-text-secondary md:hidden">
                  {itemCount} item{itemCount === 1 ? "" : "s"} · {showItems ? "Hide" : "Show"}
                </span>
              </button>
              <div className={`${showItems ? "mb-3 space-y-3" : "hidden"} md:mb-6 md:block md:space-y-4`}>
                {lines.map((l) => (
                  <div key={l.productId} className="flex gap-3 md:gap-4">
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-bg md:h-16 md:w-16 md:rounded-xl">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={l.product.image} alt="" className="h-full w-full object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-text-primary">{l.product.name}</h3>
                      <div className="mt-0.5 flex justify-between text-xs md:text-sm">
                        <span className="text-text-secondary">Qty {l.quantity}</span>
                        <span className="font-semibold text-text-primary">{formatINR(unitPriceForQty(l.product, l.quantity) * l.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-1.5 text-sm md:mb-6 md:space-y-3">
                <div className="flex justify-between text-text-secondary"><span>Subtotal</span><span>{formatINR(subtotal)}</span></div>
                {discount > 0 ? (
                  <div className="flex justify-between text-ink-mute">
                    <span>{selectedOffer ? selectedOffer.label : "Offer"}</span>
                    <span>-{formatINR(discount)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-text-secondary"><span>Shipping</span><span>{formatINR(freight)}</span></div>
                <div className="flex justify-between text-text-secondary"><span>GST (18%)</span><span>{formatINR(gst)}</span></div>
              </div>
              <div className="mt-3 hidden items-end justify-between border-t border-line pt-4 md:flex">
                <span className="text-lg font-semibold text-text-primary">Total</span>
                <span className="text-2xl font-bold text-text-primary">{formatINR(total)}</span>
              </div>
              {error ? <p className="mt-2 text-sm text-error md:mb-3">{error}</p> : null}
              <button type="submit" disabled={busy} className="vj-btn vj-btn-primary mt-4 hidden h-13 w-full gap-2 py-4 md:inline-flex">
                <Icon name="lock" /> {busy ? "Processing…" : method === "credit" ? "Place on credit" : "Pay Now"}
              </button>
            </div>
          </aside>
        </div>
      </div>

      <div className="fixed bottom-[72px] left-0 right-0 z-40 border-t border-line bg-surface px-4 py-2.5 backdrop-blur-xl md:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <span className="block text-[10px] text-text-secondary">Total</span>
            <span className="text-lg font-bold tabular-nums text-text-primary">{formatINR(total)}</span>
          </div>
          <button type="submit" disabled={busy} className="vj-btn vj-btn-primary h-11 shrink-0 px-6">
            <Icon name="lock" /> {busy ? "Processing…" : method === "credit" ? "Place on credit" : "Pay Now"}
          </button>
        </div>
      </div>
    </form>
  );
}

declare global {
  interface Window {
    Razorpay?: new (opts: Record<string, unknown>) => {
      open: () => void;
      on?: (event: string, cb: (...args: unknown[]) => void) => void;
    };
  }
}
