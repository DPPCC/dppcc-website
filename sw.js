
"use strict";

/* ==========================================
   DPPCC SERVICE WORKER
   Cache version: v6
   ========================================== */

const DPPCC_CACHE_NAME = "dppcc-shell-v6";

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

/* INSTALL */

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(DPPCC_CACHE_NAME)
      .then(async cache => {
        await Promise.all(
          DPPCC_CORE_FILES.map(async file => {
            try {
              await cache.add(file);
            } catch (error) {
              console.warn(
                "DPPCC cache skipped:",
                file
              );
            }
          })
        );
      })
      .then(() => self.skipWaiting())
  );
});

/* ACTIVATE */

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

/* FETCH */

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const requestUrl = new URL(request.url);

  // Ignore external websites and services.
  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Navigation requests: network first.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const requestedPath = requestUrl.pathname;

        const appHomePath = new URL(
          "./app-home.html",
          self.location
        ).pathname;

        const fallbackPath =
          requestedPath === appHomePath
            ? "./app-home.html"
            : "./index.html";

        const cachedPage = await caches.match(
          fallbackPath
        );

        if (cachedPage) {
          return cachedPage;
        }

        return new Response(
          "DPPCC is offline. Please reconnect to the internet.",
          {
            status: 503,
            headers: {
              "Content-Type":
                "text/plain; charset=utf-8"
            }
          }
        );
      })
    );

    return;
  }

  // Cache only approved same-origin files.
  const appBase = new URL("./", self.location);

  if (!requestUrl.pathname.startsWith(appBase.pathname)) {
    return;
  }

  const relativePath =
    "./" +
    requestUrl.pathname.slice(appBase.pathname.length);

  if (!DPPCC_CORE_FILES.includes(relativePath)) {
    return;
  }

  // Static files: cache first, network fallback.
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request);
    })
  );
});
