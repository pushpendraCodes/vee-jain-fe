export type StockStatus = "in-stock" | "low-stock" | "preorder";
export type DyeColor =
  | "red"
  | "blue"
  | "yellow"
  | "green"
  | "orange"
  | "violet"
  | "black"
  | "brown"
  | "white";
export type Gender = "male" | "female" | "other" | "";
export type PaymentMethod = "razorpay" | "upi" | "netbanking" | "rtgs" | "credit";
export type OrderStatus =
  | "pending"
  | "created"
  | "paid"
  | "failed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type VideoTier = "Beginner" | "Advanced" | "Guide" | "Tutorial";

export interface VolumeTier {
  minQty: number;
  discountPercent?: number;
  price?: number;
  label?: string;
}

export interface ProductVariant {
  id: string;
  size?: string;
  shade?: string;
  /** Display label (size + shade). */
  name: string;
  sku?: string;
  price: number;
  stock: number;
  images?: Array<{ url: string; publicId?: string } | string>;
}

export interface Product {
  id: string;
  _id?: string;
  slug: string;
  name: string;
  sku: string;
  cas?: string;
  category: string;
  division: string;
  color: DyeColor;
  colorHex: string;
  purity?: number;
  price: number;
  unit: string;
  stockKg: number;
  stockAlertLimit?: number;
  status: StockStatus;
  grade: string;
  description: string;
  image: string;
  images?: string[];
  packing?: string;
  featured?: boolean;
  variants?: ProductVariant[];
  volumeTiers?: VolumeTier[];
  applications?: string;
  storage?: string;
  safety?: string;
  certificateTitle?: string;
  certificateNote?: string;
  certificateUrl?: string;
  offer?: {
    id: string;
    title: string;
    discountPercent: number;
    label: string;
  } | null;
}

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface Address {
  id?: string;
  label?: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  stateCode?: string;
  pincode: string;
  gstin?: string;
  isDefault?: boolean;
}

export interface Company {
  name: string;
  gstin: string;
  pan?: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  gender: Gender;
  email?: string;
  avatar?: string;
  company?: Company;
  address?: Address;
}

export interface LocationState {
  id: string;
  name: string;
  code: string;
  gstCode: string;
}

export interface LocationCity {
  id: string;
  name: string;
  stateCode: string;
}

export interface EducationVideo {
  id: string;
  slug: string;
  title: string;
  description: string;
  duration: string;
  durationSeconds: number;
  views: number;
  tier: VideoTier;
  category: string;
  thumbnail: string;
  videoUrl?: string;
  youtubeId?: string;
  mesh?: string;
  inkType?: string;
}

export type Video = EducationVideo;

export interface OrderItem {
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  subtotal: number;
  freight: number;
  gst: number;
  total: number;
  discount?: number;
  offerTitle?: string;
  offerPercent?: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus?: string;
  address: Address;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: string;
  data?: Record<string, unknown>;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface ProductReviewUser {
  id: string;
  name: string;
  avatar: string;
}

export interface ProductReview {
  id: string;
  rating: number;
  description: string;
  images: string[];
  verifiedPurchase: boolean;
  createdAt: string;
  mine: boolean;
  user: ProductReviewUser;
}

export interface ReviewSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface ReviewEligibility {
  canReview: boolean;
  alreadyReviewed: boolean;
  reason: "login" | "not_purchased" | "not_delivered" | "already_reviewed" | null;
}

export interface CatalogOffer {
  id: string;
  title: string;
  description?: string;
  discountPercent: number;
  label: string;
  appliesTo: "all" | "products";
  products: Array<{ id: string; name?: string; sku?: string; slug?: string; code?: string }>;
  productIds?: string[];
  startsAt: string;
  endsAt: string;
}

export interface SiteSettings {
  siteName: string;
  tagline: string;
  logo: string;
  phone: string;
  email: string;
  whatsapp: string;
  address: string;
  gstin: string;
  privacyPolicy: string;
  termsConditions: string;
  marqueeEnabled: boolean;
  marqueeText: string;
}

export interface SiteBanner {
  id: string;
  title?: string;
  subtitle?: string;
  image: string;
  videoUrl?: string;
  mediaType?: "image" | "video";
  link?: string;
  placement: "home" | "shop";
}
