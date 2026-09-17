"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DIVISIONS } from "@/lib/constants";
import { fetchCategoryCatalog, type CatalogCategory } from "@/lib/api";
import { formatViews } from "@/lib/format";
import { youtubeIdFromUrl, youtubeThumb } from "@/lib/youtube";
import QuickViewModal from "@/components/ui/QuickViewModal";
import QuoteCalculator from "@/components/ui/QuoteCalculator";
import { DyeDataCard } from "@/components/products/ProductCards";
import HeroBanner from "@/components/site/HeroBanner";
import HomeAboutSection from "@/components/home/HomeAboutSection";
import { BANNER_FRAME, BANNER_SHELL } from "@/lib/bannerSpecs";
import Reveal from "@/components/visual/Reveal";
import Counter from "@/components/visual/Counter";
import type { EducationVideo, Product } from "@/types";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  FileCheck2,
  Play,
  Eye,
  ChevronRight,
  HelpCircle,
  Beaker,
  Droplets,
  Leaf,
} from "lucide-react";

interface HomePageClientProps {
  products: Product[];
  videos: EducationVideo[];
}

function HeroBackdrop() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!el.src) el.src = "/hero_animation_video.mp4";
          void el.play().catch(() => null);
        } else {
          el.pause();
        }
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      el.pause();
    };
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      poster="/globe.svg"
      className="block aspect-[1920/900] h-auto w-full object-cover object-center"
    />
  );
}

