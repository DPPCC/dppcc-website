
/* DPPCC website interactions */
document.addEventListener("DOMContentLoaded", function () {
  const menuButton = document.querySelector(".toggle");
  const nav = document.querySelector(".nav");

  // Mobile three-line menu
  if (menuButton && nav) {
    menuButton.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      menuButton.textContent = isOpen ? "✕" : "☰";
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-label", "Open menu");
        menuButton.textContent = "☰";
      });
    });
  }

  // Sponsor logo
  document.querySelectorAll("img[data-sponsor]").forEach(function (img) {
    img.src = "assets/dppcc-sponsor-2003.jpg";
    img.alt = "Official DPPCC sponsor logo";
    img.loading = "lazy";
  });

  // Club establishment year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = "2026";
  });
});
