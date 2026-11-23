
"use strict";

(() => {
  if (window.DPPCC_PWA_INITIALIZED) return;
  window.DPPCC_PWA_INITIALIZED = true;

  const THEME_COLOR = "#063b2b";
  const LOGO_PATH = "./assets/dppcc-club-logo.jpg";

  // Add manifest.
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "./manifest.webmanifest";
    document.head.appendChild(manifest);
  }

  // Set theme color.
  let theme = document.querySelector(
    'meta[name="theme-color"]'
  );

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
    icon.href = LOGO_PATH;
    icon.type = "image/jpeg";
    document.head.appendChild(icon);
  }

  // Register service worker.
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("./sw.js", {
      scope: "./"
    }).then(registration => {
      console.info(
        "DPPCC Service Worker registered:",
        registration.scope
      );
    }).catch(error => {
      console.error(
        "DPPCC Service Worker registration failed:",
        error
      );
    });
  }

  if (document.readyState === "complete") {
    registerServiceWorker();
  } else {
    window.addEventListener(
      "load",
      registerServiceWorker,
      { once: true }
    );
  }

  // Create installation button.
  let installPrompt = null;

  const installButton = document.createElement("button");

  installButton.type = "button";
  installButton.textContent = "Install DPPCC App";
  installButton.setAttribute(
    "aria-label",
    "Install DPPCC application"
  );

  installButton.style.cssText = `
    position: fixed;
    right: 16px;
    bottom: 18px;
    z-index: 99999;
    display: none;
    padding: 13px 19px;
    border: 2px solid #f4c542;
    border-radius: 30px;
    background: #063b2b;
    color: #ffffff;
    font-size: 14px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0,0,0,.25);
  `;

  function addInstallButton() {
    if (
      document.body &&
      !document.body.contains(installButton)
    ) {
      document.body.appendChild(installButton);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      addInstallButton,
      { once: true }
    );
  } else {
    addInstallButton();
  }

  // Receive browser installation prompt.
  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;
    addInstallButton();
    installButton.style.display = "block";
  });

  // Install when user taps the button.
  installButton.addEventListener("click", async () => {
    if (!installPrompt) {
      alert(
        "Open this website in Google Chrome. " +
        "Then select Install app or Add to Home screen " +
        "from the browser menu."
      );
      return;
    }

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch (error) {
      console.error(
        "DPPCC installation prompt error:",
        error
      );
    }

    installPrompt = null;
    installButton.style.display = "none";
  });

  // Hide button after installation.
  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.style.display = "none";
    console.info("DPPCC app installed.");
  });

})();
