
"use strict";

const DPPCC_CACHE_NAME = "dppcc-static-v2";

const DPPCC_APP_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./mobile-app.css",
  "./app.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./assets/dppcc-club-logo.jpg"
];

// Install: cache the public app shell and fixed assets.
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(DPPCC_CACHE_NAME)
      .then(cache => cache.addAll(DPPCC_APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activate: remove older DPPCC static caches.
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name =>
              name.startsWith("dppcc-static-") &&
              name !== DPPCC_CACHE_NAME
            )
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch: never cache Firebase, Cloudinary or private page data.
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);

  // Ignore external services.
  if (requestUrl.origin !== self.location.origin) return;

  // Navigation: network first, cached home page if offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cachedHome = await caches.match("./index.html");

        if (cachedHome) return cachedHome;

        return new Response(
          "DPPCC is offline. Please reconnect to the internet.",
          {
            status: 503,
            headers: {
              "Content-Type": "text/plain; charset=utf-8"
            }
          }
        );
      })
    );

    return;
  }

  // Cache only approved static files.
  const allowedFiles = [
    "./",
    "./index.html",
    "./styles.css",
    "./mobile-app.css",
    "./app.js",
    "./pwa.js",
    "./manifest.webmanifest",
    "./assets/dppcc-club-logo.jpg"
  ];

  const appBase = new URL("./", self.location);

  const relativePath = "./" +
    requestUrl.pathname.slice(appBase.pathname.length);

  if (!allowedFiles.includes(relativePath)) return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(request);
    })
  );
});
