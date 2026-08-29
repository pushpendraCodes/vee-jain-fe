"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { fetchVideo, recordVideoView } from "@/lib/api";
import { formatViews } from "@/lib/format";
import { liteVideoUrl, videoPoster } from "@/lib/media";
import type { EducationVideo } from "@/types";

export default function EducationVideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [video, setVideo] = useState<EducationVideo | null | undefined>(undefined);
  const [views, setViews] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const item = await fetchVideo(slug);
        if (cancelled) return;
        setVideo(item);
        setViews(item?.views || 0);
        if (item) {
          const next = await recordVideoView(item.slug).catch(() => item.views);
          if (!cancelled) setViews(next);
        }
      } catch {
        if (!cancelled) setVideo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (video === undefined) return <div className="p-12 text-center text-text-secondary">Loading…</div>;
  if (!video) notFound();

  return (
    <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
      <Link href="/education" className="text-sm font-medium text-accent hover:underline">
        All reels
      </Link>
      <div className="mt-4 overflow-hidden rounded-2xl bg-black">
        {video.videoUrl ? (
          <video
            key={video.videoUrl}
            controls
            playsInline
            preload="metadata"
            poster={videoPoster(video.videoUrl, video.thumbnail)}
            className="aspect-9/16 max-h-[70vh] w-full object-contain"
            src={liteVideoUrl(video.videoUrl)}
          />
        ) : (
          <div className="flex aspect-9/16 items-center justify-center text-sm text-white/70">Video unavailable</div>
        )}
      </div>
      <h1 className="mt-5 font-display text-2xl font-bold text-text-primary">{video.title}</h1>
      {video.description ? <p className="mt-2 text-sm leading-relaxed text-text-secondary">{video.description}</p> : null}
      <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-text-secondary">
        <Eye className="h-4 w-4 text-accent" />
        {formatViews(views)} views
      </p>
    </div>
  );
}
