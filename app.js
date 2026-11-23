
document.addEventListener("DOMContentLoaded", () => {
  // Mobile navigation
  const menu = document.querySelector(".toggle");
  const nav = document.querySelector(".nav");

  if (menu && nav) {
    menu.addEventListener("click", () => {
      const opened = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(opened));
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

  // Club establishment year
  document.querySelectorAll("[data-year]").forEach(el => {
    el.textContent = "2026";
  });

  // Sponsor logo only
  document.querySelectorAll("[data-sponsor]").forEach(img => {
    img.src = "assets/dppcc-sponsor-2003.jpg";
    img.alt = "Official DPPCC Sponsor Logo";
  });

  // Player cards are loaded from Firebase by club-data.js.
  // Do not add hard-coded players here.
});
