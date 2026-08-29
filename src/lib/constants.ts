export const BRAND = "Vee Jain Dyes & Chemicals";
export const BRAND_SHORT = "Vee Jain Dyes";
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const CATEGORIES = [
  "All Products",
  "Reactive Dyes",
  "Acid Dyes",
  "Direct Dyes",
  "Solvent Dyes",
  "Pigments",
  "Auxiliaries",
] as const;

export const DIVISIONS = [
  {
    slug: "inks",
    title: "Premium Inks",
    short: "Inks",
    code: "01",
    description: "High-performance screen printing inks for all substrates.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD3Osr2OKbgE991eOaL3o4cLX6tsXUifjGGsolSNZ_K5Ei4E5m5tFj11HljYHB8KaSsPQRvxVk4Yzm2zohy-bV06WeZ8MT-0Ldky461dhPRu72FDt5hqrG2Hb_wUW3ENWKay3_aJLprBBKZhyIRE1xLHXsERYyP3P3wwnBNAPGegrF_F788HDzHpKq9fiG7Gm-sjnTR910jy7NPuoAPiyaiEM1xDq2XBWmLN4uRzDQbnk9IwuNhFG5HTg",
  },
  {
    slug: "chemicals",
    title: "Chemical Solutions",
    short: "Chemicals",
    code: "02",
    description: "Industrial grade solvents and modifiers.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnJWL_d2bdQ9OH-5Ph9lX6L69LpqNBQDHhJKepzaXbv2yqDTUqcK4D0vojvG-y_PEKkgJVVCvrLnRrhgR-6amwYc4pTAbYmMcvjHFHDDwSoI1j8lBunyNx01fp2Ife3WL3qT8Yy8R19b71ivwyhw9_UvzXk-oTokvPk1uogfMFEmsJlqviQyT8lxoFNsTngB44WldP1tBGg3o3iZy5LEwHXokanWdp6KNRjpVWqFPayT3h4vlztaT3mA",
  },
  {
    slug: "frames",
    title: "Frames & Mesh",
    short: "Frames",
    code: "03",
    description: "Durable aluminum frames.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC_gu2IscJxQmPXjkV_DLQcIIL7dMNf087xmaNYgXJYr4dClPFv-DIktqfvoWXdUjOxQjfxwhylZhZ-AQcaxhkykb2WMzagdu1q8F7abk8KrITxCvIAri6rAcJL7NQEgTm3Xpz8JHuOfbrreMn8zSvfh1tbDiXh2nNEN3js3_vX34Nf8IjaID6U2a_yPjHkX2ssf74dzYD5ubIRXq-kycqomhZmeyAwdMiY_lOwud2aMFp5oqlCIzEKqQ",
  },
  {
    slug: "squeegees",
    title: "Squeegees & Tools",
    short: "Squeegees",
    code: "04",
    description: "Precision tools for consistent print quality.",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAl8zKkN7qinmfTCvnaqkvSzAxbO3CMLYkozJ5q7ZCVFkp1O70gtMo5Cu6VKITlTHgFM7yShlRqVeWOakC35tPqpL16traZA69FR0mSPIcVJvh0Vqq5K3_oz7-4EZjU95xz7zP3UwI2id9K0ZhiOjPprrXhxYQP5sXTOtpu5h9snosfAWx0aryp-u18E4x15ABNgJLfUl2siNWTezATiwrH_GKg-2kfRGtEyT6yVkBKgZOUDj3oJhagvw",
  },
] as const;

export const COLOR_FILTERS: { id: string; hex: string; label: string }[] = [
  { id: "red", hex: "#dc2626", label: "Red" },
  { id: "blue", hex: "#2563eb", label: "Blue" },
  { id: "yellow", hex: "#facc15", label: "Yellow" },
  { id: "green", hex: "#16a34a", label: "Green" },
  { id: "orange", hex: "#f97316", label: "Orange" },
  { id: "violet", hex: "#9333ea", label: "Violet" },
  { id: "black", hex: "#111827", label: "Black" },
  { id: "brown", hex: "#92400e", label: "Brown" },
];

export const FREIGHT_FLAT = 1200;
export const GST_RATE = 0.18;
