"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/api";
import { useAppSelector } from "@/store/hooks";
import type { NotificationItem } from "@/types";
import { ArrowRight, Bell, ChevronLeft, ChevronRight } from "lucide-react";
import { registerWebPush } from "@/lib/firebase";

const PAGE_SIZE = 15;

function pageWindow(current: number, total: number) {
  const pages: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  const from = Math.max(1, end - 4);
  for (let n = from; n <= end; n += 1) pages.push(n);
  return pages;
}

export default function NotificationsPage() {
  const router = useRouter();
  const token = useAppSelector((s) => s.auth.token);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pushReady, setPushReady] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    if (hydrated && !token) router.replace("/login?next=/notifications");
  }, [hydrated, token, router]);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchNotifications(token, page, PAGE_SIZE);
        if (!cancelled) {
          setItems(data.notifications || []);
          setUnread(data.unread || 0);
          setPagination(data.pagination || null);
          if (data.pagination && page > data.pagination.pages) {
            setPage(data.pagination.pages);
          }
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load notifications");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, page]);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setPushReady(Notification.permission === "granted");
  }, []);

  const goToPage = (next: number) => {
    const pages = pagination?.pages || 1;
    const clamped = Math.min(pages, Math.max(1, next));
    if (clamped === page) return;
    setPage(clamped);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalCount = pagination?.total ?? items.length;
  const rangeStart = items.length ? (pagination ? (pagination.page - 1) * pagination.limit + 1 : 1) : 0;
  const rangeEnd = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : items.length;

  if (!hydrated || !token) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-surface-2" />
        <p className="text-sm text-text-secondary">Checking account…</p>
      </div>
    );
  }

  if (loading && !items.length) {
    return (
      <div className="mx-auto max-w-7xl px-5 py-16 text-center">
        <div className="mx-auto mb-4 h-10 w-10 animate-pulse rounded-full bg-surface-2" />
        <p className="text-sm text-text-secondary">Loading notifications…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-5 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Notifications
          </h1>
          <p className="mt-1 text-base text-text-secondary">
            Order updates and account alerts in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {token && !pushReady ? (
            <button
              type="button"
              disabled={pushBusy}
              className="rounded-full border border-line-hi px-4 py-2 text-sm font-medium text-ink disabled:opacity-60"
              onClick={async () => {
                setPushBusy(true);
                const ok = await registerWebPush(token, { prompt: true });
                setPushBusy(false);
                setPushReady(ok);
              }}
            >
              {pushBusy ? "Enabling…" : "Enable push alerts"}
            </button>
          ) : null}
          {unread > 0 ? (
            <button
              type="button"
              className="text-sm font-medium text-ink transition hover:underline"
              onClick={async () => {
                await markAllNotificationsRead(token);
                setItems((prev) => prev.map((n) => ({ ...n, read: true })));
                setUnread(0);
              }}
            >
              Mark all read
            </button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm text-error">{error}</p> : null}

      {items.length === 0 ? (
        <div className="my-6 rounded-2xl bg-surface p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-surface-2 text-ink">
            <Bell className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-semibold text-text-primary">No notifications yet</h3>
          <p className="mb-6 mt-1 text-sm text-text-secondary">
            Order status and account alerts will appear here.
          </p>
          <Link href="/shop" className="vj-btn vj-btn-primary inline-flex h-11 px-8">
            Browse Catalog <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <div className={`space-y-3 ${loading ? "opacity-60" : ""}`}>
            {items.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={async () => {
                  if (!n.read) {
                    await markNotificationRead(token, n.id);
                    setItems((prev) =>
                      prev.map((x) => (x.id === n.id ? { ...x, read: true } : x))
                    );
                    setUnread((u) => Math.max(0, u - 1));
                  }
                  const orderId = n.data?.orderId;
                  if (typeof orderId === "string") router.push(`/orders/${orderId}`);
                }}
                className={`w-full rounded-2xl p-5 text-left transition hover:bg-surface-2/30 ${
                  n.read ? "bg-surface" : "bg-surface ring-1 ring-forest/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold text-text-primary">{n.title}</p>
                  {!n.read ? (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-text-secondary">{n.body}</p>
                <p className="mt-2 text-xs text-text-secondary">
                  {n.createdAt ? new Date(n.createdAt).toLocaleString("en-IN") : ""}
                </p>
              </button>
            ))}
          </div>

          {pagination && pagination.pages > 1 ? (
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
              <p className="text-xs text-text-secondary">
                Showing {rangeStart}–{rangeEnd} of {totalCount}
              </p>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={pagination.page <= 1 || loading}
                  onClick={() => goToPage(pagination.page - 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-text-primary disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {pageWindow(pagination.page, pagination.pages).map((n) => (
                  <button
                    key={n}
                    type="button"
                    disabled={loading}
                    onClick={() => goToPage(n)}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold ${
                      n === pagination.page
                        ? "bg-surface-2 text-on-dark"
                        : "border border-line bg-surface text-text-primary hover:bg-surface-2"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={pagination.page >= pagination.pages || loading}
                  onClick={() => goToPage(pagination.page + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line bg-surface text-text-primary disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : pagination && pagination.total > 0 ? (
            <p className="text-center text-xs text-text-secondary">
              Showing {rangeStart}–{rangeEnd} of {totalCount}
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
