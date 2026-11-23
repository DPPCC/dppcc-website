
"use strict";

(() => {
  // Prevent duplicate initialization.
  if (window.DPPCC_PWA_INITIALIZED) return;
  window.DPPCC_PWA_INITIALIZED = true;

  const APP_NAME = "Dungsree Paschim Para Cricket Club";
  const THEME_COLOR = "#063b2b";

  // Add PWA manifest without changing existing HTML pages.
  const manifest = document.createElement("link");
  manifest.rel = "manifest";
  manifest.href = "./manifest.webmanifest";
  document.head.appendChild(manifest);

  // Set the existing club theme color.
  let theme = document.querySelector('meta[name="theme-color"]');

  if (!theme) {
    theme = document.createElement("meta");
    theme.name = "theme-color";
    document.head.appendChild(theme);
  }

  theme.content = THEME_COLOR;

  // Use the existing official club logo.
  if (!document.querySelector('link[rel="icon"]')) {
    const icon = document.createElement("link");
    icon.rel = "icon";
    icon.href = "./assets/dppcc-club-logo.jpg";
    icon.type = "image/jpeg";
    document.head.appendChild(icon);
  }

  // Register the service worker.
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js", {
        scope: "./"
      }).then(registration => {
        console.info(
          "DPPCC app service worker registered:",
          registration.scope
        );
      }).catch(error => {
        console.error(
          "DPPCC service worker registration failed:",
          error
        );
      });
    });
  }

  // Install application button.
  let installPrompt = null;

  const installButton = document.createElement("button");

  installButton.type = "button";
  installButton.textContent = "Install DPPCC App";
  installButton.setAttribute(
    "aria-label",
    "Install DPPCC application"
  );

  installButton.style.cssText = `
    position:fixed;
    right:16px;
    bottom:18px;
    z-index:99999;
    display:none;
    padding:13px 19px;
    border:2px solid #f4c542;
    border-radius:30px;
    background:#063b2b;
    color:#ffffff;
    font-size:14px;
    font-weight:800;
    cursor:pointer;
    box-shadow:0 4px 16px rgba(0,0,0,.25);
  `;

  document.addEventListener("DOMContentLoaded", () => {
    document.body.appendChild(installButton);
  });

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();

    installPrompt = event;
    installButton.style.display = "block";
  });

  installButton.addEventListener("click", async () => {
    if (!installPrompt) {
      alert(
        "To install DPPCC, open this website in Chrome and select Install app or Add to Home screen from the browser menu."
      );
      return;
    }

    installPrompt.prompt();

    try {
      await installPrompt.userChoice;
    } catch (error) {
      console.error("DPPCC install prompt error:", error);
    }

    installPrompt = null;
    installButton.style.display = "none";
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.style.display = "none";

    console.info(APP_NAME + " installed successfully.");
  });

})();
