"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { COLOR_FILTERS, DIVISIONS } from "@/lib/constants";
import { fetchCategories, fetchCatalog, fetchProductReviews } from "@/lib/api";
import { CatalogGridCard, CatalogListCard, type RatingMap } from "@/components/products/ProductCards";
import QuickViewModal from "@/components/ui/QuickViewModal";
import HeroBanner from "@/components/site/HeroBanner";
import Reveal from "@/components/visual/Reveal";
import { useToast } from "@/components/ui/Toast";
import type { Product } from "@/types";
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  LayoutList,
  RotateCcw,
  X,
  Filter,
  ChevronDown,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 12;
const FETCH_LIMIT = 500;

type ViewMode = "grid" | "list";
type SortMode = "popularity" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "rating";

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function pageWindow(current: number, total: number) {
  const pages: number[] = [];
  const start = Math.max(1, current - 2);
  const end = Math.min(total, start + 4);
  const from = Math.max(1, end - 4);
  for (let n = from; n <= end; n += 1) pages.push(n);
  return pages;
}

function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

function countBy(items: Product[], key: (p: Product) => string | null) {
  const map = new Map<string, number>();
  items.forEach((p) => {
    const k = key(p);
    if (!k) return;
    map.set(k, (map.get(k) || 0) + 1);
  });
  return map;
}

