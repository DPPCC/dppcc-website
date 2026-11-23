"use strict";

const DPPCC_CACHE_NAME = "dppcc-shell-v5";

const DPPCC_CORE_FILES = [
  "./",
  "./index.html",
  "./app-home.html",
  "./styles.css",
  "./website-home.css",
  "./app-home.css",
  "./mobile-app.css",
  "./app.js",
  "./pwa.js",
  "./manifest.webmanifest",
  "./assets/dppcc-club-logo.jpg",
  "./assets/dppcc-sponsor-2003.jpg",
  "./images/dppcc-team-photo.png"
];

// Install
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(DPPCC_CACHE_NAME)
      .then(async cache => {
        await Promise.all(
          DPPCC_CORE_FILES.map(async file => {
            try {
              await cache.add(file);
            } catch (error) {
              console.warn("DPPCC cache skipped:", file);
            }
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name =>
              name.startsWith("dppcc-") &&
              name !== DPPCC_CACHE_NAME
            )
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);

  // Ignore external services.
  if (requestUrl.origin !== self.location.origin) return;

  // Navigation: network first.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const requestedPath = new URL(
          request.url
        ).pathname;

        const appHomePath = new URL(
          "./app-home.html",
          self.location
        ).pathname;

        const fallbackPath =
          requestedPath === appHomePath
            ? "./app-home.html"
            : "./index.html";

        const cachedPage = await caches.match(fallbackPath);

        if (cachedPage) return cachedPage;

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

  // Only cache same-origin static assets.
  const appBase = new URL("./", self.location);

  const relativePath = "./" +
    requestUrl.pathname.slice(appBase.pathname.length);

  const allowedFiles = [
    "./",
    "./index.html",
    "./app-home.html",
    "./styles.css",
    "./website-home.css",
    "./app-home.css",
    "./mobile-app.css",
    "./app.js",
    "./pwa.js",
    "./manifest.webmanifest",
    "./assets/dppcc-club-logo.jpg",
    "./assets/dppcc-sponsor-2003.jpg",
    "./images/dppcc-team-photo.png"
  ];

  if (!allowedFiles.includes(relativePath)) return;

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;
      return fetch(request);
    })
  );
});
