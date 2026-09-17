import { API_URL } from "@/lib/constants";
import { youtubeIdFromUrl, youtubeThumb } from "@/lib/youtube";
import type {
  Address,
  CatalogOffer,
  EducationVideo,
  Gender,
  LocationCity,
  LocationState,
  NotificationItem,
  Order,
  Product,
  ProductReview,
  ReviewEligibility,
  ReviewSummary,
  SiteBanner,
  SiteSettings,
  User,
} from "@/types";

export class ApiError extends Error {
  status: number;
  errors: Array<{ path?: string; message?: string }>;

  constructor(message: string, status = 500, errors: Array<{ path?: string; message?: string }> = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

type RequestOpts = {
  method?: string;
  body?: unknown;
  token?: string | null;
  cache?: RequestCache;
  retries?: number;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number) {
  return status === 408 || status === 429 || status === 502 || status === 503 || status === 504;
}

async function request<T>(path: string, opts: RequestOpts = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const attempts = Math.max(1, (opts.retries ?? 0) + 1);
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const res = await fetch(`${API_URL}${path}`, {
        method: opts.method || "GET",
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        cache: opts.cache ?? "no-store",
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.success === false) {
        const err = new ApiError(
          data?.message || `Request failed (${res.status})`,
          res.status,
          data?.errors || []
        );
        if (attempt < attempts && isRetryableStatus(res.status)) {
          lastError = err;
          await sleep(250 * attempt);
          continue;
        }
        throw err;
      }
      return data as T;
    } catch (err) {
      lastError = err;
      const network = err instanceof TypeError || (err instanceof Error && /failed to fetch|network/i.test(err.message));
      if (err instanceof ApiError) throw err;
      if (attempt < attempts && network) {
        await sleep(250 * attempt);
        continue;
      }
      throw err;
    }
  }

  throw lastError instanceof Error ? lastError : new ApiError("Request failed", 500);
}

function galleryUrls(raw: unknown, fallback = ""): string[] {
  if (!Array.isArray(raw) || !raw.length) return fallback ? [fallback] : [];
  return raw
    .map((item) => (typeof item === "string" ? item : item && typeof item === "object" && "url" in item ? String((item as { url?: string }).url || "") : ""))
    .filter(Boolean);
}

function normalizeProduct(p: Product & { _id?: string; code?: string; images?: unknown }): Product {
  const images = galleryUrls(p.images, p.image);
  const variants = Array.isArray(p.variants)
    ? p.variants.map((v) => {
        const size = String(v.size || v.name || "");
        const shade = String(v.shade || "");
        const name = size && shade ? `${size} / ${shade}` : size || shade || String(v.name || "");
        const images = Array.isArray(v.images)
          ? v.images
              .map((item) =>
                typeof item === "string"
                  ? { url: item }
                  : { url: String(item?.url || ""), publicId: item?.publicId }
              )
              .filter((item) => item.url)
          : [];
        return {
          id: String(v.id),
          size,
          shade,
          name,
          sku: String(v.sku || ""),
          price: Number(v.price) || 0,
          stock: Number(v.stock) || 0,
          images,
        };
      })
    : [];
  return {
    ...p,
    id: String(p.code || p.id || p._id || p.slug),
    _id: String(p._id || ""),
    color: (p.color || "blue") as Product["color"],
    colorHex: p.colorHex || "#2563eb",
    purity: Number(p.purity ?? 0),
    price: Number(p.price ?? 0),
    unit: p.unit || "kg",
    stockKg: Number(p.stockKg ?? 0),
    stockAlertLimit: Number(p.stockAlertLimit ?? 50),
    status: p.status || "in-stock",
    grade: p.grade || "",
    description: p.description || "",
    image: images[0] || p.image || "",
    images,
    packing: p.packing || "",
    division: p.division || "chemicals",
    category: p.category || "",
    variants,
    volumeTiers: [],
    applications: p.applications || "",
    storage: p.storage || "",
    safety: p.safety || "",
    certificateTitle: p.certificateTitle || "",
    certificateNote: p.certificateNote || "",
    certificateUrl: p.certificateUrl || "",
    offer: p.offer || null,
  };
}

function normalizeVideo(v: EducationVideo & { _id?: string }): EducationVideo {
  const youtubeId = v.youtubeId || youtubeIdFromUrl(v.videoUrl);
  return {
    ...v,
    id: String(v.id || v._id || v.slug),
    duration: v.duration || "0:00",
    durationSeconds: Number(v.durationSeconds || 0),
    views: Number(v.views || 0),
    tier: (v.tier || "Guide") as EducationVideo["tier"],
    category: v.category || "Guide",
    thumbnail: youtubeThumb(youtubeId, v.thumbnail || ""),
    description: v.description || "",
    youtubeId,
    videoUrl: v.videoUrl || (youtubeId ? `https://www.youtube.com/watch?v=${youtubeId}` : ""),
  };
}

function normalizeUser(u: User & { _id?: string }): User {
  return {
    ...u,
    id: String(u.id || u._id || u.phone),
    avatar: u.avatar || "",
    company: {
      name: u.company?.name || "",
      gstin: u.company?.gstin || "",
      pan: u.company?.pan || "",
    },
  };
}

/* ── Catalog ── */

export async function fetchProducts(params: Record<string, string> = {}): Promise<Product[]> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const data = await request<{ products: Product[] }>(
    `/products${qs.toString() ? `?${qs}` : ""}`
  );
  return (data.products || []).map(normalizeProduct);
}

