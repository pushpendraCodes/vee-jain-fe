"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import MarqueeBar from "@/components/site/MarqueeBar";
import PushOptIn from "@/components/site/PushOptIn";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEducationFeed = pathname === "/education";
  const isCheckout = pathname === "/checkout";
  const hideFooter = isEducationFeed || isCheckout;

  return (
    <div className={`vj-page flex min-h-screen flex-col ${isEducationFeed ? "h-dvh overflow-hidden" : ""}`}>
      <div className="sticky top-0 z-50">
        <MarqueeBar />
        <Header />
        <PushOptIn />
      </div>
      <main
        className={
          isEducationFeed
            ? "flex min-h-0 flex-1 flex-col overflow-hidden pb-[72px] md:pb-0"
            : "flex-grow pb-[80px] md:pb-0"
        }
      >
        {children}
      </main>
      {!hideFooter && <Footer />}
      <BottomNav />
    </div>
  );
}
