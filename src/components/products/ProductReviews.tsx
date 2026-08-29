"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, MessageSquarePlus, Star, X } from "lucide-react";
import ReviewModal from "@/components/products/ReviewModal";
import { StarRating } from "@/components/products/StarRating";
import {
  ApiError,
  fetchProductReviews,
  fetchReviewEligibility,
  submitProductReview,
} from "@/lib/api";
import { formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/Toast";
import { useAppSelector } from "@/store/hooks";
import type { ProductReview, ReviewEligibility, ReviewSummary } from "@/types";

const EMPTY_SUMMARY: ReviewSummary = {
  average: 0,
  count: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  if (parts[0]) return parts[0].slice(0, 2).toUpperCase();
  return "VJ";
}

function eligibilityCopy(eligibility: ReviewEligibility | null, loggedIn: boolean) {
  if (!loggedIn || eligibility?.reason === "login") {
    return "Sign in to review this product after delivery.";
  }
  if (eligibility?.reason === "not_purchased") {
    return "Reviews open after you purchase and receive this product.";
  }
  if (eligibility?.reason === "not_delivered") {
    return "You can write a review once this order is delivered.";
  }
  if (eligibility?.alreadyReviewed) {
    return "Thank you — your review is published below.";
  }
  return "";
}

export default function ProductReviews({ slug, productName }: { slug: string; productName: string }) {
  const token = useAppSelector((s) => s.auth.token);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const { showToast } = useToast();

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [summary, setSummary] = useState<ReviewSummary>(EMPTY_SUMMARY);
  const [eligibility, setEligibility] = useState<ReviewEligibility | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchProductReviews(slug, token);
        if (cancelled) return;
        setReviews(data.reviews);
        setSummary(data.summary);
      } catch {
        if (!cancelled) {
          setReviews([]);
          setSummary(EMPTY_SUMMARY);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, token]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      setEligibility({ canReview: false, alreadyReviewed: false, reason: "login" });
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const next = await fetchReviewEligibility(slug, token);
        if (!cancelled) setEligibility(next);
      } catch {
        if (!cancelled) setEligibility({ canReview: false, alreadyReviewed: false, reason: "login" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token, slug]);

  useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [lightbox]);

  const openReview = () => {
    setFormError("");
    setModalOpen(true);
  };

  const handleSubmit = async (payload: { rating: number; description: string; images: File[] }) => {
    if (!token) return;
    setSubmitting(true);
    setFormError("");
    try {
      const review = await submitProductReview(slug, token, payload);
      setReviews((prev) => [review, ...prev.filter((r) => r.id !== review.id)]);
      setSummary((prev) => {
        const count = prev.count + 1;
        const distribution = { ...prev.distribution };
        const star = review.rating as 1 | 2 | 3 | 4 | 5;
        distribution[star] = (distribution[star] || 0) + 1;
        const total = prev.average * prev.count + review.rating;
        return {
          count,
          average: Math.round((total / count) * 10) / 10,
          distribution,
        };
      });
      setEligibility({ canReview: false, alreadyReviewed: true, reason: "already_reviewed" });
      setModalOpen(false);
      showToast("Review published", "Thank you for sharing your experience", "success");
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : "Could not submit review");
    } finally {
      setSubmitting(false);
    }
  };

  const maxBar = Math.max(1, ...[5, 4, 3, 2, 1].map((s) => summary.distribution[s as 1 | 2 | 3 | 4 | 5] || 0));
  const note = eligibilityCopy(eligibility, Boolean(token));
  const loginHref = `/login?next=${encodeURIComponent(`/shop/${slug}`)}`;

  return (
    <section id="reviews" className="scroll-mt-28">
      <div className="rounded-[1.75rem] bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary">Customer reviews</p>
            <h2 className="mt-1 font-display text-2xl font-bold text-text-primary">What buyers say</h2>
            {loading ? (
              <div className="mt-4 h-10 w-40 animate-pulse rounded-full bg-cream" />
            ) : summary.count > 0 ? (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-4xl font-semibold tabular-nums text-text-primary">{summary.average.toFixed(1)}</span>
                <div>
                  <StarRating value={summary.average} size="md" />
                  <p className="mt-1 text-xs text-text-secondary">
                    {summary.count} review{summary.count === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-3 max-w-md text-sm text-text-secondary">
                No reviews yet. Be the first to share how this dye performed in production.
              </p>
            )}
          </div>

          <div className="flex w-full flex-col items-stretch gap-3 lg:w-auto lg:min-w-[16rem] lg:items-end">
            {eligibility?.canReview ? (
              <button type="button" onClick={openReview} className="vj-btn vj-btn-primary h-11 px-5 text-sm">
                <MessageSquarePlus className="h-4 w-4" /> Write a review
              </button>
            ) : !token && hydrated ? (
              <Link href={loginHref} className="vj-btn vj-btn-primary h-11 px-5 text-sm">
                Sign in to review
              </Link>
            ) : null}
            {note ? <p className="max-w-xs text-xs leading-relaxed text-text-secondary lg:text-right">{note}</p> : null}
          </div>
        </div>

        {summary.count > 0 && (
          <div className="mt-8 space-y-2 border-t border-border-hairline pt-6">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
              return (
                <div key={star} className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="flex w-10 items-center gap-1 tabular-nums">
                    {star} <Star className="h-3 w-3 fill-accent text-accent" />
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{ width: `${(count / maxBar) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-right tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 space-y-4">
          {loading && (
            <div className="space-y-3">
              <div className="h-28 animate-pulse rounded-2xl bg-cream" />
              <div className="h-28 animate-pulse rounded-2xl bg-cream" />
            </div>
          )}

          {!loading && reviews.length === 0 && (
            <div className="rounded-[1.5rem] bg-cream px-6 py-10 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white text-forest">
                <Star className="h-6 w-6" />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Waiting for the first review</h3>
              <p className="mx-auto mt-1 max-w-sm text-sm text-text-secondary">
                Verified buyers can rate this product after delivery, with photos of the batch they received.
              </p>
            </div>
          )}

          {reviews.map((review) => (
            <article key={review.id} className="rounded-2xl bg-cream p-5">
              <div className="flex items-start gap-3">
                {review.user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={review.user.avatar}
                    alt=""
                    className="h-11 w-11 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-xs font-semibold text-on-dark">
                    {initials(review.user.name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm font-semibold text-text-primary">{review.user.name}</h3>
                    {review.verifiedPurchase && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] font-medium text-success-green">
                        <BadgeCheck className="h-3 w-3" /> Verified purchase
                      </span>
                    )}
                    {review.mine && (
                      <span className="rounded-full bg-sage-light px-2 py-0.5 text-[10px] font-medium text-forest">
                        Your review
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StarRating value={review.rating} size="sm" />
                    <time className="text-[11px] text-text-secondary" dateTime={review.createdAt}>
                      {formatDate(review.createdAt)}
                    </time>
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-text-primary">{review.description}</p>
                  {review.images.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {review.images.map((src) => (
                        <button
                          key={src}
                          type="button"
                          onClick={() => setLightbox(src)}
                          className="h-16 w-24 overflow-hidden bg-white"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={src} alt="Review photo" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {modalOpen && (
        <ReviewModal
          productName={productName}
          submitting={submitting}
          error={formError}
          onClose={() => !submitting && setModalOpen(false)}
          onSubmit={handleSubmit}
        />
      )}

      {lightbox && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center p-4">
          <button type="button" className="fixed inset-0 bg-black/60" aria-label="Close photo" onClick={() => setLightbox(null)} />
          <div className="relative z-10 max-h-[90vh] max-w-3xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox} alt="Review photo" className="max-h-[90vh] object-contain shadow-2xl" />
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -right-2 -top-2 rounded-full bg-white p-2 text-text-primary shadow"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