export type CatalogPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export async function fetchCatalog(
  params: Record<string, string> = {}
): Promise<{ products: Product[]; pagination: CatalogPagination }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const data = await request<{ products: Product[]; pagination?: CatalogPagination }>(
    `/products${qs.toString() ? `?${qs}` : ""}`
  );
  const products = (data.products || []).map(normalizeProduct);
  const pagination = data.pagination || {
    page: 1,
    limit: products.length || 12,
    total: products.length,
    pages: 1,
  };
  return { products, pagination };
}

export type CatalogCategory = {
  name: string;
  slug?: string;
  image?: string;
};

export async function fetchOffers(): Promise<CatalogOffer[]> {
  try {
    const data = await request<{ offers: CatalogOffer[] }>("/offers");
    return data.offers || [];
  } catch {
    return [];
  }
}

export async function fetchCategoryCatalog(): Promise<CatalogCategory[]> {
  try {
    const data = await request<{ categories: CatalogCategory[] }>("/site/categories");
    return (data.categories || []).filter((c) => c.name);
  } catch {
    return [];
  }
}

export async function fetchCategories(): Promise<string[]> {
  const cats = await fetchCategoryCatalog();
  if (!cats.length) {
    return [
      "All Products",
      "Reactive Dyes",
      "Acid Dyes",
      "Direct Dyes",
      "Solvent Dyes",
      "Pigments",
      "Auxiliaries",
    ];
  }
  return ["All Products", ...cats.map((c) => c.name)];
}

