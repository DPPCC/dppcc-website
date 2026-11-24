
const CACHE_NAME = "dppcc-app-v1";

const APP_FILES = [
  "./",
  "./index.html",
  "./app.css",
  "./app.js",
  "./manifest.webmanifest",
  "../assets/dppcc-club-logo.jpg",
  "../assets/dppcc-sponsor-2003.jpg",
  "../images/dppcc-team-photo.png"
];

// Install: save the app shell
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove old app caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("dppcc-app-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch: app pages and static files
self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Do not intercept external services or Firebase requests
  if (url.origin !== self.location.origin) return;

  // Navigation: network first, then cached app home
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put("./index.html", copy)
            );
          }
          return response;
        })
        .catch(async () => {
          return (await caches.match(request)) ||
            (await caches.match("./index.html"));
        })
    );
    return;
  }

  // Static app files: cache first
  const isStaticFile = /\.(?:html|css|js|webmanifest|png|jpe?g|webp|svg)$/i
    .test(url.pathname);

  if (!isStaticFile) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) =>
            cache.put(request, copy)
          );
        }
        return response;
      });
    })
  );
});
