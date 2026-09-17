import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
import AppShell from "@/components/layout/AppShell";
import PwaRegister from "@/components/PwaRegister";
import { BRAND } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: `${BRAND} — Precision Dyes & Chemicals`,
    template: `%s | ${BRAND}`,
  },
  description:
    "High-purity reactive dyes engineered for consistency, performance and exceptional color precision. Shop, learn, and order with OTP login and Razorpay checkout.",
  applicationName: "Vee Jain Dyes",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/brand-logo.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand-logo.svg" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vee Jain Dyes",
  },
};

export const viewport: Viewport = {
  themeColor: "#faf8f5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/svg+xml" href="/brand-logo.svg" />
        <link rel="apple-touch-icon" href="/brand-logo.svg" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          <PwaRegister />
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
