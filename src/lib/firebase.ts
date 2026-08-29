import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getMessaging, getToken, isSupported, onMessage, type Messaging } from "firebase/messaging";
import { registerDeviceToken } from "@/lib/api";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

let swRegistration: Promise<ServiceWorkerRegistration> | null = null;
let foregroundBound = false;

function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) return null;
  return getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
}

export function getPushRegistration() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.reject(new Error("Service workers are not supported"));
  }
  if (!swRegistration) {
    swRegistration = navigator.serviceWorker.register("/sw.js");
  }
  return swRegistration;
}

function bindForegroundMessages(messaging: Messaging) {
  if (foregroundBound) return;
  foregroundBound = true;
  onMessage(messaging, (payload) => {
    const title = payload.notification?.title || payload.data?.title || "Vee Jain Dyes";
    const body = payload.notification?.body || payload.data?.body || "";
    if (Notification.permission !== "granted") return;
    try {
      new Notification(title, { body, icon: "/icons/icon.svg" });
    } catch {
      /* Safari / older browsers */
    }
  });
}

export async function registerWebPush(authToken: string, { prompt = false } = {}) {
  if (typeof window === "undefined" || !authToken || authToken.startsWith("demo-")) return false;
  const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY?.trim();
  if (!vapidKey) {
    console.warn("Push skipped: NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing");
    return false;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) return false;
  if (!("Notification" in window)) return false;

  if (Notification.permission === "denied") return false;
  if (Notification.permission !== "granted") {
    if (!prompt) return false;
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return false;
  }

  const app = getFirebaseApp();
  if (!app) {
    console.warn("Push skipped: Firebase web config is incomplete");
    return false;
  }

  let messaging: Messaging;
  try {
    messaging = getMessaging(app);
  } catch (err) {
    console.warn("Push messaging init failed:", err);
    return false;
  }

  bindForegroundMessages(messaging);

  try {
    const registration = await getPushRegistration();
    await navigator.serviceWorker.ready;
    const fcmToken = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });
    if (!fcmToken) return false;
    await registerDeviceToken(authToken, fcmToken, "web");
    return true;
  } catch (err) {
    console.warn("FCM token registration failed:", err);
    return false;
  }
}
