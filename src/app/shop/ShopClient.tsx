"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COLOR_FILTERS } from "@/lib/constants";
import { fetchCategories, fetchCatalog, type CatalogPagination } from "@/lib/api";
import { CatalogCard, DyeDataCard } from "@/components/products/ProductCards";
import QuickViewModal from "@/components/ui/QuickViewModal";
import HeroBanner from "@/components/site/HeroBanner";
import Reveal from "@/components/visual/Reveal";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/types";
import {
  Search,
  SlidersHorizontal,
  Grid,
  List,
  RotateCcw,
  X,
  Filter,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 12;

function pageWindow(current: number, total: number) {
  const pages: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  const from = Math.max(1, end - 4);
  for (let n = from; n <= end; n += 1) pages.push(n);
  return pages;
}

export default function ShopPage() {
  const params = useSearchParams();
  const initialQ = params.get("q") || "";
  const initialDivision = params.get("division") || "";

  const [category, setCategory] = useState<string>("All Products");
  const [categories, setCategories] = useState<string[]>(["All Products"]);
  const [color, setColor] = useState<string>("");
  const [minPurity, setMinPurity] = useState(80);
  const [sort, setSort] = useState("relevance");
  const [query, setQuery] = useState(initialQ);
  const [viewMode, setViewMode] = useState<"data" | "grid" | "compact">("data");

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<CatalogPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { showToast } = useToast();

  useEffect(() => {
    let cancelled = false;
    fetchCategories()
      .then((list) => {
        if (!cancelled) setCategories(list);
      })
      .catch(() => {
        if (!cancelled) setCategories(["All Products"]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [query, initialDivision, category, color, minPurity, sort]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchCatalog({
          page: String(page),
          limit: String(PAGE_SIZE),
          ...(query ? { q: query } : {}),
          ...(initialDivision ? { division: initialDivision } : {}),
          ...(category !== "All Products" ? { category } : {}),
          ...(color ? { color } : {}),
          ...(minPurity > 80 ? { minPurity: String(minPurity) } : {}),
          ...(sort !== "relevance" ? { sort } : {}),
        });
        if (!cancelled) {
          setProducts(data.products);
          setPagination(data.pagination);
        }
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setPagination(null);
          setError(err instanceof Error ? err.message : "Could not load catalog");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [query, initialDivision, category, color, minPurity, sort, page]);

  const filtered = useMemo(() => products, [products]);

  const reset = () => {
    setCategory("All Products");
    setColor("");
    setMinPurity(80);
    setSort("relevance");
    setQuery("");
    setPage(1);
    showToast("Filters reset", "Catalog reset to default view", "info");
  };

  const goToPage = (next: number) => {
    const pages = pagination?.pages || 1;
    const clamped = Math.min(pages, Math.max(1, next));
    setPage(clamped);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const totalCount = pagination?.total ?? filtered.length;
  const rangeStart = filtered.length ? (pagination ? (pagination.page - 1) * pagination.limit + 1 : 1) : 0;
  const rangeEnd = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : filtered.length;

  const hasActiveFilters = category !== "All Products" || color !== "" || minPurity > 80 || query !== "";

  return (
    <div className="pb-24">
      <HeroBanner
        placement="shop"
        variant="page"
        fallback={
      <section className="bg-cream pb-10 pt-10 md:pb-14 md:pt-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <span className="tech-label mb-3 inline-flex items-center rounded-full bg-sage-light px-3.5 py-1.5 text-forest">
            Technical Catalog
          </span>
          <h1 className="font-display max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-text-primary sm:text-5xl sm:leading-[1.08]">
            Explore Our<br />Dye Solutions
          </h1>
          <p className="mt-3 max-w-xl text-base text-text-secondary">
            {loading
              ? "Searching inventory…"
              : `${totalCount} compounds with verified specifications, packaging options, and bulk pricing.`}
          </p>
        </div>
      </section>
        }
      />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
        <QuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />

        {/* Sticky toolbar */}
        <div className="sticky top-[72px] z-30 mb-8">
          <div className="flex flex-wrap items-center gap-2.5 rounded-[1.5rem] border border-border-hairline bg-white/80 p-3 shadow-sm backdrop-blur-md">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-2 rounded-full bg-sage-light px-4 py-2.5 text-xs font-medium text-forest lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {hasActiveFilters && <span className="h-2 w-2 rounded-full bg-accent" />}
            </button>

            <div className="relative min-w-0 flex-1 md:max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="vj-input h-10 !pl-11"
                placeholder="Search catalog, CAS…"
                aria-label="Search catalog"
              />
            </div>

            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort catalog"
              className="h-10 rounded-full border border-border-hairline bg-white px-4 text-xs font-medium text-text-primary outline-none"
            >
              <option value="relevance">Relevance</option>
              <option value="purity">Purity ↓</option>
              <option value="price">Price ↑</option>
              <option value="name">Name A-Z</option>
            </select>

            <div className="hidden items-center gap-1 rounded-full border border-border-hairline p-1 sm:flex">
              <button
                onClick={() => setViewMode("data")}
                aria-pressed={viewMode === "data"}
                className={`rounded-full p-2 transition ${viewMode === "data" ? "bg-forest text-on-dark" : "text-text-secondary hover:text-text-primary"}`}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={`rounded-full p-2 transition ${viewMode === "grid" ? "bg-forest text-on-dark" : "text-text-secondary hover:text-text-primary"}`}
              >
                <Grid className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {category !== "All Products" && (
              <button onClick={() => setCategory("All Products")} className="vj-chip">{category} <X className="h-3 w-3" /></button>
            )}
            {color && (
              <button onClick={() => setColor("")} className="vj-chip">Color <X className="h-3 w-3" /></button>
            )}
            {minPurity > 80 && (
              <button onClick={() => setMinPurity(80)} className="vj-chip">≥ {minPurity}% <X className="h-3 w-3" /></button>
            )}
            {query && (
              <button onClick={() => setQuery("")} className="vj-chip">&quot;{query}&quot; <X className="h-3 w-3" /></button>
            )}
            <button onClick={reset} className="ml-auto flex items-center gap-1 text-xs font-medium text-accent">
              <RotateCcw className="h-3 w-3" /> Clear all
            </button>
          </div>
        )}

        <div className="flex w-full gap-8">
          {/* Sidebar */}
          <aside className="sticky top-[150px] hidden h-[calc(100vh-180px)] w-60 shrink-0 space-y-7 overflow-y-auto pr-2 lg:block">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <Filter className="h-4 w-4 text-forest" /> Filters
              </h2>
              {hasActiveFilters && (
                <button onClick={reset} className="text-xs font-medium text-accent">Reset</button>
              )}
            </div>

            <div>
              <h3 className="tech-label mb-3 text-text-secondary">Categories</h3>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c}>
                    <button
                      onClick={() => setCategory(c)}
                      className={`flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-[13px] font-medium transition ${
                        category === c
                          ? "bg-forest text-on-dark"
                          : "text-text-secondary hover:bg-sage-light hover:text-text-primary"
                      }`}
                    >
                      <span className="whitespace-nowrap">{c}</span>
                      {category === c && <CheckCircle2 className="h-3.5 w-3.5" />}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="tech-label mb-3 text-text-secondary">Color Swatch</h3>
              <div className="grid grid-cols-4 gap-2.5">
                {COLOR_FILTERS.map((c) => (
                  <button
                    key={c.id}
                    title={c.label}
                    aria-label={`Filter by ${c.label}`}
                    aria-pressed={color === c.id}
                    onClick={() => setColor(color === c.id ? "" : c.id)}
                    className={`h-8 w-8 rounded-full border-2 transition ${
                      color === c.id ? "border-forest scale-110 shadow-md" : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="tech-label text-text-secondary">Min. Purity</h3>
                <span className="rounded-full bg-sage-light px-2.5 py-0.5 font-mono text-xs font-semibold text-forest">
                  ≥ {minPurity}%
                </span>
              </div>
              <input
                type="range"
                min={80}
                max={99.9}
                step={0.5}
                value={minPurity}
                aria-label="Minimum purity"
                onChange={(e) => setMinPurity(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-sage-light accent-forest"
              />
            </div>

            <div className="rounded-[1.5rem] bg-forest p-5">
              <p className="text-sm font-semibold text-on-dark">Need a custom shade?</p>
              <p className="mt-2 text-xs leading-relaxed text-on-dark/60">
                Our lab develops formulations matched to your substrate and process.
              </p>
              <a href="/contact" className="vj-btn vj-btn-accent mt-4 h-9 px-4 text-[11px]">
                Request a quote
              </a>
            </div>
          </aside>

          {/* Product Grid */}
          <section id="catalog" className="w-full min-w-0 flex-1">
            {error ? (
              <div className="rounded-[1.5rem] bg-red-50 p-6 text-center text-sm font-medium text-red-700">{error}</div>
            ) : null}

            {loading ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="h-80 animate-pulse rounded-[1.75rem] bg-cream" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="my-6 rounded-[2rem] bg-white p-12 text-center shadow-sm">
                <Search className="mx-auto mb-4 h-12 w-12 text-text-secondary" />
                <h3 className="text-lg font-semibold text-text-primary">No products match</h3>
                <p className="mb-6 mt-1 text-sm text-text-secondary">
                  Try adjusting purity, color, or search terms.
                </p>
                <button onClick={reset} className="vj-btn vj-btn-primary h-11 px-6">Reset filters</button>
              </div>
            ) : viewMode === "data" ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p, i) => (
                  <Reveal key={p.id} delayMs={Math.min(i, 8) * 50}>
                    <DyeDataCard product={p} onQuickView={setSelectedProduct} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((p, i) => (
                  <Reveal key={p.id} delayMs={Math.min(i, 8) * 50}>
                    <CatalogCard product={p} featured={i === 0} onQuickView={setSelectedProduct} />
                  </Reveal>
                ))}
              </div>
            )}

            {!loading && pagination && pagination.pages > 1 ? (
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <p className="text-xs text-text-secondary">
                  Showing {rangeStart}–{rangeEnd} of {totalCount}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={pagination.page <= 1}
                    onClick={() => goToPage(pagination.page - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border-hairline bg-white text-text-primary disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {pageWindow(pagination.page, pagination.pages).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goToPage(n)}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold ${
                        n === pagination.page
                          ? "bg-forest text-on-dark"
                          : "border border-border-hairline bg-white text-text-primary hover:bg-sage-light"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => goToPage(pagination.page + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border-hairline bg-white text-text-primary disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : !loading && pagination && pagination.total > 0 ? (
              <p className="mt-6 text-center text-xs text-text-secondary">
                Showing {rangeStart}–{rangeEnd} of {totalCount}
              </p>
            ) : null}
          </section>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-xs flex-col justify-between overflow-y-auto bg-white p-6 animate-slide-up">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-text-primary">Filters</h3>
                <button onClick={() => setMobileFilterOpen(false)} aria-label="Close filters">
                  <X className="h-5 w-5 text-text-secondary" />
                </button>
              </div>
              <div className="space-y-1">
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setCategory(c); setMobileFilterOpen(false); }}
                    className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium ${
                      category === c ? "bg-forest text-on-dark" : "text-text-primary hover:bg-sage-light"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setMobileFilterOpen(false)} className="vj-btn vj-btn-primary h-12 w-full">
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
