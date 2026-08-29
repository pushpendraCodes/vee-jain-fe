"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, LogOut, Package, User } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";

const LINKS = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/orders", label: "Orders", icon: Package },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export default function AccountMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const buttonClass =
    "flex h-11 items-center gap-2 rounded-full px-1.5 text-sm font-medium text-white/90 transition hover:bg-white/10 sm:px-2.5";

  if (!hydrated) {
    return (
      <span className="flex h-11 w-11 items-center justify-center rounded-full text-white/50" aria-hidden>
        <User className="h-[18px] w-[18px]" />
      </span>
    );
  }

  if (!user) {
    return (
      <Link href="/login?next=/profile" className={buttonClass} aria-label="Login">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
          <User className="h-3.5 w-3.5" />
        </span>
        <span className="hidden pr-1.5 lg:inline">Account</span>
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className={buttonClass}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
      >
        {user.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
            <User className="h-3.5 w-3.5" />
          </span>
        )}
        <span className="hidden max-w-[7rem] truncate pr-0.5 lg:inline">{user.name?.split(" ")[0] || "Account"}</span>
        <ChevronDown className={`hidden h-3.5 w-3.5 text-white/50 lg:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#1a1512] py-2 shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
        >
          <div className="border-b border-white/8 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">{user.name || "Account"}</p>
            <p className="truncate text-xs text-white/45">{user.phone || user.email}</p>
          </div>
          {LINKS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm transition ${
                  active ? "bg-white/10 text-white" : "text-white/75 hover:bg-white/8 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            role="menuitem"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-300/90 transition hover:bg-white/8"
            onClick={() => {
              setOpen(false);
              dispatch(logout());
              router.push("/");
            }}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
