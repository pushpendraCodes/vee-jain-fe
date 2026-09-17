"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { StarPicker } from "@/components/products/StarRating";

const MAX_IMAGES = 4;
const MAX_BYTES = 5 * 1024 * 1024;

type Preview = { file: File; url: string };

export default function ReviewModal({
  productName,
  submitting,
  error,
  onClose,
  onSubmit,
}: {
  productName: string;
  submitting: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (payload: { rating: number; description: string; images: File[] }) => void;
}) {
  const [rating, setRating] = useState(0);
  const [description, setDescription] = useState("");
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [localError, setLocalError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, submitting]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (list: FileList | null) => {
    if (!list?.length) return;
    setLocalError("");
    const next: Preview[] = [];
    for (const file of Array.from(list)) {
      if (!file.type.startsWith("image/")) {
        setLocalError("Please choose image files only");
        continue;
      }
      if (file.size > MAX_BYTES) {
        setLocalError("Each image must be under 5 MB");
        continue;
      }
      next.push({ file, url: URL.createObjectURL(file) });
    }
    setPreviews((prev) => {
      const room = MAX_IMAGES - prev.length;
      const take = next.slice(0, room);
      next.slice(room).forEach((p) => URL.revokeObjectURL(p.url));
      return [...prev, ...take];
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => {
      const copy = [...prev];
      const [removed] = copy.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.url);
      return copy;
    });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setLocalError("Please choose a star rating");
      return;
    }
    if (description.trim().length < 10) {
      setLocalError("Please write at least 10 characters");
      return;
    }
    setLocalError("");
    onSubmit({ rating, description: description.trim(), images: previews.map((p) => p.file) });
  };

  const message = localError || error;

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6">
      <button type="button" className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-label="Close" onClick={() => !submitting && onClose()} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="review-modal-title"
        className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-surface"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-6 py-5">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-text-secondary">Verified review</p>
            <h2 id="review-modal-title" className="mt-1 font-display text-xl font-semibold text-text-primary">
              Write a review
            </h2>
            <p className="mt-0.5 line-clamp-1 text-sm text-text-secondary">{productName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-full bg-surface p-2 text-text-secondary transition hover:text-text-primary"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            <div>
              <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-secondary">Rating</span>
              <StarPicker value={rating} onChange={setRating} disabled={submitting} />
            </div>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-secondary">
                Your review
              </span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={submitting}
                rows={5}
                maxLength={1000}
                className="vj-input min-h-[8rem] resize-y !rounded-2xl"
                placeholder="How was the colour strength, packing, and delivery?"
              />
              <span className="mt-1 block text-right text-[11px] text-text-secondary">
                {description.trim().length}/1000
              </span>
            </label>

            <div>
              <span className="mb-2 block text-xs font-medium uppercase tracking-wider text-text-secondary">
                Photos <span className="normal-case tracking-normal text-text-secondary/80">(optional, up to 4)</span>
              </span>
              <div className="flex flex-wrap gap-2.5">
                {previews.map((item, index) => (
                  <div key={item.url} className="relative h-16 w-24 overflow-hidden bg-bg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removePreview(index)}
                      disabled={submitting}
                      className="absolute right-1 top-1 rounded-full bg-surface p-0.5 text-text-primary"
                      aria-label="Remove photo"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {previews.length < MAX_IMAGES && (
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => fileRef.current?.click()}
                    className="flex h-16 w-24 flex-col items-center justify-center gap-1 border border-dashed border-line bg-bg text-text-secondary transition hover:border-line-hi/30 hover:bg-surface-2"
                  >
                    <ImagePlus className="h-5 w-5" />
                    <span className="text-[10px] font-medium">Add</span>
                  </button>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {message ? <p className="text-sm font-medium text-error">{message}</p> : null}
          </div>

          <div className="border-t border-line px-6 py-4">
            <button type="submit" disabled={submitting} className="vj-btn vj-btn-primary h-12 w-full text-sm disabled:pointer-events-none disabled:opacity-60">
              {submitting ? "Publishing…" : "Submit review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
