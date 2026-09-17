/** Pixel frames for storefront banners. Keep in sync with admin `src/lib/bannerSpecs.ts`. */
export const BANNER_SPECS = {
  home: { width: 1920, height: 900 },
  shop: { width: 1920, height: 480 },
} as const;

export const BANNER_SHELL = {
  home: "relative w-full overflow-hidden bg-bg",
  shop: "relative w-full overflow-hidden bg-bg",
} as const;

export const BANNER_FRAME = {
  home: "relative w-full overflow-hidden bg-bg",
  shop: "relative w-full overflow-hidden bg-bg",
} as const;

export const BANNER_SKELETON = {
  home: "relative w-full overflow-hidden aspect-[1920/900] bg-bg",
  shop: "relative w-full overflow-hidden aspect-[1920/480] bg-bg",
} as const;
