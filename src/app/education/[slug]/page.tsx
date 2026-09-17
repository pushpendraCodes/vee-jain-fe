"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { fetchVideo, fetchVideos, recordVideoView } from "@/lib/api";
import { formatViews } from "@/lib/format";
import { youtubeEmbedSrc, youtubeIdFromUrl, youtubeThumb } from "@/lib/youtube";
import type { EducationVideo } from "@/types";

export default function EducationVideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [video, setVideo] = useState<EducationVideo | null | undefined>(undefined);
  const [related, setRelated] = useState<EducationVideo[]>([]);
  const [views, setViews] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [item, list] = await Promise.all([fetchVideo(slug), fetchVideos()]);
        if (cancelled) return;
        setVideo(item);
        setViews(item?.views || 0);
        setRelated(list.filter((v) => v.slug !== slug).slice(0, 8));
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

  const youtubeId = video.youtubeId || youtubeIdFromUrl(video.videoUrl);

  return (
    <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
      <Link href="/education" className="text-sm font-medium text-ink-mute hover:text-ink">
        All videos
      </Link>
      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          <div className="overflow-hidden rounded-2xl bg-black">
            {youtubeId ? (
              <iframe
                title={video.title}
                src={youtubeEmbedSrc(youtubeId)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="aspect-video w-full"
              />
            ) : (
              <div className="flex aspect-video items-center justify-center text-sm text-ink-mute">Video unavailable</div>
            )}
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-text-primary">{video.title}</h1>
          {video.description ? <p className="mt-2 text-sm leading-relaxed text-text-secondary">{video.description}</p> : null}
          <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-text-secondary">
            <Eye className="h-4 w-4 text-ink-mute" />
            {formatViews(views)} views
          </p>
        </div>
        {related.length ? (
          <aside>
            <p className="mb-3 text-sm font-semibold text-text-primary">More videos</p>
            <div className="space-y-3">
              {related.map((item) => {
                const id = item.youtubeId || youtubeIdFromUrl(item.videoUrl);
                const poster = youtubeThumb(id, item.thumbnail);
                return (
                  <Link key={item.slug} href={`/education/${item.slug}`} className="flex gap-3 rounded-xl p-1 transition hover:bg-bg">
                    <div className="relative w-40 shrink-0 overflow-hidden rounded-lg bg-black">
                      {poster ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={poster} alt="" className="aspect-video w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 py-0.5">
                      <p className="line-clamp-2 text-sm font-semibold text-text-primary">{item.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