export async function fetchProduct(slug: string): Promise<Product | null> {
  try {
    const data = await request<{ product: Product }>(`/products/${encodeURIComponent(slug)}`);
    return data.product ? normalizeProduct(data.product) : null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function fetchVideos(): Promise<EducationVideo[]> {
  const data = await request<{ videos: EducationVideo[] }>("/videos");
  return (data.videos || []).map(normalizeVideo);
}

export async function fetchVideo(slug: string): Promise<EducationVideo | null> {
  try {
    const data = await request<{ video: EducationVideo }>(`/videos/${encodeURIComponent(slug)}`);
    return data.video ? normalizeVideo(data.video) : null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function recordVideoView(slug: string): Promise<number> {
  const data = await request<{ views: number }>(`/videos/${encodeURIComponent(slug)}/view`, { method: "POST", body: {} });
  return Number(data.views || 0);
}

/* ── Auth ── */

export async function sendOtp(phone: string) {
  return request<{ phone: string; message: string; otp?: string }>("/auth/send-otp", {
    method: "POST",
    body: { phone },
  });
}

export async function verifyOtp(phone: string, otp: string) {
  const data = await request<{
    token: string;
    user: User;
    needsProfile?: boolean;
  }>("/auth/verify-otp", {
    method: "POST",
    body: { phone, otp },
  });
  return {
    token: data.token,
    user: normalizeUser(data.user),
    needsProfile: Boolean(data.needsProfile || !data.user?.name),
  };
}

export async function completeProfile(payload: {
  phone: string;
  name: string;
  gender: Gender;
  email?: string;
  companyName?: string;
  gstin?: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  stateCode: string;
  pincode: string;
}) {
  const data = await request<{ token: string; user: User }>("/auth/complete-profile", {
    method: "POST",
    body: payload,
  });
  return { token: data.token, user: normalizeUser(data.user) };
}

export async function fetchStates() {
  const data = await request<{ states: LocationState[] }>("/locations/states");
  return data.states || [];
}

export async function fetchCities(stateCode: string) {
  const data = await request<{ state: LocationState; cities: LocationCity[] }>(
    `/locations/cities?state=${encodeURIComponent(stateCode)}`
  );
  return data;
}

export async function fetchMe(token: string) {
  const data = await request<{ user: User }>("/auth/me", { token });
  return normalizeUser(data.user);
}

export async function updateProfile(
  token: string,
  payload: Partial<{
    name: string;
    gender: Gender;
    email: string;
    companyName: string;
    gstin: string;
    address: Partial<Address>;
  }>
) {
  const data = await request<{ user: User }>("/auth/me", {
    method: "PATCH",
    token,
    body: payload,
  });
  return normalizeUser(data.user);
}

export async function updateAvatar(token: string, file: File) {
  const form = new FormData();
  form.append("avatar", file);
  const res = await fetch(`${API_URL}/auth/me/avatar`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.errors || []);
  }
  return normalizeUser((data as { user: User }).user);
}

/* ── Cart ── */

export type ApiCartLine = {
  productId: string;
  variantId?: string;
  variantName?: string;
  slug?: string;
  name: string;
  sku: string;
  price: number;
  unit?: string;
  image?: string;
  packing?: string;
  status?: string;
  quantity: number;
  lineTotal: number;
};

export type ApiCart = {
  id: string;
  items: ApiCartLine[];
  itemCount: number;
  subtotal: number;
  freight: number;
  gst: number;
  total: number;
};

export async function fetchCart(token: string) {
  const data = await request<{ cart: ApiCart }>("/cart", { token });
  return data.cart;
}

export async function addCartItem(token: string, productId: string, quantity = 1, variantId = "") {
  const data = await request<{ cart: ApiCart }>("/cart/items", {
    method: "POST",
    token,
    body: { productId, quantity, variantId },
  });
  return data.cart;
}

export async function updateCartItem(token: string, productId: string, quantity: number, variantId = "") {
  const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : "";
  const data = await request<{ cart: ApiCart }>(`/cart/items/${encodeURIComponent(productId)}${qs}`, {
    method: "PATCH",
    token,
    body: { quantity, variantId },
  });
  return data.cart;
}

export async function removeCartItem(token: string, productId: string, variantId = "") {
  const qs = variantId ? `?variantId=${encodeURIComponent(variantId)}` : "";
  const data = await request<{ cart: ApiCart }>(`/cart/items/${encodeURIComponent(productId)}${qs}`, {
    method: "DELETE",
    token,
  });
  return data.cart;
}

export async function clearServerCart(token: string) {
  const data = await request<{ cart: ApiCart }>("/cart", { method: "DELETE", token });
  return data.cart;
}

/* ── Orders ── */

export async function createOrder(
  token: string,
  payload: {
    items?: { productId: string; quantity: number }[];
    paymentMethod: string;
    address: Address;
    email?: string;
    notes?: string;
    offerId?: string;
  }
) {
  return request<{
    order: Order | null;
    payment: {
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
      name?: string;
      description?: string;
      prefill?: Record<string, string>;
    } | null;
    demoPaid?: boolean;
  }>("/orders", { method: "POST", token, body: payload, retries: 2 });
}

export async function verifyPayment(
  token: string,
  payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }
) {
  return request<{ order: Order }>("/orders/verify-payment", {
    method: "POST",
    token,
    body: payload,
    retries: 2,
  });
}

export async function fetchMyOrders(token: string) {
  const data = await request<{ orders: Order[] }>("/orders/mine", { token });
  return data.orders || [];
}

export async function fetchOrder(token: string, id: string) {
  const data = await request<{ order: Order }>(`/orders/${encodeURIComponent(id)}`, { token });
  return data.order;
}

export type CreditAccountPayload = {
  account: {
    id: string;
    accountNumber: string;
    creditLimit: number;
    balance: number;
    available: number;
    utilization: number;
    creditDays: number;
    status: string;
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      balance: number;
      description: string;
      reference: string;
      createdAt?: string;
    }>;
  } | null;
  customer: { id: string; customerId: string } | null;
  available?: number;
};

export async function fetchMyCredit(token: string) {
  return request<CreditAccountPayload>("/credit/me", { token });
}

export async function verifyCredit(token: string, amount: number) {
  return request<CreditAccountPayload>("/credit/verify", { method: "POST", token, body: { amount } });
}

/* ── Notifications ── */

export async function fetchNotifications(token: string, page = 1, limit = 15) {
  return request<{
    notifications: NotificationItem[];
    unread: number;
    pagination: { page: number; limit: number; total: number; pages: number };
  }>(`/notifications?page=${page}&limit=${limit}`, { token });
}

export async function fetchUnreadCount(token: string) {
  const data = await request<{ unread: number }>("/notifications/unread-count", { token });
  return data.unread || 0;
}

export async function markNotificationRead(token: string, id: string) {
  return request<{ notification: NotificationItem }>(`/notifications/${id}/read`, {
    method: "PATCH",
    token,
  });
}

export async function markAllNotificationsRead(token: string) {
  return request<{ updated: number }>("/notifications/read-all", {
    method: "PATCH",
    token,
  });
}

export async function registerDeviceToken(
  token: string,
  fcmToken: string,
  platform: "web" | "android" | "ios" = "web"
) {
  return request<{ registered: boolean }>("/notifications/device-token", {
    method: "POST",
    token,
    body: { token: fcmToken, platform },
  });
}

/* ── Reviews ── */

const EMPTY_SUMMARY: ReviewSummary = {
  average: 0,
  count: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

export async function fetchProductReviews(slug: string, token?: string | null) {
  const data = await request<{ reviews: ProductReview[]; summary: ReviewSummary }>(
    `/products/${encodeURIComponent(slug)}/reviews`,
    { token: token || undefined }
  );
  return {
    reviews: data.reviews || [],
    summary: data.summary || EMPTY_SUMMARY,
  };
}

export async function fetchReviewEligibility(slug: string, token: string) {
  const data = await request<{ eligibility: ReviewEligibility }>(
    `/products/${encodeURIComponent(slug)}/reviews/eligibility`,
    { token }
  );
  return data.eligibility;
}

export async function submitProductReview(
  slug: string,
  token: string,
  payload: { rating: number; description: string; images: File[] }
) {
  const form = new FormData();
  form.append("rating", String(payload.rating));
  form.append("description", payload.description.trim());
  payload.images.forEach((file) => form.append("images", file));

  const res = await fetch(`${API_URL}/products/${encodeURIComponent(slug)}/reviews`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    throw new ApiError(data?.message || `Request failed (${res.status})`, res.status, data?.errors || []);
  }
  return (data as { review: ProductReview }).review;
}

export async function submitQuote(payload: {
  name: string;
  phone?: string;
  mobile?: string;
  email?: string;
  company?: string;
  productId?: string;
  productName?: string;
  quantity?: number;
  unit?: string;
  message?: string;
  inquiryType?: string;
  estimatedTotal?: number;
  source?: string;
}) {
  return request<{ quote: { id: string } }>("/quotes", {
    method: "POST",
    body: payload,
  });
}

export async function fetchSite(): Promise<SiteSettings | null> {
  try {
    const data = await request<{ site: SiteSettings }>("/site");
    return data.site || null;
  } catch {
    return null;
  }
}

export async function fetchBanners(placement?: "home" | "shop"): Promise<SiteBanner[]> {
  try {
    const qs = placement ? `?placement=${placement}` : "";
    const data = await request<{ banners: SiteBanner[] }>(`/site/banners${qs}`);
    return data.banners || [];
  } catch {
    return [];
  }
}
