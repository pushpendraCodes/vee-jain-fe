"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import MarqueeBar from "@/components/site/MarqueeBar";
import PushOptIn from "@/components/site/PushOptIn";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCheckout = pathname === "/checkout";
  const isPublicInvoice = pathname.startsWith("/invoice/");
  const hideFooter = isCheckout || isPublicInvoice;
  const hideChrome = isPublicInvoice;

  return (
    <div className="vj-page flex min-h-screen flex-col">
      {!hideChrome ? (
        <div className="sticky top-0 z-50">
          <MarqueeBar />
          <Header />
          <PushOptIn />
        </div>
      ) : null}
      <main className={hideChrome ? "flex-grow" : "flex-grow pb-[80px] md:pb-0"}>
        {children}
      </main>
      {!hideFooter && <Footer />}
      {!hideChrome ? <BottomNav /> : null}
    </div>
  );
}
