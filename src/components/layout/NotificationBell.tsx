"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { fetchUnreadCount } from "@/lib/api";
import { useAppSelector } from "@/store/hooks";

export default function NotificationBell() {
  const token = useAppSelector((s) => s.auth.token);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!hydrated || !token) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    const load = () => {
      fetchUnreadCount(token)
        .then((n) => {
          if (!cancelled) setUnread(n);
        })
        .catch(() => {
          if (!cancelled) setUnread(0);
        });
    };
    load();
    const id = window.setInterval(load, 45000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [hydrated, token]);

  const href = token ? "/notifications" : "/login?next=/notifications";

  return (
    <Link
      href={href}
      className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/12 text-white transition hover:bg-white/10"
      aria-label={unread ? `${unread} unread notifications` : "Notifications"}
    >
      <Bell className="h-[18px] w-[18px]" />
      {unread > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e0a84a] px-1 text-[9px] font-bold text-[#1a1512]">
          {unread > 9 ? "9+" : unread}
        </span>
      ) : null}
    </Link>
  );
}