export default function HomePageClient({ products, videos }: HomePageClientProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All Products");
  const [categoryPills, setCategoryPills] = useState<CatalogCategory[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchCategoryCatalog()
      .then((list) => {
        if (!cancelled) setCategoryPills(list.slice(0, 8));
      })
      .catch(() => {
        if (!cancelled) setCategoryPills([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProducts =
    selectedCategory === "All Products"
      ? products.slice(0, 8)
      : products.filter((p) => p.category === selectedCategory).slice(0, 8);



  return (
    <div className="overflow-hidden">
      <QuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

      {/* ═══ HERO — CMS banner media, or static fallback ═══ */}
      <HeroBanner
        placement="home"
        fallback={
      <section className={BANNER_SHELL.home}>
        <div className={BANNER_FRAME.home}>
          <HeroBackdrop />
          <div className="pointer-events-none absolute inset-0 hidden md:block">
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />
          </div>
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")" }} />
        </div>

        <div className="relative z-10 bg-[#0a1a0d] px-5 py-5 pointer-events-none sm:px-6 md:absolute md:inset-0 md:flex md:items-center md:bg-transparent md:py-20 lg:px-8">
          <div className="pointer-events-auto mx-auto w-full max-w-7xl">
            <div className="max-w-2xl space-y-4 md:space-y-7">
              {/* Badge */}
              <div className="animate-slide-up inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
                <Beaker className="h-3.5 w-3.5 text-sage" />
                <span className="tech-label text-sage-light/90">Precision chemistry for modern industry</span>
              </div>

              {/* Headline — Sora */}
              <h1 className="animate-slide-up font-display text-[clamp(1.85rem,8vw,5rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white md:leading-[1.04] [animation-delay:100ms]">
                Precision Dyes &amp; Chemicals
                <span className="mt-1 block font-semibold text-white/95">for Modern Industry</span>
              </h1>

              {/* Supporting text — Inter */}
              <p className="animate-slide-up max-w-xl text-[17px] font-normal leading-[1.7] text-white/70 md:text-lg md:leading-[1.75] [animation-delay:200ms]">
                High-purity reactive dyes and specialty chemical solutions engineered for consistent performance, vibrant results, and modern manufacturing.
              </p>

              {/* CTAs — Inter */}
              <div className="animate-slide-up flex flex-wrap gap-3 pt-3 [animation-delay:300ms]">
                <Link href="/shop" className="group inline-flex h-13 items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-[15px] font-medium text-forest shadow-lg shadow-white/10 transition hover:bg-sage-light hover:shadow-xl hover:shadow-sage/10">
                  Explore Products <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
                <Link href="/contact" className="inline-flex h-13 items-center gap-2 rounded-full border border-white/20 bg-white/5 px-8 py-3.5 text-[15px] font-medium text-white backdrop-blur-sm transition hover:border-white/35 hover:bg-white/10">
                  Request a Quote
                </Link>
              </div>

              {/* Trust indicators — Inter + mono for data */}
              <div className="animate-slide-up hidden flex-wrap gap-x-6 gap-y-2 pt-8 md:flex [animation-delay:400ms]">
                <span className="flex items-center gap-2 text-sm font-medium text-white/55">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8"><ShieldCheck className="h-3.5 w-3.5 text-sage" /></span>
                  Batch Certified
                </span>
                <span className="flex items-center gap-2 text-sm font-medium text-white/55">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8"><Droplets className="h-3.5 w-3.5 text-sage" /></span>
                  <span className="font-mono text-[13px] tabular-nums">99%+</span> Purity
                </span>
                <span className="flex items-center gap-2 text-sm font-medium text-white/55">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/8"><Leaf className="h-3.5 w-3.5 text-sage" /></span>
                  Eco-Compliant
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute right-[10%] top-1/2 z-[1] hidden h-72 w-72 -translate-y-1/2 rounded-full bg-sage/8 blur-[100px] lg:block" />
      </section>
        }
      />

      {/* ═══ ABOUT COMPANY ═══ */}
      <HomeAboutSection />

      {/* ═══ CATEGORIES ═══ */}
      <section className="bg-cream py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-text-primary sm:text-3xl">
              Shop by Category
            </h2>
            <Link href="/shop" className="inline-flex items-center gap-1 text-sm font-medium text-accent link-underline">
              View all <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
            <button
              onClick={() => setSelectedCategory("All Products")}
              className={`vj-chip ${selectedCategory === "All Products" ? "vj-chip-active" : ""}`}
            >
              All
            </button>
            {categoryPills.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-2 py-1.5 pr-3 text-sm font-medium transition ${
                  selectedCategory === cat.name
                    ? "border-forest bg-forest text-on-dark"
                    : "border-transparent bg-white text-text-primary hover:bg-sage-light"
                }`}
              >
                {cat.image ? (
                  <img src={cat.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                ) : null}
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ PRODUCTS GRID ═══ */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-8">
              <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                Featured Products
              </h2>
              <p className="mt-2 max-w-lg text-base text-text-secondary">
                High-purity compounds with verified specifications and batch-level consistency.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
            {filteredProducts.map((p, i) => (
              <Reveal key={p.id} delayMs={Math.min(i, 6) * 60}>
                <DyeDataCard product={p} onQuickView={setSelectedProduct} />
              </Reveal>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/shop" className="vj-btn vj-btn-ghost h-12 px-7">
              Browse Full Catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ DIVISIONS ═══ */}
      <section className="bg-forest py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-on-dark sm:text-3xl">
                  Product Divisions
                </h2>
                <p className="mt-2 text-on-dark/60">Explore our specialized manufacturing verticals</p>
              </div>
              <Link href="/shop" className="hidden text-sm font-medium text-accent link-underline sm:inline-flex">
                Explore All
              </Link>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {DIVISIONS.map((d, i) => (
              <Reveal key={d.slug} delayMs={i * 70}>
                <Link
                  href={`/shop?division=${d.slug}`}
                  className="group relative flex h-64 flex-col justify-end overflow-hidden rounded-[1.75rem]"
                >
                  <div
                    className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url('${d.image}')` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="relative z-10 p-6">
                    <span className="mb-2 inline-block rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
                      Div {d.code}
                    </span>
                    <h3 className="font-display text-lg font-semibold text-white">{d.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-white/70">{d.description}</p>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ STATS ═══ */}
      <section className="py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
            {[
              { value: products.length, suffix: "+", label: "Listed Compounds", animate: true },
              { value: DIVISIONS.length, suffix: "", label: "Product Divisions", animate: true },
              { value: products.reduce((n, p) => n + (p.variants?.length || 1), 0), suffix: "", label: "Listed Variants", animate: true },
              { value: videos.length, suffix: "", label: "Technical Lessons", animate: true },
            ].map((stat) => (
              <div key={stat.label} className="rounded-[1.5rem] bg-sage-light/50 p-6 sm:p-8">
                <div className="font-display text-3xl font-bold tracking-tight text-forest sm:text-4xl">
                  {stat.animate ? <Counter to={stat.value as number} suffix={stat.suffix} /> : <>{stat.value}{stat.suffix}</>}
                </div>
                <p className="mt-2 text-xs font-medium text-text-secondary">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ QUOTE CALCULATOR ═══ */}
      <section className="pb-6">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <QuoteCalculator />
          </Reveal>
        </div>
      </section>

      {/* ═══ LEARNING CENTER ═══ */}
      <section className="py-14 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
                  Learning Center
                </h2>
                <p className="mt-2 text-base text-text-secondary">Dyeing and printing videos from our team</p>
              </div>
              <Link href="/education" className="hidden text-sm font-medium text-accent link-underline sm:inline-flex">
                Watch videos
              </Link>
            </div>
          </Reveal>

          {videos.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {videos.slice(0, 8).map((v) => (
                <Link
                  key={v.id}
                  href={`/education/${v.slug}`}
                  className="group overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-video bg-black">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={youtubeThumb(v.youtubeId || youtubeIdFromUrl(v.videoUrl), v.thumbnail)} alt="" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center bg-black/15">
                      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
                        <Play className="ml-0.5 h-4 w-4 fill-current" />
                      </span>
                    </span>
                  </div>
                  <div className="space-y-1 p-3">
                    <h3 className="line-clamp-2 text-sm font-semibold text-text-primary">{v.title}</h3>
                    <p className="line-clamp-2 text-xs text-text-secondary">{v.description}</p>
                    <p className="inline-flex items-center gap-1 text-[11px] text-text-secondary">
                      <Eye className="h-3 w-3 text-accent" />
                      {formatViews(v.views)} views
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No videos yet.</p>
          )}
        </div>
      </section>

      {/* ═══ TRUST ═══ */}
      <section className="bg-cream py-14 md:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <h2 className="font-display mb-8 text-center text-2xl font-bold tracking-tight text-text-primary sm:text-3xl">
              Why Precision Matters
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ShieldCheck, title: "Consistent Quality", desc: "Batch-level QC ensures reliable color and performance across runs." },
              { icon: Truck, title: "Industrial Logistics", desc: "Secure dispatch for hazardous and non-hazardous freight." },
              { icon: FileCheck2, title: "Technical Documentation", desc: "TDS, MSDS, and COA support for every product." },
              { icon: HelpCircle, title: "Application Guidance", desc: "Expert technical support for your substrate requirements." },
            ].map((item, i) => (
              <Reveal key={item.title} delayMs={i * 70}>
                <div className="h-full rounded-[1.75rem] bg-white p-7 shadow-sm">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-sage-light">
                    <item.icon className="h-5 w-5 text-forest" />
                  </div>
                  <h4 className="mb-2 text-base font-semibold text-text-primary">{item.title}</h4>
                  <p className="text-sm leading-relaxed text-text-secondary">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-[2.5rem] bg-forest px-8 py-14 text-center sm:px-12 md:py-20">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(184,196,168,0.15),transparent)]" />
              <h2 className="font-display relative text-3xl font-bold text-on-dark sm:text-4xl md:text-5xl">
                Precision Chemistry.<br />Reliable Color.
              </h2>
              <p className="relative mx-auto mt-4 max-w-lg text-base text-on-dark/65 md:text-lg">
                Partner with us for high-purity dyes and chemicals that deliver batch-level consistency.
              </p>
              <div className="relative mt-8 flex flex-wrap justify-center gap-4">
                <Link href="/shop" className="vj-btn vj-btn-accent h-12 px-8 text-[15px]">
                  View Catalog <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/contact" className="vj-btn h-12 border border-white/20 px-8 text-[15px] text-on-dark hover:bg-white/10">
                  Contact Sales
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
