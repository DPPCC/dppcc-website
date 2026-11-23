"use strict";

(() => {
  if (window.DPPCC_PWA_INITIALIZED) return;
  window.DPPCC_PWA_INITIALIZED = true;

  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;

  const THEME_COLOR = "#063b2b";

  if (isStandalone) {
    document.documentElement.classList.add(
      "dppcc-installed-app"
    );
  }

  // Manifest
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "./manifest.webmanifest";
    document.head.appendChild(manifest);
  }

  // Mobile stylesheet
  if (!document.querySelector("[data-dppcc-mobile-style]")) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "./mobile-app.css";
    style.setAttribute("data-dppcc-mobile-style", "true");
    document.head.appendChild(style);
  }

  // Theme color
  let theme = document.querySelector(
    'meta[name="theme-color"]'
  );

  if (!theme) {
    theme = document.createElement("meta");
    theme.name = "theme-color";
    document.head.appendChild(theme);
  }

  theme.content = THEME_COLOR;

  // Service worker
  function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("./sw.js", {
      scope: "./"
    }).then(registration => {
      registration.update().catch(() => {});
      console.info("DPPCC service worker registered.");
    }).catch(error => {
      console.error("DPPCC service worker error:", error);
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

  // Installed app: use app-home as the home destination.
  function correctHomeLinks() {
    if (!isStandalone) return;

    document.querySelectorAll(
      'a[href="index.html"], a[href="./index.html"]'
    ).forEach(link => {
      link.href = "app-home.html";
    });
  }

  // Bottom navigation
  function createAppNavigation() {
    if (!document.body) return;
    if (document.querySelector(".dppcc-app-nav")) return;

    const currentPage = (
      window.location.pathname.split("/").pop() || "index.html"
    ).toLowerCase();

    const items = [
      {
        label: "Home",
        icon: "⌂",
        href: "app-home.html",
        pages: ["", "index.html", "app-home.html"]
      },
      {
        label: "Players",
        icon: "♟",
        href: "players.html",
        pages: ["players.html"]
      },
      {
        label: "Matches",
        icon: "🏏",
        href: "matches.html",
        pages: ["matches.html", "match-centre.html"]
      },
      {
        label: "News",
        icon: "▤",
        href: "news.html",
        pages: ["news.html"]
      }
    ];

    const moreItems = [
      ["🏆", "Rankings", "rankings.html"],
      ["📅", "Match Centre", "match-centre.html"],
      ["🎬", "Videos", "videos.html"],
      ["🖼️", "Gallery", "gallery.html"],
      ["ℹ️", "About Club", "about.html"],
      ["📝", "Registration", "registration.html"],
      ["👕", "Jersey", "jersey.html"],
      ["☎️", "Contact", "contact.html"],
      ["🔐", "Staff Login", "login.html"]
    ];

    const nav = document.createElement("nav");
    nav.className = "dppcc-app-nav";
    nav.setAttribute("aria-label", "DPPCC app navigation");

    items.forEach(item => {
      const link = document.createElement("a");
      link.href = item.href;

      if (item.pages.includes(currentPage)) {
        link.setAttribute("aria-current", "page");
      }

      const icon = document.createElement("span");
      icon.className = "dppcc-nav-icon";
      icon.textContent = item.icon;

      const label = document.createElement("span");
      label.textContent = item.label;

      link.append(icon, label);
      nav.appendChild(link);
    });

    const moreButton = document.createElement("button");
    moreButton.type = "button";
    moreButton.setAttribute("aria-expanded", "false");
    moreButton.setAttribute("aria-controls", "dppccMoreMenu");

    const moreIcon = document.createElement("span");
    moreIcon.className = "dppcc-nav-icon";
    moreIcon.textContent = "☰";

    const moreLabel = document.createElement("span");
    moreLabel.textContent = "More";

    moreButton.append(moreIcon, moreLabel);
    nav.appendChild(moreButton);

    const backdrop = document.createElement("div");
    backdrop.className = "dppcc-more-backdrop";

    const sheet = document.createElement("section");
    sheet.className = "dppcc-more-sheet";
    sheet.id = "dppccMoreMenu";
    sheet.setAttribute("aria-label", "More DPPCC pages");

    const heading = document.createElement("h2");
    heading.textContent = "Explore DPPCC";

    const grid = document.createElement("div");
    grid.className = "dppcc-more-grid";

    moreItems.forEach(item => {
      const link = document.createElement("a");
      link.href = item[2];

      const icon = document.createElement("span");
      icon.textContent = item[0];

      const label = document.createElement("span");
      label.textContent = item[1];

      link.append(icon, label);
      grid.appendChild(link);
    });

    sheet.append(heading, grid);

    function closeMenu() {
      backdrop.classList.remove("is-open");
      sheet.classList.remove("is-open");
      moreButton.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    function openMenu() {
      backdrop.classList.add("is-open");
      sheet.classList.add("is-open");
      moreButton.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    moreButton.addEventListener("click", () => {
      const opened =
        moreButton.getAttribute("aria-expanded") === "true";

      if (opened) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    backdrop.addEventListener("click", closeMenu);

    sheet.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeMenu);
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") closeMenu();
    });

    document.body.append(backdrop, sheet, nav);
  }

  function initializePWAInterface() {
    correctHomeLinks();

    if (isStandalone) {
      createAppNavigation();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializePWAInterface,
      { once: true }
    );
  } else {
    initializePWAInterface();
  }

  // Browser install button
  let installPrompt = null;

  const installButton = document.createElement("button");
  installButton.type = "button";
  installButton.textContent = "Install DPPCC App";
  installButton.className = "dppcc-install-button";

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
    color:#fff;
    font-size:14px;
    font-weight:800;
    cursor:pointer;
    box-shadow:0 4px 16px rgba(0,0,0,.25);
  `;

  function addInstallButton() {
    if (!document.body) return;

    if (!document.body.contains(installButton)) {
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

  window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    installPrompt = event;

    if (!isStandalone) {
      addInstallButton();
      installButton.style.display = "block";
    }
  });

  installButton.addEventListener("click", async () => {
    if (!installPrompt) {
      alert(
        "Open this website in Google Chrome. " +
        "Then select Install app or Add to Home screen."
      );
      return;
    }

    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch (error) {
      console.error("DPPCC install error:", error);
    }

    installPrompt = null;
    installButton.style.display = "none";
  });

  window.addEventListener("appinstalled", () => {
    installPrompt = null;
    installButton.style.display = "none";
  });

})();
