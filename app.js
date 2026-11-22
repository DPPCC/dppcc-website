
document.addEventListener("DOMContentLoaded", function () {

  // Mobile Menu
  const menu = document.querySelector(".toggle");
  const nav = document.querySelector(".nav");

  if (menu && nav) {
    menu.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(isOpen));
      menu.textContent = isOpen ? "✕" : "☰";
    });

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        menu.setAttribute("aria-expanded", "false");
        menu.textContent = "☰";
      });
    });
  }

  // Club Year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = "2026";
  });

  // Sponsor Logo
  document.querySelectorAll("[data-sponsor]").forEach(function (img) {
    img.src = "assets/dppcc-sponsor-2003.jpg";
    img.alt = "DPPCC sponsor logo";
  });

  // Player Directory
  const playersList = document.getElementById("playersList");

  if (playersList) {
    const players = [
      {
        name: "RAHIM ISLAM",
        number: "56",
        entry: "07",
        position: "Batsman",
        batting: "Right-hand",
        photo: "images/players/rahim.png"
      }
    ];

    playersList.innerHTML = players.map(function (player) {
      return `
        <article class="card player-card">
          <div class="player-portrait">
            <img
              src="${player.photo}"
              alt="${player.name}"
              loading="lazy"
              onerror="this.style.display='none'; this.parentElement.textContent='PHOTO NOT AVAILABLE';"
            >
          </div>
          <div class="player-info">
            <span class="tag">PLAYER NO. ${player.entry}</span>
            <h3>${player.name}</h3>
            <p><strong>Jersey:</strong> ${player.number}</p>
            <p><strong>Position:</strong> ${player.position}</p>
            <p><strong>Batting:</strong> ${player.batting}</p>
          </div>
        </article>
      `;
    }).join("");
  }

});
