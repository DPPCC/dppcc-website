
"use strict";

(() => {
  function loadDPPCCPWA() {
    // Load PWA support once.
    if (document.querySelector(
      'script[data-dppcc-pwa="true"]'
    )) {
      return;
    }

    const script = document.createElement("script");
    script.src = "./pwa.js";
    script.defer = true;
    script.setAttribute("data-dppcc-pwa", "true");

    script.onerror = () => {
      console.error("Unable to load DPPCC PWA script.");
    };

    document.body.appendChild(script);
  }

  function initializeDPPCCWebsite() {
    // Mobile navigation.
    const menu = document.querySelector(".toggle");
    const nav = document.querySelector(".nav");

    if (menu && nav) {
      menu.addEventListener("click", () => {
        const opened = nav.classList.toggle("open");

        menu.setAttribute(
          "aria-expanded",
          String(opened)
        );

        menu.textContent = opened ? "✕" : "☰";
      });

      nav.querySelectorAll("a").forEach(link => {
        link.addEventListener("click", () => {
          nav.classList.remove("open");
          menu.setAttribute("aria-expanded", "false");
          menu.textContent = "☰";
        });
      });
    }

    // Club establishment year.
    document.querySelectorAll("[data-year]").forEach(el => {
      el.textContent = "2026";
    });

    // Sponsor logo only.
    document.querySelectorAll("[data-sponsor]").forEach(img => {
      img.src = "assets/dppcc-sponsor-2003.jpg";
      img.alt = "Official DPPCC Sponsor Logo";
    });

    // Player cards are loaded from Firebase by club-data.js.
    // Do not add hard-coded players here.

    // Load PWA support after existing website setup.
    loadDPPCCPWA();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeDPPCCWebsite,
      { once: true }
    );
  } else {
    initializeDPPCCWebsite();
  }
})();
