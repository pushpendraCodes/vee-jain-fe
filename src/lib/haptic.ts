/** Short haptic buzz when supported (phones). No-ops on desktop. */
export function hapticTap(pattern: number | number[] = [12, 35, 18]) {
  if (typeof navigator === "undefined") return;
  if (typeof navigator.vibrate !== "function") return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore unsupported / blocked */
  }
}
