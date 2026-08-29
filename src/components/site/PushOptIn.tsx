"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useAppSelector } from "@/store/hooks";
import { registerWebPush } from "@/lib/firebase";

export default function PushOptIn() {
  const token = useAppSelector((s) => s.auth.token);
  const hydrated = useAppSelector((s) => s.auth.hydrated);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!hydrated || !token || token.startsWith("demo-")) {
      setVisible(false);
      return;
    }
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;
    if (sessionStorage.getItem("vj-push-dismiss") === "1") return;
    setVisible(true);
  }, [hydrated, token]);

  if (!visible || !token) return null;

  return (
    <div className="border-b border-border-hairline bg-sage-light/70 px-4 py-2.5">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-sm text-text-primary">
          <Bell className="h-4 w-4 shrink-0 text-forest" />
          <span>Turn on push alerts for order updates.</span>
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            disabled={busy}
            className="rounded-full bg-forest px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            onClick={async () => {
              setBusy(true);
              const ok = await registerWebPush(token, { prompt: true });
              setBusy(false);
              setVisible(false);
              if (!ok) sessionStorage.setItem("vj-push-dismiss", "1");
            }}
          >
            {busy ? "Enabling…" : "Enable"}
          </button>
          <button
            type="button"
            className="text-xs font-medium text-text-secondary"
            onClick={() => {
              sessionStorage.setItem("vj-push-dismiss", "1");
              setVisible(false);
            }}
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
