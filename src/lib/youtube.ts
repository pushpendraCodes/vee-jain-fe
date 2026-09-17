export function youtubeIdFromUrl(input?: string) {
  const raw = String(input || "").trim();
  if (!raw) return "";
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) return raw;
  try {
    const url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    const host = url.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] || "";
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
    }
    if (host.endsWith("youtube.com") || host.endsWith("youtube-nocookie.com")) {
      const fromQuery = url.searchParams.get("v") || "";
      if (/^[a-zA-Z0-9_-]{11}$/.test(fromQuery)) return fromQuery;
      const parts = url.pathname.split("/").filter(Boolean);
      const marker = parts.findIndex((p) => ["embed", "shorts", "live", "v"].includes(p));
      const id = marker >= 0 ? parts[marker + 1] || "" : "";
      return /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : "";
    }
  } catch {
    return "";
  }
  return "";
}

export function youtubeThumb(id?: string, fallback = "") {
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : fallback;
}

export function youtubeEmbedSrc(id: string) {
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
}