function FilterSection({
  title,
  children,
  open = true,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  const [expanded, setExpanded] = useState(open);
  return (
    <div className="border-b border-line pb-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mb-3 flex w-full items-center justify-between text-sm font-semibold text-ink"
      >
        {title}
        <ChevronDown className={`h-4 w-4 text-ink-mute transition ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded ? <div className="space-y-2">{children}</div> : null}
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 text-[13px] text-ink-mute transition hover:text-ink">
      <span className="flex items-center gap-2">
        <span
          className={`flex h-4 w-4 items-center justify-center rounded border transition ${
            checked ? "border-brand bg-brand text-brand-ink" : "border-line bg-surface"
          }`}
        >
          {checked ? <X className="h-3 w-3 rotate-45" /> : null}
        </span>
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        {label}
      </span>
      {count !== undefined ? <span className="text-xs text-ink-dim">{count}</span> : null}
    </label>
  );
}

export default function ShopPage() {
  const params = useSearchParams();
  const initialQ = params.get("q") || "";
  const initialDivision = params.get("division") || "";
  const initialCategory = params.get("category") || "All Products";

  const [category, setCategory] = useState<string>(initialCategory);
  const [categories, setCategories] = useState<string[]>(["All Products"]);
  const [selectedDivisions, setSelectedDivisions] = useState<string[]>(initialDivision ? [initialDivision] : []);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500000]);
  const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 500000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [sort, setSort] = useState<SortMode>("popularity");
  const [query, setQuery] = useState(initialQ);
  const debouncedQuery = useDebouncedValue(query, 300);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [ratings, setRatings] = useState<RatingMap>({});
  const fetchingRatings = useRef(false);

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
    setCategory(params.get("category") || "All Products");
    setQuery(params.get("q") || "");
    const div = params.get("division");
    setSelectedDivisions(div ? [div] : []);
  }, [params]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchCatalog({
          limit: String(FETCH_LIMIT),
          ...(initialQ ? { q: initialQ } : {}),
          ...(initialDivision ? { division: initialDivision } : {}),
          ...(initialCategory !== "All Products" ? { category: initialCategory } : {}),
        });
        if (!cancelled) {
          setProducts(data.products);
          setPage(1);
          const prices = data.products.map((p) => Number(p.price) || 0).filter((p) => p > 0);
          const min = prices.length ? Math.floor(Math.min(...prices)) : 0;
          const max = prices.length ? Math.ceil(Math.max(...prices)) : 500000;
          setPriceBounds([min, max]);
          setPriceRange([min, max]);
        }
      } catch (err) {
        if (!cancelled) {
          setProducts([]);
          setError(err instanceof Error ? err.message : "Could not load catalog");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCategory, initialDivision, initialQ]);

  const categoryCounts = useMemo(() => countBy(products, (p) => p.category || null), [products]);
  const divisionCounts = useMemo(() => countBy(products, (p) => p.division || null), [products]);

  const filtered = useMemo(() => {
    let list = [...products];

    if (category !== "All Products") {
      list = list.filter((p) => p.category === category);
    }

    if (selectedDivisions.length) {
      list = list.filter((p) => selectedDivisions.includes(p.division));
    }

    if (selectedColors.length) {
      list = list.filter((p) => selectedColors.includes(p.color));
    }

    list = list.filter((p) => {
      const price = Number(p.price) || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          (p.cas || "").toLowerCase().includes(q) ||
          (p.grade || "").toLowerCase().includes(q)
      );
    }

    if (minRating > 0) {
      list = list.filter((p) => (ratings[p.id]?.average || 0) >= minRating);
    }

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;
      case "price-desc":
        list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;
      case "name-asc":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        list.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "rating":
        list.sort((a, b) => (ratings[b.id]?.average || 0) - (ratings[a.id]?.average || 0));
        break;
      default:
        // popularity: featured first, then in-stock
        list.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b.stockKg || 0) - (a.stockKg || 0);
        });
    }

    return list;
  }, [products, category, selectedDivisions, selectedColors, priceRange, debouncedQuery, minRating, sort, ratings]);

  const totalCount = filtered.length;
  const pages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = clamp(page, 1, pages);
  const pageProducts = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  useEffect(() => {
    setPage(1);
  }, [category, selectedDivisions, selectedColors, priceRange, debouncedQuery, minRating, sort]);

  useEffect(() => {
    if (pageProducts.length === 0) return;
    if (sort === "rating" || minRating > 0) return; // already loaded below
    let cancelled = false;
    fetchingRatings.current = true;
    Promise.all(
      pageProducts.map(async (p) => {
        try {
          const { summary } = await fetchProductReviews(p.slug);
          return { id: p.id, average: summary.average, count: summary.count } as const;
        } catch {
          return { id: p.id, average: 0, count: 0 } as const;
        }
      })
    )
      .then((rows) => {
        if (cancelled) return;
        setRatings((prev) => {
          const next = { ...prev };
          rows.forEach((r) => {
            next[r.id] = { average: r.average, count: r.count };
          });
          return next;
        });
      })
      .finally(() => {
        fetchingRatings.current = false;
      });
    return () => {
      cancelled = true;
    };
  }, [pageProducts, sort, minRating]);

  useEffect(() => {
    if (sort !== "rating" && minRating === 0) return;
    // If sorting/filtering by rating, fetch summaries for all filtered products (limit to first 60 to avoid overload)
    const targets = filtered.slice(0, 60);
    if (targets.length === 0) return;
    let cancelled = false;
    Promise.all(
      targets.map(async (p) => {
        try {
          const { summary } = await fetchProductReviews(p.slug);
          return { id: p.id, average: summary.average, count: summary.count } as const;
        } catch {
          return { id: p.id, average: 0, count: 0 } as const;
        }
      })
    ).then((rows) => {
      if (cancelled) return;
      setRatings((prev) => {
        const next = { ...prev };
        rows.forEach((r) => {
          next[r.id] = { average: r.average, count: r.count };
        });
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [filtered, sort, minRating]);

  const toggleDivision = (slug: string) => {
    setSelectedDivisions((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };

  const toggleColor = (id: string) => {
    setSelectedColors((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const reset = () => {
    setCategory("All Products");
    setSelectedDivisions([]);
    setSelectedColors([]);
    setPriceRange(priceBounds);
    setMinRating(0);
    setSort("popularity");
    setQuery("");
    setPage(1);
    showToast("Filters reset", "Catalog reset to default view", "info");
  };

  const hasActiveFilters =
    category !== "All Products" ||
    selectedDivisions.length > 0 ||
    selectedColors.length > 0 ||
    minRating > 0 ||
    priceRange[0] > priceBounds[0] ||
    priceRange[1] < priceBounds[1] ||
    query !== "";

  const goToPage = (next: number) => {
    const clamped = clamp(next, 1, pages);
    setPage(clamped);
    document.getElementById("catalog")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const rangeStart = totalCount ? (safePage - 1) * PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, totalCount);

  const filterSidebar = (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <Filter className="h-4 w-4" /> Filters
        </h2>
        {hasActiveFilters && (
          <button onClick={reset} className="text-xs font-medium text-brand hover:text-brand-hi">
            Reset all
          </button>
        )}
      </div>

      <FilterSection title="Categories" open>
        {categories.map((c) => (
          <CheckboxRow
            key={c}
            checked={category === c}
            onChange={() => setCategory(c)}
            label={c}
            count={c === "All Products" ? products.length : (categoryCounts.get(c) ?? 0)}
          />
        ))}
      </FilterSection>

      <FilterSection title="Product Line" open>
        {DIVISIONS.map((d) => (
          <CheckboxRow
            key={d.slug}
            checked={selectedDivisions.includes(d.slug)}
            onChange={() => toggleDivision(d.slug)}
            label={d.short}
            count={divisionCounts.get(d.slug) ?? 0}
          />
        ))}
      </FilterSection>

      <FilterSection title="Price Range" open>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-dim">₹</span>
              <input
                type="number"
                value={priceRange[0]}
                onChange={(e) => setPriceRange([Math.max(priceBounds[0], Number(e.target.value) || 0), priceRange[1]])}
                className="h-10 w-full rounded-xl border border-line bg-surface pl-6 pr-2 text-xs text-ink outline-none focus:border-brand"
                placeholder="Min"
              />
            </div>
            <span className="text-ink-dim">—</span>
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-dim">₹</span>
              <input
                type="number"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], Math.min(priceBounds[1], Number(e.target.value) || priceBounds[1])])}
                className="h-10 w-full rounded-xl border border-line bg-surface pl-6 pr-2 text-xs text-ink outline-none focus:border-brand"
                placeholder="Max"
              />
            </div>
          </div>
          <input
            type="range"
            min={priceBounds[0]}
            max={priceBounds[1]}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-brand"
          />
          <div className="flex justify-between text-[11px] text-ink-dim">
            <span>{formatINRCompact(priceBounds[0])}</span>
            <span>{formatINRCompact(priceBounds[1])}</span>
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Rating" open>
        {[4, 3, 2, 1].map((rating) => (
          <label
            key={rating}
            className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2 transition ${
              minRating === rating ? "border-brand bg-brand/5" : "border-line bg-transparent hover:bg-surface-2"
            }`}
          >
            <span className="flex items-center gap-2 text-[13px] text-ink">
              <input
                type="radio"
                name="rating"
                checked={minRating === rating}
                onChange={() => setMinRating(rating)}
                className="sr-only"
              />
              <span className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-3.5 w-3.5 ${i < rating ? "fill-brand text-brand" : "fill-surface text-line-hi"}`}
                  />
                ))}
              </span>
              <span className="text-ink-mute">& Up</span>
            </span>
          </label>
        ))}
        {minRating > 0 && (
          <button onClick={() => setMinRating(0)} className="text-xs font-medium text-brand hover:text-brand-hi">
            Clear rating
          </button>
        )}
      </FilterSection>

      <FilterSection title="Color Shade" open>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_FILTERS.map((c) => (
            <button
              key={c.id}
              title={c.label}
              aria-label={`Filter by ${c.label}`}
              aria-pressed={selectedColors.includes(c.id)}
              onClick={() => toggleColor(c.id)}
              className={`group relative h-9 w-9 rounded-full border-2 transition ${
                selectedColors.includes(c.id) ? "border-brand scale-110" : "border-transparent hover:scale-105"
              }`}
              style={{ backgroundColor: c.hex }}
            >
              {selectedColors.includes(c.id) ? (
                <span className="absolute inset-0 flex items-center justify-center">
                  <X className="h-3.5 w-3.5 text-white drop-shadow-md rotate-45" />
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </FilterSection>

      <div className="rounded-2xl border border-line bg-surface-2 p-5">
        <p className="text-sm font-semibold text-ink">Need a custom shade?</p>
        <p className="mt-2 text-xs leading-relaxed text-ink-mute">
          Our lab develops formulations matched to your substrate and process.
        </p>
        <a
          href="/contact"
          className="mt-4 inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-brand px-4 text-[11px] font-medium text-brand-ink transition hover:bg-brand-hi"
        >
          Request a quote
        </a>
      </div>
    </div>
  );

  return (
    <div className="pb-24">
      <HeroBanner
        placement="shop"
        variant="page"
        fallback={
          <section className="bg-bg pb-10 pt-10 md:pb-14 md:pt-14">
            <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
              <span className="tech-label mb-3 inline-flex items-center rounded-full border border-line bg-surface px-3.5 py-1.5 text-ink">
                Technical Catalog
              </span>
              <h1 className="font-display max-w-2xl text-3xl font-semibold tracking-[-0.02em] text-ink sm:text-5xl sm:leading-[1.08]">
                Explore Our
                <br />
                Dye Solutions
              </h1>
              <p className="mt-3 max-w-xl text-base text-ink-mute">
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

        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 shadow-card sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-xs font-medium text-ink lg:hidden"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
              {hasActiveFilters && <span className="ml-1 h-2 w-2 rounded-full bg-brand" />}
            </button>

            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-dim" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-11 w-full rounded-xl border border-line bg-bg pl-10 pr-4 text-sm text-ink placeholder:text-ink-dim outline-none transition focus:border-brand"
                placeholder="Search catalog, CAS number, grade…"
                aria-label="Search catalog"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              aria-label="Sort catalog"
              className="h-11 rounded-xl border border-line bg-bg px-3 text-xs font-medium text-ink outline-none focus:border-brand sm:px-4"
            >
              <option value="popularity">Sort by: Popularity</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="name-asc">Name: A-Z</option>
              <option value="name-desc">Name: Z-A</option>
              <option value="rating">Top Rated</option>
            </select>

            <div className="flex items-center rounded-xl border border-line p-1">
              <button
                onClick={() => setViewMode("grid")}
                aria-pressed={viewMode === "grid"}
                className={`rounded-lg p-2 transition ${
                  viewMode === "grid" ? "bg-surface-2 text-ink" : "text-ink-mute hover:text-ink"
                }`}
                aria-label="Grid view"
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                aria-pressed={viewMode === "list"}
                className={`rounded-lg p-2 transition ${
                  viewMode === "list" ? "bg-surface-2 text-ink" : "text-ink-mute hover:text-ink"
                }`}
                aria-label="List view"
              >
                <LayoutList className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Active filters */}
        {hasActiveFilters && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {category !== "All Products" && (
              <button
                onClick={() => setCategory("All Products")}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand"
              >
                {category} <X className="h-3 w-3" />
              </button>
            )}
            {selectedDivisions.map((slug) => {
              const label = DIVISIONS.find((d) => d.slug === slug)?.short || slug;
              return (
                <button
                  key={slug}
                  onClick={() => toggleDivision(slug)}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand"
                >
                  {label} <X className="h-3 w-3" />
                </button>
              );
            })}
            {selectedColors.map((id) => {
              const label = COLOR_FILTERS.find((c) => c.id === id)?.label || id;
              return (
                <button
                  key={id}
                  onClick={() => toggleColor(id)}
                  className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand"
                >
                  {label} <X className="h-3 w-3" />
                </button>
              );
            })}
            {minRating > 0 && (
              <button
                onClick={() => setMinRating(0)}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand"
              >
                {minRating}+ Stars <X className="h-3 w-3" />
              </button>
            )}
            {(priceRange[0] > priceBounds[0] || priceRange[1] < priceBounds[1]) && (
              <button
                onClick={() => setPriceRange(priceBounds)}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand"
              >
                ₹{formatINRCompact(priceRange[0])} - ₹{formatINRCompact(priceRange[1])} <X className="h-3 w-3" />
              </button>
            )}
            {query && (
              <button
                onClick={() => setQuery("")}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium text-ink transition hover:border-brand"
              >
                &quot;{query}&quot; <X className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={reset}
              className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-hi"
            >
              <RotateCcw className="h-3 w-3" /> Clear all
            </button>
          </div>
        )}

        <div className="flex w-full gap-8">
          {/* Sidebar */}
          <aside className="sticky top-[140px] hidden h-[calc(100vh-180px)] w-64 shrink-0 overflow-y-auto pr-2 lg:block">
            {filterSidebar}
          </aside>

          {/* Product area */}
          <section id="catalog" className="w-full min-w-0 flex-1">
            {/* Result bar */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-ink-mute">
                {loading ? (
                  "Loading products…"
                ) : totalCount === 0 ? (
                  "No products found"
                ) : (
                  <>
                    Showing <span className="font-semibold text-ink">{rangeStart}–{rangeEnd}</span> of{" "}
                    <span className="font-semibold text-ink">{totalCount}</span> products
                  </>
                )}
              </p>
            </div>

            {error ? (
              <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm font-medium text-ink">
                {error}
              </div>
            ) : null}

            {loading ? (
              <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3" : "space-y-4"}>
                {Array.from({ length: 6 }).map((_, n) => (
                  <div key={n} className="h-80 animate-pulse rounded-2xl border border-line bg-surface" />
                ))}
              </div>
            ) : pageProducts.length === 0 ? (
              <div className="my-6 rounded-2xl border border-line bg-surface p-12 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-ink-dim" />
                <h3 className="text-lg font-semibold text-ink">No products match</h3>
                <p className="mb-6 mt-1 text-sm text-ink-mute">Try adjusting filters, price range, or search terms.</p>
                <button onClick={reset} className="inline-flex h-11 items-center gap-1.5 rounded-xl bg-brand px-6 text-xs font-medium text-brand-ink transition hover:bg-brand-hi">
                  <RotateCcw className="h-4 w-4" /> Reset filters
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                {pageProducts.map((p, i) => (
                  <Reveal key={p.id} delayMs={Math.min(i, 8) * 50}>
                    <CatalogGridCard product={p} onQuickView={setSelectedProduct} rating={ratings[p.id]} />
                  </Reveal>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {pageProducts.map((p, i) => (
                  <Reveal key={p.id} delayMs={Math.min(i, 8) * 50}>
                    <CatalogListCard product={p} onQuickView={setSelectedProduct} rating={ratings[p.id]} />
                  </Reveal>
                ))}
              </div>
            )}

            {!loading && pages > 1 ? (
              <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
                <p className="text-xs text-ink-mute">
                  Showing {rangeStart}–{rangeEnd} of {totalCount}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() => goToPage(safePage - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:bg-surface-2 disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {pageWindow(safePage, pages).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => goToPage(n)}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-semibold transition ${
                        n === safePage
                          ? "bg-brand text-brand-ink"
                          : "border border-line bg-surface text-ink hover:bg-surface-2"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={safePage >= pages}
                    onClick={() => goToPage(safePage + 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink transition hover:bg-surface-2 disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ) : !loading && totalCount > 0 ? (
              <p className="mt-6 text-center text-xs text-ink-mute">
                Showing {rangeStart}–{rangeEnd} of {totalCount}
              </p>
            ) : null}
          </section>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
          <div className="flex h-full w-full max-w-xs flex-col justify-between overflow-y-auto border-l border-line bg-surface p-6 animate-slide-up">
            <div className="space-y-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-ink">Filters</h3>
                <button onClick={() => setMobileFilterOpen(false)} aria-label="Close filters">
                  <X className="h-5 w-5 text-ink-mute" />
                </button>
              </div>
              {filterSidebar}
            </div>
            <button
              onClick={() => setMobileFilterOpen(false)}
              className="mt-4 h-12 w-full rounded-xl bg-brand text-sm font-medium text-brand-ink transition hover:bg-brand-hi"
            >
              Show {totalCount} result{totalCount === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatINRCompact(value: number) {
  if (value >= 100000) return `${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toString();
}
