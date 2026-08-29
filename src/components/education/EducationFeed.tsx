"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eye, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { fetchVideos, recordVideoView } from "@/lib/api";
import { formatViews } from "@/lib/format";
import { liteVideoUrl, unloadVideo, videoPoster } from "@/lib/media";
import type { EducationVideo } from "@/types";

function ReelCard({
  video,
  active,
  warm,
  onViewed,
}: {
  video: EducationVideo;
  active: boolean;
  warm: boolean;
  onViewed: (slug: string) => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const poster = videoPoster(video.videoUrl, video.thumbnail);
  const src = liteVideoUrl(video.videoUrl);
  const attached = Boolean(src && (active || warm));

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.muted = muted;
    if (active && !paused) {
      void el.play().catch(() => setPaused(true));
      return;
    }
    el.pause();
    if (!active && !warm) unloadVideo(el);
  }, [active, warm, muted, paused]);

  useEffect(() => {
    if (!active) return;
    onViewed(video.slug);
  }, [active, onViewed, video.slug]);

  function togglePlay() {
    const el = ref.current;
    if (!el || !active) return;
    if (el.paused) {
      setPaused(false);
      void el.play().catch(() => null);
    } else {
      el.pause();
      setPaused(true);
    }
  }

  return (
    <section
      id={`reel-${video.slug}`}
      className="relative h-full w-full shrink-0 snap-start overflow-hidden bg-black"
    >
      {poster && !attached ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={poster} alt="" className="absolute inset-0 h-full w-full object-contain" />
      ) : null}

      {attached ? (
        <video
          ref={ref}
          src={src}
          poster={poster}
          playsInline
          loop
          muted={muted}
          preload={active ? "auto" : "metadata"}
          disablePictureInPicture
          className="absolute inset-0 h-full w-full bg-black object-contain"
          onPlay={() => setPaused(false)}
          onPause={() => {
            if (!active) return;
            setPaused(true);
          }}
        />
      ) : null}

      <button type="button" className="absolute inset-0 z-10" aria-label={paused ? "Play" : "Pause"} onClick={togglePlay} />

      {paused || !active ? (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/90 text-white shadow-xl">
            <Play className="ml-0.5 h-7 w-7 fill-current" />
          </span>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-black/80 via-black/40 to-transparent p-5 pb-6 pt-24">
        <h2 className="text-lg font-semibold leading-snug text-white">{video.title}</h2>
        {video.description ? (
          <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-white/75">{video.description}</p>
        ) : null}
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-white/70">
          <Eye className="h-3.5 w-3.5" />
          {formatViews(video.views)} views
        </p>
      </div>

      <div className="absolute right-3 bottom-24 z-30 flex flex-col gap-2">
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
          aria-label={muted ? "Unmute" : "Mute"}
          onClick={() => setMuted((v) => !v)}
        >
          {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>
        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md"
          aria-label={paused ? "Play" : "Pause"}
          onClick={togglePlay}
        >
          {paused ? <Play className="ml-0.5 h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
        </button>
      </div>
    </section>
  );
}

export default function EducationFeed() {
  const [videos, setVideos] = useState<EducationVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [active, setActive] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const seen = useRef(new Set<string>());

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchVideos();
        if (cancelled) return;
        setVideos(list);
        setActive(list[0]?.slug || "");
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

  useEffect(() => {
    if (!videos.length) return;
    const hash = decodeURIComponent(window.location.hash.replace("#", ""));
    if (!hash) return;
    const node = document.getElementById(`reel-${hash}`);
    node?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
    setActive(hash);
  }, [videos]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;
    const sections = Array.from(root.querySelectorAll("section[id^='reel-']"));
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        const id = visible?.target.id?.replace("reel-", "");
        if (id) setActive(id);
      },
      { root, threshold: 0.65 }
    );
    sections.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [videos]);

  const onViewed = useCallback((slug: string) => {
    if (seen.current.has(slug)) return;
    seen.current.add(slug);
    void recordVideoView(slug)
      .then((views) => {
        setVideos((prev) => prev.map((item) => (item.slug === slug ? { ...item, views } : item)));
      })
      .catch(() => null);
  }, []);

  const activeIndex = videos.findIndex((item) => item.slug === active);

  if (loading) {
    return <div className="flex h-full min-h-0 items-center justify-center bg-black text-sm text-white/60">Loading reels…</div>;
  }
  if (error) {
    return <div className="p-12 text-center font-semibold text-error">{error}</div>;
  }
  if (!videos.length) {
    return <div className="p-12 text-center text-text-secondary">No videos published yet.</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-black md:bg-[#14110f]">
      <div
        ref={scrollerRef}
        className="mx-auto h-full min-h-0 w-full max-w-[420px] flex-1 snap-y snap-mandatory overflow-y-scroll overscroll-y-contain md:max-w-[390px]"
      >
        {videos.map((video, index) => (
          <div key={video.slug} className="h-full snap-start">
            <ReelCard
              video={video}
              active={video.slug === active}
              warm={index === activeIndex + 1}
              onViewed={onViewed}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
