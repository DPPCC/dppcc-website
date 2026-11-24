
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import { db } from "../firebase-config.js";

const $ = (id) => document.getElementById(id);

const escapeHTML = (value = "") =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);

const safeImage = (url) => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
};

const timestamp = (item) =>
  item?.createdAt?.seconds || 0;

const formatDate = (value) => {
  if (!value) return "Date not announced";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return escapeHTML(value);
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
};

let players = [];
let matches = [];
let news = [];
let liveScores = [];

function showMessage(container, message) {
  if (container) {
    container.innerHTML =
      `<div class="loading-card">${escapeHTML(message)}</div>`;
  }
}

// ========================================
// FIRESTORE DATA
// ========================================

async function readCollection(name) {
  const snapshot = await getDocs(collection(db, name));

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

async function loadAllData() {
  try {
    const results = await Promise.all([
      readCollection("players"),
      readCollection("matches"),
      readCollection("news"),
      readCollection("liveScores")
    ]);

    players = results[0].sort((a, b) =>
      Number(a.entryNo || 9999) -
      Number(b.entryNo || 9999)
    );

    matches = results[1].sort((a, b) =>
      String(b.date || "").localeCompare(String(a.date || ""))
    );

    news = results[2].sort((a, b) =>
      timestamp(b) - timestamp(a)
    );

    liveScores = results[3].sort((a, b) =>
      timestamp(a) - timestamp(b)
    );

    renderHome();
    renderCurrentView();

  } catch (error) {
    console.error("DPPCC data loading error:", error);

    showMessage(
      $("homeMatchList"),
      "Match information could not be loaded. Please try again later."
    );

    showMessage(
      $("homePlayerList"),
      "Player information could not be loaded."
    );

    showMessage(
      $("homeNewsList"),
      "News information could not be loaded."
    );
  }
}

// ========================================
// MATCH SCORE CALCULATION
// ========================================

function getMatchScore(matchId) {
  const balls = liveScores.filter(
    (item) => item.matchId === matchId
  );

  if (!balls.length) return null;

  const innings = {};

  balls.forEach((item) => {
    const number = item.innings || 1;

    if (!innings[number]) {
      innings[number] = {
        runs: 0,
        wickets: 0,
        legalBalls: 0
      };
    }

    innings[number].runs +=
      Number(item.runs || 0) +
      Number(item.extrasRuns || 0);

    if (item.wicket === true) {
      innings[number].wickets++;
    }

    if (item.legalBall !== false) {
      innings[number].legalBalls++;
    }
  });

  return Object.entries(innings)
    .sort((a, b) => Number(a[0]) - Number(b[0]))
    .map(([number, score]) => ({
      innings: number,
      runs: score.runs,
      wickets: score.wickets,
      overs:
        `${Math.floor(score.legalBalls / 6)}.${score.legalBalls % 6}`
    }));
}

// ========================================
// MATCH CARDS
// ========================================

function matchCard(match) {
  const status = match.status || "Upcoming";
  const score = getMatchScore(match.id);

  const scoreHTML = score
    ? score.map((item) => `
        <p>
          Innings ${escapeHTML(item.innings)}:
          <strong>
            ${item.runs}/${item.wickets}
          </strong>
          (${item.overs} overs)
        </p>
      `).join("")
    : "";

  return `
    <article class="match-card">
      <span class="match-status">
        ${escapeHTML(status)}
      </span>

      <h3>
        ${escapeHTML(match.teamName || "DPPCC")}
        vs ${escapeHTML(match.opponent || "Opponent TBA")}
      </h3>

      <p>📅 ${formatDate(match.date)}</p>
      <p>📍 ${escapeHTML(match.venue || "Venue not announced")}</p>

      ${scoreHTML}

      ${
        match.result
          ? `<p><strong>${escapeHTML(match.result)}</strong></p>`
          : ""
      }
    </article>
  `;
}

// ========================================
// PLAYER CARDS
// ========================================

function playerCard(player) {
  const photo = safeImage(player.photoUrl);

  return `
    <article class="player-card">
      <img
        src="${escapeHTML(photo || "../assets/dppcc-club-logo.jpg")}"
        alt="${escapeHTML(player.name || "DPPCC player")}"
        loading="lazy"
      >

      <h3>${escapeHTML(player.name || "Player")}</h3>

      <p>${escapeHTML(player.role || "Player")}</p>

      <p>
        Jersey No. ${escapeHTML(player.jerseyNo ?? "—")}
      </p>
    </article>
  `;
}

// ========================================
// NEWS CARDS
// ========================================

function newsCard(item) {
  const body = String(item.body || "");

  return `
    <article class="news-card">
      <h3>${escapeHTML(item.title || "Club Update")}</h3>

      <p>${escapeHTML(
        body.length > 240
          ? body.slice(0, 240) + "…"
          : body
      )}</p>

      <p>
        <small>
          ${formatDate(
            item.createdAt?.seconds
              ? new Date(item.createdAt.seconds * 1000).toISOString()
              : ""
          )}
        </small>
      </p>
    </article>
  `;
}

// ========================================
// HOME PAGE
// ========================================

function renderHome() {
  const matchList = $("homeMatchList");
  const playerList = $("homePlayerList");
  const newsList = $("homeNewsList");

  if (matchList) {
    matchList.innerHTML = matches.length
      ? matches.slice(0, 3).map(matchCard).join("")
      : '<div class="loading-card">No matches published yet.</div>';
  }

  if (playerList) {
    playerList.innerHTML = players.length
      ? players.slice(0, 4).map(playerCard).join("")
      : '<div class="loading-card">No players added yet.</div>';
  }

  if (newsList) {
    newsList.innerHTML = news.length
      ? news.slice(0, 3).map(newsCard).join("")
      : '<div class="loading-card">No news published yet.</div>';
  }
}

// ========================================
// APP PAGE NAVIGATION
// ========================================

function setActiveNavigation(view) {
  document.querySelectorAll("[data-view]").forEach((button) => {
    const active = button.dataset.view === view;

    if (button.closest(".bottom-nav")) {
      button.classList.toggle("active", active);
    }
  });
}

function showView(view) {
  const panel = $("viewPanel");
  if (!panel) return;

  const homeSections = [
    document.querySelector(".hero"),
    document.querySelector(".quick-links"),
    $("homeMatches"),
    ...document.querySelectorAll(".content-section"),
    document.querySelector(".sponsor-panel")
  ];

  const isHome = view === "home";

  homeSections.forEach((section) => {
    if (section) section.hidden = !isHome;
  });

  panel.hidden = isHome;

  setActiveNavigation(view);

  if (isHome) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  if (view === "players") {
    panel.innerHTML = `
      <h1 class="page-title">Our Squad</h1>
      <p>Official DPPCC player directory.</p>

      ${
        players.length
          ? `<div class="player-strip">
              ${players.map(playerCard).join("")}
            </div>`
          : '<div class="empty-state">No players published yet.</div>'
      }
    `;
  }

  else if (view === "matches") {
    panel.innerHTML = `
      <h1 class="page-title">Match Centre</h1>
      <p>Fixtures, results and available live scores.</p>

      <div class="card-list">
        ${
          matches.length
            ? matches.map(matchCard).join("")
            : '<div class="empty-state">No matches published yet.</div>'
        }
      </div>
    `;
  }

  else if (view === "news") {
    panel.innerHTML = `
      <h1 class="page-title">Latest News</h1>
      <p>Official club announcements and updates.</p>

      <div class="card-list">
        ${
          news.length
            ? news.map(newsCard).join("")
            : '<div class="empty-state">No news published yet.</div>'
        }
      </div>
    `;
  }

  else if (view === "more") {
    panel.innerHTML = `
      <h1 class="page-title">More</h1>

      <div class="card-list">
        <article class="data-card">
          <h3>DPPCC Official App</h3>
          <p>One Club. One Team. One Dream.</p>
          <p>Established 2026</p>
        </article>

        <article class="data-card">
          <h3>Staff Access</h3>
          <p>Authorized club staff can use the staff dashboard.</p>
          <p><a class="text-link" href="../login.html">OPEN STAFF LOGIN →</a></p>
        </article>

        <article class="data-card">
          <h3>Official Sponsor</h3>
          <img
            src="../assets/dppcc-sponsor-2003.jpg"
            alt="Official sponsor logo"
            style="width:100%;max-width:220px;max-height:120px;object-fit:contain"
          >
        </article>
      </div>
    `;
  }

  else {
    panel.innerHTML = `
      <div class="empty-state">Page not found.</div>
    `;
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderCurrentView() {
  const active = document.querySelector(
    ".bottom-nav button.active"
  );

  const view = active?.dataset.view || "home";

  if (view !== "home") {
    showView(view);
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

document.addEventListener("click", (event) => {
  const button = event.target.closest("[data-view]");

  if (!button) return;

  event.preventDefault();

  showView(button.dataset.view);
});

const heroLink = document.querySelector(".hero-button");

heroLink?.addEventListener("click", (event) => {
  event.preventDefault();
  showView("matches");
});

// ========================================
// APP START
// ========================================

const year = $("year");

if (year) {
  year.textContent = new Date().getFullYear();
}

loadAllData();

// ========================================
// APP SERVICE WORKER REGISTRATION
// ========================================

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { scope: "./" })
      .then((registration) => {
        console.log(
          "DPPCC App Service Worker registered:",
          registration.scope
        );
      })
      .catch((error) => {
        console.error(
          "DPPCC App Service Worker registration failed:",
          error
        );
      });
  });
}
