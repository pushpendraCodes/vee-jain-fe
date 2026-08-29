"use client";

import { Star } from "lucide-react";

const SIZE = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-7 w-7",
} as const;

export function StarRating({
  value,
  size = "md",
  className = "",
}: {
  value: number;
  size?: keyof typeof SIZE;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-label={`${clamped} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => {
        const fill = Math.max(0, Math.min(1, clamped - (star - 1)));
        return (
          <span key={star} className={`relative ${SIZE[size]}`}>
            <Star className={`${SIZE[size]} fill-sage-light text-sage-light`} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={`${SIZE[size]} fill-accent text-accent`} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"] as const;

export function StarPicker({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((star) => {
          const active = star <= value;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              disabled={disabled}
              onClick={() => onChange(star)}
              className="rounded-lg p-1 transition hover:scale-110 disabled:opacity-50"
            >
              <Star
                className={`h-8 w-8 ${active ? "fill-accent text-accent" : "fill-sage-light text-sage-light"}`}
              />
            </button>
          );
        })}
      </div>
      <p className="mt-1 text-xs font-medium text-text-secondary">{value ? LABELS[value] : "Tap a star to rate"}</p>
    </div>
  );
}
