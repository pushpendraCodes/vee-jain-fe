import { fetchProducts, fetchVideos } from "@/lib/api";
import HomePageClient from "@/components/home/HomePageClient";

export default async function HomePage() {
  let products: Awaited<ReturnType<typeof fetchProducts>> = [];
  let videos: Awaited<ReturnType<typeof fetchVideos>> = [];
  try {
    [products, videos] = await Promise.all([fetchProducts(), fetchVideos()]);
  } catch {
    products = [];
    videos = [];
  }

  return <HomePageClient products={products} videos={videos} />;
}
