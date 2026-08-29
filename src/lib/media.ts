function isCloudinary(url: string) {
  return url.includes("res.cloudinary.com") && url.includes("/upload/");
}

/** Lightweight still frame — never download the full video. */
export function videoPoster(url?: string, fallback?: string) {
  if (fallback) return fallback;
  if (!url) return "";
  if (!isCloudinary(url)) return "";
  return url.replace("/upload/", "/upload/so_0,w_540,c_limit,q_auto,f_jpg/");
}

/** Smaller playback stream so phones don't decode a huge file. */
export function liteVideoUrl(url?: string) {
  if (!url) return "";
  if (!isCloudinary(url)) return url;
  return url.replace("/upload/", "/upload/q_auto:eco,vc_auto,w_720,c_limit/");
}

export function unloadVideo(el: HTMLVideoElement | null) {
  if (!el) return;
  el.pause();
  el.removeAttribute("src");
  el.querySelectorAll("source").forEach((node) => node.remove());
  el.load();
}
