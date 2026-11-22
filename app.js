
document.addEventListener("DOMContentLoaded", function () {
  // Mobile menu
  const menu = document.querySelector(".menu");
  const links = document.querySelector(".links");

  if (menu && links) {
    menu.addEventListener("click", function () {
      const open = links.classList.toggle("open");
      menu.setAttribute("aria-expanded", String(open));
      menu.textContent = open ? "✕ CLOSE" : "☰ MENU";
    });

    links.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        links.classList.remove("open");
        menu.setAttribute("aria-expanded", "false");
        menu.textContent = "☰ MENU";
      });
    });
  }

  // Club year
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = "2026";
  });

  // Sponsor logo
  document.querySelectorAll("[data-sponsor]").forEach(function (img) {
    img.src = "assets/dppcc-sponsor-2003.jpg";
    img.alt = "DPPCC sponsor logo";
  });

  // Official player directory
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
