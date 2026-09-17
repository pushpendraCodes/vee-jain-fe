"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAppSelector } from "@/store/hooks";
import { Home, Store, GraduationCap, ShoppingBag, User } from "lucide-react";

const ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Products", icon: Store },
  { href: "/education", label: "Learn", icon: GraduationCap },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
  { href: "/profile", label: "Account", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();
  const cartCount = useAppSelector((s) =>
    s.cart.items.reduce((n, i) => n + i.quantity, 0)
  );
  const user = useAppSelector((s) => s.auth.user);
  const prevCount = useRef(cartCount);
  const [badgePop, setBadgePop] = useState(false);

  useEffect(() => {
    if (cartCount > prevCount.current) {
      setBadgePop(true);
      const t = window.setTimeout(() => setBadgePop(false), 450);
      prevCount.current = cartCount;
      return () => window.clearTimeout(t);
    }
    prevCount.current = cartCount;
  }, [cartCount]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[72px] border-t border-border-hairline bg-ivory/95 px-2 backdrop-blur-xl md:hidden">
      <div className="mx-auto flex h-full w-full max-w-md items-center justify-around">
        {ITEMS.map((item) => {
          const IconComp = item.icon;
          const href = item.href === "/profile" && !user ? "/login?next=/profile" : item.href;
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const className = `relative flex w-14 flex-col items-center justify-center py-1 transition active:scale-95 ${active ? "text-forest" : "text-text-secondary"}`;

          return (
            <Link
              key={item.href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={className}
            >
              <div className={`rounded-full p-1.5 transition ${active ? "bg-sage-light" : ""}`}>
                <IconComp className="h-5 w-5" />
              </div>
              <span className="mt-0.5 text-[10px] font-medium">{item.label}</span>
              {item.href === "/cart" && cartCount > 0 && (
                <span
                  className={`absolute right-1 top-0 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white ${
                    badgePop ? "cart-badge-pop" : ""
                  }`}
                >
                  {cartCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
