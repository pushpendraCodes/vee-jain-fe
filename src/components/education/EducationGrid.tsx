"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, Play } from "lucide-react";
import { fetchVideos } from "@/lib/api";
import { formatViews } from "@/lib/format";
import { youtubeIdFromUrl, youtubeThumb } from "@/lib/youtube";
import type { EducationVideo } from "@/types";

function VideoCard({ video }: { video: EducationVideo }) {
  const youtubeId = video.youtubeId || youtubeIdFromUrl(video.videoUrl);
  const poster = youtubeThumb(youtubeId, video.thumbnail);

  return (
    <Link
      href={`/education/${video.slug}`}
      className="group block overflow-hidden rounded-xl bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        {poster ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={poster} alt="" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" />
        ) : (
          <div className="h-full w-full bg-black" />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/15 opacity-90 transition group-hover:bg-black/25">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-600 text-white shadow-lg">
            <Play className="ml-0.5 h-5 w-5 fill-current" />
          </span>
        </span>
      </div>
      <div className="space-y-1 p-3 sm:p-3.5">
        <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary">{video.title}</h2>
        {video.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-text-secondary">{video.description}</p>
        ) : null}
        <p className="inline-flex items-center gap-1 pt-0.5 text-[11px] text-text-secondary">
          <Eye className="h-3 w-3" />
          {formatViews(video.views)} views
        </p>
      </div>
    </Link>
  );
}

export default function EducationGrid() {
  const [videos, setVideos] = useState<EducationVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchVideos();
        if (!cancelled) setVideos(list);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load videos");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="px-5 py-16 text-center text-sm text-text-secondary">Loading videos…</div>;
  }
  if (error) {
    return <div className="px-5 py-16 text-center font-semibold text-error">{error}</div>;
  }
  if (!videos.length) {
    return <div className="px-5 py-16 text-center text-text-secondary">No videos published yet.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {videos.map((video) => (
        <VideoCard key={video.slug} video={video} />
      ))}
    </div>
  );
}
