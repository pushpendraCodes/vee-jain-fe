"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { BRAND } from "@/lib/constants";
import { fetchBanners, fetchSite } from "@/lib/api";
import type { SiteBanner, SiteSettings } from "@/types";

const FALLBACK: SiteSettings = {
  siteName: BRAND,
  tagline: "Since 1985 · Industrial Grade",
  logo: "",
  phone: "79 2583 1200",
  email: "sales@veejaindyes.com",
  whatsapp: "",
  address: "GIDC Industrial Estate, Phase 2, Vatva, Ahmedabad 382445",
  gstin: "",
  privacyPolicy: "",
  termsConditions: "",
  marqueeEnabled: false,
  marqueeText: "",
};

type SiteContextValue = {
  site: SiteSettings;
  banners: SiteBanner[];
  bannersReady: boolean;
};

const SiteContext = createContext<SiteContextValue>({ site: FALLBACK, banners: [], bannersReady: false });

export function useSite() {
  return useContext(SiteContext);
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const [site, setSite] = useState<SiteSettings>(FALLBACK);
  const [banners, setBanners] = useState<SiteBanner[]>([]);
  const [bannersReady, setBannersReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [nextSite, nextBanners] = await Promise.all([fetchSite(), fetchBanners()]);
      if (cancelled) return;
      if (nextSite) setSite({ ...FALLBACK, ...nextSite });
      setBanners(nextBanners);
      setBannersReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return <SiteContext.Provider value={{ site, banners, bannersReady }}>{children}</SiteContext.Provider>;
}
