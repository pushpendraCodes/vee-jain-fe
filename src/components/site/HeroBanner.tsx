"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Beaker, Droplets, Leaf, ShieldCheck } from "lucide-react";
import { useSite } from "@/components/site/SiteProvider";
import { liteVideoUrl, unloadVideo, videoPoster } from "@/lib/media";
import { BANNER_FRAME, BANNER_SHELL, BANNER_SKELETON } from "@/lib/bannerSpecs";
import type { SiteBanner } from "@/types";

function isVideoBanner(banner: SiteBanner) {
  return banner.mediaType === "video" || Boolean(banner.videoUrl);
}

function BannerMedia({ banner, className }: { banner: SiteBanner; className: string }) {
  const video = isVideoBanner(banner);
  const ref = useRef<HTMLVideoElement>(null);
  const src = liteVideoUrl(banner.videoUrl);
  const poster = banner.image || videoPoster(banner.videoUrl);

  useEffect(() => {
    if (!video) return;
    const el = ref.current;
    if (!el || !src) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduce) {
          if (!el.getAttribute("src")) el.src = src;
          void el.play().catch(() => null);
        } else {
          el.pause();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      unloadVideo(el);
    };
  }, [video, src]);

  if (!video) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={banner.image} alt={banner.title || ""} className={className} />
    );
  }

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster={poster || undefined}
      className={`${className} pointer-events-none`}
    />
  );
}

function Grain() {
  return (
    <div
      className="absolute inset-0 opacity-[0.03]"
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")",
      }}
    />
  );
}

export default function HeroBanner({
  placement,
  variant = "hero",
  fallback,
  overlayExtra,
}: {
  placement: "home" | "shop";
  variant?: "hero" | "page";
  fallback: ReactNode;
  overlayExtra?: ReactNode;
}) {
  const { banners, bannersReady } = useSite();
  const items = banners.filter((b) => b.placement === placement && (b.image || b.videoUrl));
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const hero = variant === "hero";
  const shell = hero ? BANNER_SHELL.home : BANNER_SHELL.shop;
  const frame = hero ? BANNER_FRAME.home : BANNER_FRAME.shop;
  const skeleton = hero ? BANNER_SKELETON.home : BANNER_SKELETON.shop;

  useEffect(() => {
    if (index >= items.length) setIndex(0);
  }, [index, items.length]);

  useEffect(() => {
    if (!bannersReady || items.length < 2 || paused) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 7000);
    return () => window.clearInterval(id);
  }, [bannersReady, items.length, paused]);

  if (!bannersReady) {
    return (
      <section className={shell} aria-hidden>
        <div className={skeleton} />
      </section>
    );
  }

  if (!items.length) return <>{fallback}</>;

  const banner = items[Math.min(index, items.length - 1)];
  const title = banner.title?.trim() || "";
  const subtitle = banner.subtitle?.trim() || "";
  const hasCopy = Boolean(title || subtitle || overlayExtra);
  const href = hero
    ? banner.link || (hasCopy ? "/shop" : "")
    : banner.link && banner.link !== "/shop"
      ? banner.link
      : "";

  const overlayInner =
    hasCopy || href ? (
      <div className={hero ? "max-w-2xl space-y-4 md:space-y-7" : "max-w-2xl space-y-3 md:space-y-4"}>
        {hero && hasCopy ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
            <Beaker className="h-3.5 w-3.5 text-sage" />
            <span className="tech-label text-sage-light/90">Precision chemistry for modern industry</span>
          </div>
        ) : null}

        {title ? (
          <h1
            className={`font-display font-bold tracking-[-0.03em] text-white ${
              hero
                ? "text-[clamp(1.85rem,8vw,5rem)] leading-[1.08] md:leading-[1.04]"
                : "text-[clamp(1.5rem,6vw,3.5rem)] leading-[1.12] md:leading-[1.08]"
            }`}
          >
            {title}
          </h1>
        ) : null}

        {subtitle ? (
          <p className={`max-w-xl text-white/70 ${hero ? "text-sm leading-relaxed md:text-[17px] md:leading-[1.7] md:text-lg" : "text-sm md:text-base"}`}>
            {subtitle}
          </p>
        ) : null}

        {overlayExtra}

        {href || (hero && hasCopy) ? (
          <div className={`flex flex-wrap gap-3 ${hero ? "pt-1 md:pt-3" : ""}`}>
            {href ? (
              <Link
                href={href}
                className="group inline-flex items-center gap-2.5 rounded-full bg-white px-6 py-2.5 text-sm font-medium text-forest shadow-lg shadow-white/10 transition hover:bg-sage-light md:px-8 md:py-3.5 md:text-[15px]"
              >
                {hero ? (banner.link && banner.link !== "/shop" ? "Learn more" : "Explore Products") : "View collection"}
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            ) : null}
            {hero && hasCopy ? (
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-sm font-medium text-white backdrop-blur-sm transition hover:border-white/35 hover:bg-white/10 md:px-8 md:py-3.5 md:text-[15px]"
              >
                Request a Quote
              </Link>
            ) : null}
          </div>
        ) : null}

        {hero && hasCopy ? (
          <div className="hidden flex-wrap gap-x-6 gap-y-2 pt-8 md:flex">
            <span className="flex items-center gap-2 text-sm font-medium text-white/55">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8">
                <ShieldCheck className="h-3.5 w-3.5 text-sage" />
              </span>
              Batch Certified
            </span>
            <span className="flex items-center gap-2 text-sm font-medium text-white/55">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8">
                <Droplets className="h-3.5 w-3.5 text-sage" />
              </span>
              <span className="font-mono text-[13px] tabular-nums">99%+</span> Purity
            </span>
            <span className="flex items-center gap-2 text-sm font-medium text-white/55">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8">
                <Leaf className="h-3.5 w-3.5 text-sage" />
              </span>
              Eco-Compliant
            </span>
          </div>
        ) : null}
      </div>
    ) : null;

  return (
    <section
      className={shell}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className={frame}>
        <BannerMedia banner={banner} className="block h-auto w-full max-w-none object-center" />
        {overlayInner ? (
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-r from-[#0a1a0d]/85 via-[#0a1a0d]/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a0d]/50 via-transparent to-[#0a1a0d]/20" />
          </div>
        ) : null}
        <Grain />
        {items.length > 1 ? (
          <div className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 gap-2 md:bottom-5">
            {items.map((item, i) => (
              <button
                key={item.id}
                type="button"
                aria-label={`Show banner ${i + 1}`}
                aria-current={i === index}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition ${i === index ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        ) : null}
      </div>

      {overlayInner ? (
        <div className="relative z-10 bg-[#0a1a0d] px-5 py-5 pointer-events-none sm:px-6 md:absolute md:inset-0 md:flex md:items-center md:bg-transparent md:py-20 lg:px-8">
          <div className="pointer-events-auto mx-auto w-full max-w-7xl">{overlayInner}</div>
        </div>
      ) : null}
    </section>
  );
}
