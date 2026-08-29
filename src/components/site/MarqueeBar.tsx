"use client";

import { useSite } from "@/components/site/SiteProvider";

export default function MarqueeBar() {
  const { site } = useSite();
  if (!site.marqueeEnabled || !site.marqueeText.trim()) return null;
  const text = `${site.marqueeText.trim()}   ·   `;
  return (
    <div className="overflow-hidden bg-[#e0a84a] text-[#1a1512]">
      <div className="animate-marquee flex whitespace-nowrap py-2 text-[12px] font-semibold uppercase tracking-[0.12em]">
        <span className="px-4">{text.repeat(8)}</span>
        <span className="px-4" aria-hidden="true">{text.repeat(8)}</span>
      </div>
    </div>
  );
}
