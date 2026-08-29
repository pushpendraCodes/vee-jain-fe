"use client";

import { useState } from "react";
import Link from "next/link";
import { useSite } from "@/components/site/SiteProvider";
import { useToast } from "@/components/ui/Toast";
import { Mail, Phone, MapPin, Send, ArrowUpRight } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const { showToast } = useToast();
  const { site } = useSite();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    showToast("Subscribed!", "You'll receive technical bulletins and pricing updates.", "success");
    setEmail("");
  };

  return (
    <footer className="relative mt-auto hidden w-full overflow-hidden border-t border-border-hairline bg-forest text-on-dark md:block">
      <div className="mx-auto max-w-7xl space-y-12 px-6 py-16 lg:px-8">
        {/* Newsletter */}
        <div className="flex flex-col items-center justify-between gap-6 rounded-[1.75rem] bg-white/5 p-8 backdrop-blur-sm lg:flex-row">
          <div>
            <h4 className="font-display text-xl font-semibold">Technical bulletins &amp; updates</h4>
            <p className="mt-1 text-sm text-on-dark/60">Monthly MSDS updates, new batch alerts, and pricing.</p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full items-center gap-2 lg:w-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email…"
              className="h-11 w-64 rounded-full border border-white/10 bg-white/5 px-4 text-sm text-on-dark placeholder-on-dark/40 outline-none focus:border-accent/50 lg:w-72"
            />
            <button type="submit" className="vj-btn vj-btn-accent h-11 shrink-0 px-5">
              Subscribe <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
          <div className="space-y-4 md:col-span-4">
            <div className="flex items-center gap-2.5">
              {site.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={site.logo} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-white">VJ</div>
              )}
              <span className="text-lg font-semibold tracking-tight">{site.siteName}</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-on-dark/60">
              Premium B2B manufacturer of high-purity reactive dyes, industrial solvents, and technical chemical auxiliaries.
            </p>
            <Link href="/contact" className="inline-flex items-center gap-1 text-sm font-medium text-accent link-underline">
              Start an inquiry <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3 md:col-span-2">
            <h5 className="text-xs font-medium uppercase tracking-wider text-on-dark/40">Navigation</h5>
            <ul className="space-y-2.5 text-sm text-on-dark/70">
              <li><Link href="/" className="hover:text-on-dark">Home</Link></li>
              <li><Link href="/shop" className="hover:text-on-dark">Products</Link></li>
              <li><Link href="/education" className="hover:text-on-dark">Resources</Link></li>
              <li><Link href="/about" className="hover:text-on-dark">About</Link></li>
              <li><Link href="/contact" className="hover:text-on-dark">Contact</Link></li>
            </ul>
          </div>

          <div className="space-y-3 md:col-span-3">
            <h5 className="text-xs font-medium uppercase tracking-wider text-on-dark/40">Products</h5>
            <ul className="space-y-2.5 text-sm text-on-dark/70">
              <li><Link href="/shop?category=Reactive+Dyes" className="hover:text-on-dark">Reactive Dyes</Link></li>
              <li><Link href="/shop?category=Acid+Dyes" className="hover:text-on-dark">Acid Dyes</Link></li>
              <li><Link href="/shop?category=Pigments" className="hover:text-on-dark">Pigments</Link></li>
              <li><Link href="/shop?division=chemicals" className="hover:text-on-dark">Industrial Chemicals</Link></li>
              <li><Link href="/shop?division=inks" className="hover:text-on-dark">Screen Inks</Link></li>
            </ul>
          </div>

          <div className="space-y-3 md:col-span-3">
            <h5 className="text-xs font-medium uppercase tracking-wider text-on-dark/40">Contact</h5>
            <div className="space-y-3 text-sm text-on-dark/70">
              <div className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{site.address}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-accent" />
                <span>+91 {site.phone}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-accent" />
                <span>{site.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-on-dark/40 sm:flex-row">
          <p>© {new Date().getFullYear()} {site.siteName}. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-on-dark/70">Privacy</Link>
            <Link href="/terms" className="hover:text-on-dark/70">Terms</Link>
            <Link href="/contact" className="hover:text-on-dark/70">Inquiry</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
