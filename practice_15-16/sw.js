const APP_SHELL_CACHE = "focus-notes-shell-v1";
const DYNAMIC_CACHE = "focus-notes-dynamic-v1";
const APP_SHELL_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./content/home.html",
  "./content/about.html",
  "./icons/icon-32.png",
  "./icons/icon-96.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => ![APP_SHELL_CACHE, DYNAMIC_CACHE].includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);

  if (
    event.request.method !== "GET" ||
    !["http:", "https:"].includes(requestUrl.protocol) ||
    requestUrl.origin !== self.location.origin
  ) {
    return;
  }

  if (requestUrl.pathname.includes("/content/")) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || caches.match("./content/home.html");
        })
    );

    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }

          return new Response("Offline resource unavailable", {
            status: 503,
            statusText: "Offline",
          });
        });
    })
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {
    title: "Новая заметка",
    body: "В приложении появилась новая заметка.",
  };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "./icons/icon-192.png",
      badge: "./icons/icon-96.png",
      data: { url: "./" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow("./"));
});
