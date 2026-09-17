"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState, useEffect, useRef } from "react";
import { useSite } from "@/components/site/SiteProvider";
import { useAppSelector } from "@/store/hooks";
import { fetchCategories, fetchProducts } from "@/lib/api";
import { CATEGORIES, DIVISIONS } from "@/lib/constants";
import { formatINR } from "@/lib/format";
import type { Product } from "@/types";
import { Search, ShoppingBag, Menu, X, ArrowRight } from "lucide-react";
import AccountMenu from "@/components/layout/AccountMenu";
import NotificationBell from "@/components/layout/NotificationBell";

const NAV = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Products" },
  { href: "/education", label: "Resources" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const FALLBACK_CATEGORIES = CATEGORIES.filter((name) => name !== "All Products");

export default function Header() {
  const { site } = useSite();
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const searchRef = useRef<HTMLDivElement>(null);

  const cartCount = useAppSelector((s) =>
    s.cart.items.reduce((n, i) => n + i.quantity, 0)
  );
  const prevCartCount = useRef(cartCount);
  const [cartBadgePop, setCartBadgePop] = useState(false);

  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBadgePop(true);
      const t = window.setTimeout(() => setCartBadgePop(false), 450);
      prevCartCount.current = cartCount;
      return () => window.clearTimeout(t);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  useEffect(() => {
    if (!q.trim() || q.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const list = await fetchProducts({ q: q.trim() });
        setSuggestions(list.slice(0, 5));
        setShowSearchDropdown(true);
      } catch {
        setSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearchDropdown(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((list) => {
        if (cancelled) return;
        const next = list.filter((name) => name && name !== "All Products");
        if (next.length) setCategories(next);
      })
      .catch(() => {
        if (!cancelled) setCategories(FALLBACK_CATEGORIES);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const query = q.trim();
    setShowSearchDropdown(false);
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
    setMenuOpen(false);
  };

  return (
    <header className="relative bg-[#1a1512] px-3 sm:px-4 lg:px-6">
      <div className="relative mx-auto flex max-w-[1440px] items-center gap-2 py-2 sm:gap-3">
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 lg:hidden"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link href="/" className="flex min-w-0 items-center gap-2.5 pr-1 sm:gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={site.logo?.trim() || "/brand-logo.svg"}
            alt={site.siteName}
            className="h-11 w-11 shrink-0 rounded-xl object-contain"
          />
          <span className="hidden min-w-0 flex-col leading-tight md:flex">
            <span className="truncate text-[15px] font-semibold tracking-tight text-white lg:text-base">
              {site.siteName}
            </span>
            <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/45">
              {site.tagline}
            </span>
          </span>
        </Link>

        <nav
          aria-label="Primary"
          className="ml-1 hidden items-center rounded-full border border-white/8 bg-white/[0.06] p-1 lg:flex"
        >
          {NAV.map((item) => {
            const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium transition xl:px-4 ${
                  active
                    ? "bg-white text-[#1a1512] shadow-sm"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <div ref={searchRef} className="relative hidden xl:block">
            <form onSubmit={onSearch} className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a847c]" />
              <input
                value={q}
                onFocus={() => q.trim().length >= 2 && setShowSearchDropdown(true)}
                onChange={(e) => setQ(e.target.value)}
                className="h-11 w-52 rounded-full bg-[#f3f0e9] pl-11 pr-4 text-sm text-[#1a1512] placeholder:text-[#8a847c] outline-none ring-0 transition focus:ring-2 focus:ring-[#e0a84a]/40 2xl:w-64"
                placeholder="Search dyes, CAS..."
                aria-label="Search catalog"
              />
            </form>
            {showSearchDropdown && suggestions.length > 0 && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#1a1512] p-2 shadow-2xl">
                {suggestions.map((p) => (
                  <Link
                    key={p.id}
                    href={`/shop/${p.slug}`}
                    onClick={() => setShowSearchDropdown(false)}
                    className="flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-white/8"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f0e9] p-1">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.image} alt="" className="max-h-full max-w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="truncate text-sm font-medium text-white">{p.name}</h5>
                      <span className="text-xs text-white/50">{p.category}</span>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-[#e0a84a]">{formatINR(p.price)}</span>
                  </Link>
                ))}
                <Link
                  href={`/shop?q=${encodeURIComponent(q)}`}
                  onClick={() => setShowSearchDropdown(false)}
                  className="mt-1 flex items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-medium text-[#e0a84a] hover:bg-white/8"
                >
                  See all results <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>

          <Link
            href="/shop"
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10 xl:hidden"
            aria-label="Search"
          >
            <Search className="h-[18px] w-[18px]" />
          </Link>

          <NotificationBell />

          <Link
            href="/cart"
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-white/12 text-white transition hover:bg-white/10"
            aria-label="Cart"
          >
            <ShoppingBag className="h-[18px] w-[18px]" />
            {cartCount > 0 && (
              <span
                className={`absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#e0a84a] px-1 text-[9px] font-bold text-[#1a1512] ${
                  cartBadgePop ? "cart-badge-pop" : ""
                }`}
              >
                {cartCount}
              </span>
            )}
          </Link>

          <AccountMenu />

          <Link
            href="/contact"
            className="hidden h-11 items-center rounded-full bg-[#e0a84a] px-5 text-[13px] font-semibold text-[#1a1512] transition hover:bg-[#ebb45c] sm:inline-flex"
          >
            Get Quote
          </Link>
        </div>
      </div>

   

      {menuOpen && (
        <div className="absolute left-3 right-3 top-[calc(100%-4px)] z-40 overflow-hidden rounded-[1.75rem] border border-white/10 bg-[#1a1512] shadow-2xl sm:left-4 sm:right-4 lg:hidden">
          <div className="space-y-1 px-4 py-4">
            <form onSubmit={onSearch} className="relative mb-3">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a847c]" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-12 w-full rounded-full bg-[#f3f0e9] pl-11 pr-4 text-sm text-[#1a1512] outline-none"
                placeholder="Search dyes, CAS..."
              />
            </form>
            {NAV.map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center rounded-full px-4 py-3 text-[15px] font-medium transition ${
                    active ? "bg-white text-[#1a1512]" : "text-white/75 hover:bg-white/8 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
       
          
            <Link
              href="/contact"
              onClick={() => setMenuOpen(false)}
              className="mt-3 flex h-12 w-full items-center justify-center rounded-full bg-[#e0a84a] text-sm font-semibold text-[#1a1512]"
            >
              Get Quote
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
