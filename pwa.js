
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

  // Add mobile app stylesheet.
  if (!document.querySelector('link[data-dppcc-mobile-style]')) {
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.href = "./mobile-app.css";
    style.setAttribute("data-dppcc-mobile-style", "true");
    document.head.appendChild(style);
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

  // Use the official club logo.
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
      registration.update().catch(() => {});
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

  // Build professional mobile navigation.
  function createMobileAppNavigation() {
    if (!document.body) return;

    if (document.querySelector(".dppcc-app-nav")) return;

    const currentPage = (
      window.location.pathname.split("/").pop() || "index.html"
    ).toLowerCase();

    const mainItems = [
      {
        label: "Home",
        icon: "⌂",
        href: "index.html",
        pages: ["", "index.html"]
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
      ["📅", "Fixtures & Results", "match-centre.html"],
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

    mainItems.forEach(item => {
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

    function closeMoreMenu() {
      backdrop.classList.remove("is-open");
      sheet.classList.remove("is-open");
      moreButton.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    function openMoreMenu() {
      backdrop.classList.add("is-open");
      sheet.classList.add("is-open");
      moreButton.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    moreButton.addEventListener("click", () => {
      const isOpen =
        moreButton.getAttribute("aria-expanded") === "true";

      if (isOpen) {
        closeMoreMenu();
      } else {
        openMoreMenu();
      }
    });

    backdrop.addEventListener("click", closeMoreMenu);

    sheet.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", closeMoreMenu);
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeMoreMenu();
      }
    });

    document.body.append(backdrop, sheet, nav);
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      createMobileAppNavigation,
      { once: true }
    );
  } else {
    createMobileAppNavigation();
  }

  // Create installation button.
  let installPrompt = null;

  const installButton = document.createElement("button");

  installButton.type = "button";
  installButton.textContent = "Install DPPCC App";
  installButton.className = "dppcc-install-button";
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

  // Install when user taps button.
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
