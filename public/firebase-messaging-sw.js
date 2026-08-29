/* eslint-disable no-undef */
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBcSplijQV_g1i7ap6sXfn0OHR1-WyCgeQ",
  authDomain: "jobportal-3800e.firebaseapp.com",
  projectId: "jobportal-3800e",
  messagingSenderId: "993457679480",
  appId: "1:993457679480:web:03590a9c9a2b7111f5518d",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "Vee Jain Dyes";
  const body = payload.notification?.body || payload.data?.body || "";
  const orderId = payload.data?.orderId || "";
  const url = orderId ? `/orders/${orderId}` : payload.data?.url || "/";
  return self.registration.showNotification(title, {
    body,
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    data: { url },
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) return client.navigate(url);
          return undefined;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
      return undefined;
    })
  );
});
