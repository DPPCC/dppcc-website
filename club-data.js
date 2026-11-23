
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { auth, db } from "./firebase-config.js";

// ========================================
// DPPCC CONFIGURATION
// ========================================

const CLOUD_NAME = "zkgexaov";
const UPLOAD_PRESET = "dppcc_player_photos";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

const STAFF = {
  "dungsreepaschimparacricketclub@gmail.com": "Owner",
  "dppccadmin@gmail.com": "Admin",
  "dppccmanager@gmail.com": "Manager",
  "dppcaptain@gmail.com": "Captain"
};

let currentUser = null;
let currentRole = null;
let editingPlayerId = null;

const $ = (id) => document.getElementById(id);

const authReady = new Promise((resolve) => {
  onAuthStateChanged(auth, (user) => {
    currentUser = user;
    currentRole = user
      ? STAFF[user.email?.toLowerCase()] || null
      : null;
    resolve(user);
  });
});

// ========================================
// SECURITY HELPERS
// ========================================

function canManagePlayers() {
  return ["Owner", "Admin", "Captain"].includes(currentRole);
}

function canDeletePlayers() {
  return currentRole === "Owner";
}

function canManageMatches() {
  return ["Owner", "Admin", "Manager"].includes(currentRole);
}

function canManageNews() {
  return ["Owner", "Admin"].includes(currentRole);
}

function canScore() {
  return ["Owner", "Admin", "Captain"].includes(currentRole);
}

function canReviewApplications() {
  return ["Owner", "Admin", "Manager"].includes(currentRole);
}

function showMessage(id, message, error = false) {
  const el = $(id);
  if (!el) return;

  el.textContent = message;
  el.style.color = error ? "#b42318" : "#176b37";
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function requireStaff() {
  if (!currentUser || !currentRole) {
    alert("Please sign in with an authorized DPPCC staff account.");
    return false;
  }
  return true;
}

// ========================================
// CLOUDINARY PHOTO UPLOAD
// ========================================

async function uploadPhoto(file) {
  if (!file) return "";

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Only JPG, PNG and WebP images are allowed.");
  }

  if (file.size > MAX_PHOTO_SIZE) {
    throw new Error("Photo must be 5 MB or smaller.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", "dppcc/player-photos");

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    throw new Error(
      result.error?.message || "Photo upload failed."
    );
  }

  return result.secure_url;
}

// ========================================
// PLAYER DIRECTORY
// ========================================

async function loadPlayers() {
  const list = $("playersList");
  const count = $("playerCount");

  if (!list) return;

  list.innerHTML = "<p>Loading players...</p>";

  try {
    const snapshot = await getDocs(collection(db, "players"));

    const players = snapshot.docs.map((item) => ({
      id: item.id,
      ...item.data()
    }));

    players.sort((a, b) =>
      Number(a.entryNo || 9999) - Number(b.entryNo || 9999)
    );

    if (count) {
      count.textContent = `${players.length} PLAYER${players.length === 1 ? "" : "S"}`;
    }

    if (!players.length) {
      list.innerHTML = '<div class="empty">No players added yet.</div>';
      return;
    }

    list.innerHTML = players.map((player) => `
      <article class="player-card">
        <div class="player-photo">
          <img
            src="${escapeHTML(player.photoUrl || "assets/dppcc-club-logo.jpg")}"
            alt="${escapeHTML(player.name)}"
            loading="lazy"
          >
        </div>
        <div class="player-details">
          <span class="player-entry">
            PLAYER NO. ${escapeHTML(player.entryNo || "—")}
          </span>
          <h3>${escapeHTML(player.name)}</h3>
          <p><strong>Position:</strong> ${escapeHTML(player.role)}</p>
          <p><strong>Batting:</strong> ${escapeHTML(player.battingStyle || "—")}</p>
          <p><strong>Jersey:</strong> ${escapeHTML(player.jerseyNo ?? "—")}</p>
          ${
            canManagePlayers()
              ? `<button class="btn dark" data-edit-player="${escapeHTML(player.id)}">Edit</button>`
              : ""
          }
          ${
            canDeletePlayers()
              ? `<button class="btn" data-delete-player="${escapeHTML(player.id)}">Delete</button>`
              : ""
          }
        </div>
      </article>
    `).join("");

    list.querySelectorAll("[data-edit-player]").forEach((button) => {
      button.addEventListener("click", () => {
        const player = players.find(p => p.id === button.dataset.editPlayer);
        if (!player) return;

        editingPlayerId = player.id;
        $("playerName").value = player.name || "";
        $("playerRole").value = player.role || "Batsman";
        $("jerseyNo").value = player.jerseyNo ?? "";
        $("entryNo").value = player.entryNo || "";
        $("battingStyle").value = player.battingStyle || "";
        $("playerFormTitle").textContent = "Edit Player";
        $("playerSubmit").textContent = "Update Player";
        $("playerForm").scrollIntoView({ behavior: "smooth" });
      });
    });

    list.querySelectorAll("[data-delete-player]").forEach((button) => {
      button.addEventListener("click", async () => {
        if (!canDeletePlayers()) return;

        if (!confirm("Delete this player permanently?")) return;

        try {
          await deleteDoc(doc(db, "players", button.dataset.deletePlayer));
          await loadPlayers();
        } catch (error) {
          alert("Delete failed: " + error.message);
        }
      });
    });

  } catch (error) {
    list.innerHTML = '<div class="empty">Could not load players.</div>';
    console.error(error);
  }
}

async function savePlayer(event) {
  event.preventDefault();

  if (!requireStaff() || !canManagePlayers()) return;

  const button = $("playerSubmit");
  button.disabled = true;

  try {
    const photoFile = $("playerPhoto")?.files?.[0];
    let photoUrl = $("existingPhotoUrl")?.value || "";

    if (photoFile) {
      showMessage("playerNotice", "Uploading player photo...");
      photoUrl = await uploadPhoto(photoFile);
    }

    const playerData = {
      name: $("playerName").value.trim(),
      role: $("playerRole").value,
      jerseyNo: Number($("jerseyNo").value),
      entryNo: $("entryNo").value.trim(),
      battingStyle: $("battingStyle").value,
      photoUrl,
      updatedAt: serverTimestamp(),
      updatedBy: currentUser.email
    };

    if (!playerData.name || !playerData.entryNo) {
      throw new Error("Player name and entry number are required.");
    }

    if (editingPlayerId) {
      await updateDoc(
        doc(db, "players", editingPlayerId),
        playerData
      );
    } else {
      await addDoc(collection(db, "players"), {
        ...playerData,
        createdAt: serverTimestamp(),
        createdBy: currentUser.email
      });
    }

    $("playerForm").reset();
    editingPlayerId = null;
    $("playerFormTitle").textContent = "Add New Player";
    button.textContent = "Add Player";

    showMessage("playerNotice", "Player saved successfully.");
    await loadPlayers();

  } catch (error) {
    showMessage("playerNotice", error.message, true);
  } finally {
    button.disabled = false;
  }
}

// ========================================
// PLAYER REGISTRATION
// ========================================

async function submitRegistration(event) {
  event.preventDefault();

  const form = $("playerRegistrationForm");
  const button = $("registrationSubmit");

  if (!form || !button) return;

  button.disabled = true;

  try {
    const file = $("registrationPhoto")?.files?.[0];

    if (!file) {
      throw new Error("Please upload your player photo.");
    }

    showMessage("registrationNotice", "Uploading photo...");

    const photoUrl = await uploadPhoto(file);

    const application = {
      name: $("registrationName").value.trim(),
      phone: $("registrationPhone").value.trim(),
      age: Number($("registrationAge").value),
      role: $("registrationRole").value,
      address: $("registrationAddress").value.trim(),
      photoUrl,
      status: "Pending",
      createdAt: serverTimestamp()
    };

    if (
      !application.name ||
      !application.phone ||
      !application.address ||
      !Number.isInteger(application.age) ||
      application.age < 8 ||
      application.age > 70
    ) {
      throw new Error("Please check all registration details.");
    }

    await addDoc(collection(db, "registrations"), application);

    form.reset();
    showMessage(
      "registrationNotice",
      "Application submitted successfully. The club will review it."
    );

  } catch (error) {
    showMessage("registrationNotice", error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function loadApplications() {
  const list = $("registrationAdminList");

  if (!list || !canReviewApplications()) return;

  list.innerHTML = "<p>Loading applications...</p>";

  try {
    const snapshot = await getDocs(collection(db, "registrations"));

    const applications = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    applications.sort((a, b) =>
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );

    if (!applications.length) {
      list.innerHTML = '<div class="empty">No applications yet.</div>';
      return;
    }

    list.innerHTML = applications.map(item => `
      <article class="panel">
        ${item.photoUrl ? `
          <img src="${escapeHTML(item.photoUrl)}"
               alt="Applicant photo"
               style="width:120px;height:140px;object-fit:cover;border-radius:8px">
        ` : ""}
        <h3>${escapeHTML(item.name)}</h3>
        <p>Phone: ${escapeHTML(item.phone)}</p>
        <p>Age: ${escapeHTML(item.age)}</p>
        <p>Role: ${escapeHTML(item.role)}</p>
        <p>Address: ${escapeHTML(item.address)}</p>
        <p>Status: ${escapeHTML(item.status || "Pending")}</p>
        <button class="btn dark" data-application="${item.id}" data-status="Approved">
          Approve
        </button>
        <button class="btn" data-application="${item.id}" data-status="Rejected">
          Reject
        </button>
      </article>
    `).join("");

    list.querySelectorAll("[data-application]").forEach(button => {
      button.addEventListener("click", async () => {
        const id = button.dataset.application;
        const status = button.dataset.status;

        try {
          await updateDoc(doc(db, "registrations", id), {
            status,
            reviewedAt: serverTimestamp(),
            reviewedBy: currentUser.email
          });

          await loadApplications();
        } catch (error) {
          alert("Could not update application: " + error.message);
        }
      });
    });

  } catch (error) {
    list.innerHTML = '<div class="empty">Could not load applications.</div>';
    console.error(error);
  }
}

// ========================================
// MATCH MANAGEMENT
// ========================================

async function loadMatches() {
  const list = $("matchesList");
  const selector = $("scoreMatchId");

  if (!list && !selector) return;

  try {
    const snapshot = await getDocs(collection(db, "matches"));

    const matches = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    matches.sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")));

    if (list) {
      list.innerHTML = matches.length
        ? matches.map(match => `
          <article class="panel">
            <span class="tag">${escapeHTML(match.status)}</span>
            <h3>${escapeHTML(match.teamName || "DPPCC")} vs ${escapeHTML(match.opponent)}</h3>
            <p>Date: ${escapeHTML(match.date)}</p>
            <p>Venue: ${escapeHTML(match.venue)}</p>
            <p>Overs: ${escapeHTML(match.overs || "—")}</p>
            <p>${escapeHTML(match.result || "")}</p>
            <a class="btn dark" href="match-centre.html?match=${encodeURIComponent(match.id)}">View Score</a>
            ${
              canManageMatches()
                ? `<button class="btn" data-delete-match="${escapeHTML(match.id)}">Delete</button>`
                : ""
            }
          </article>
        `).join("")
        : '<div class="empty">No matches published yet.</div>';

      list.querySelectorAll("[data-delete-match]").forEach(button => {
        button.addEventListener("click", async () => {
          if (!canManageMatches()) return;
          if (!confirm("Delete this match?")) return;

          try {
            await deleteDoc(doc(db, "matches", button.dataset.deleteMatch));
            await loadMatches();
          } catch (error) {
            alert(error.message);
          }
        });
      });
    }

    if (selector) {
      selector.innerHTML =
        '<option value="">Select match</option>' +
        matches.map(match => `
          <option value="${escapeHTML(match.id)}">
            ${escapeHTML(match.teamName || "DPPCC")} vs ${escapeHTML(match.opponent)}
          </option>
        `).join("");
    }

  } catch (error) {
    if (list) list.textContent = "Could not load matches.";
    console.error(error);
  }
}

async function saveMatch(event) {
  event.preventDefault();

  if (!requireStaff() || !canManageMatches()) return;

  const button = $("matchSubmit");
  button.disabled = true;

  try {
    const data = {
      teamName: $("matchTeam").value.trim() || "DPPCC",
      opponent: $("matchOpponent").value.trim(),
      date: $("matchDate").value,
      venue: $("matchVenue").value.trim(),
      status: $("matchStatus").value,
      result: $("matchResult").value.trim(),
      overs: Number($("matchOvers").value),
      matchType: $("matchType").value,
      createdAt: serverTimestamp(),
      createdBy: currentUser.email
    };

    if (!data.opponent || !data.date || !data.venue) {
      throw new Error("Opponent, date and venue are required.");
    }

    await addDoc(collection(db, "matches"), data);

    $("matchForm").reset();
    showMessage("matchNotice", "Match published successfully.");
    await loadMatches();

  } catch (error) {
    showMessage("matchNotice", error.message, true);
  } finally {
    button.disabled = false;
  }
}

// ========================================
// BALL-BY-BALL LIVE SCORING
// ========================================

async function submitBall(event) {
  event.preventDefault();

  if (!requireStaff() || !canScore()) return;

  const button = $("ballSubmit");
  button.disabled = true;

  try {
    const matchId = $("scoreMatchId").value;
    if (!matchId) throw new Error("Select a match first.");

    const matchSnapshot = await getDocs(collection(db, "matches"));
    const matchDoc = matchSnapshot.docs.find(item => item.id === matchId);

    if (!matchDoc) throw new Error("Selected match was not found.");

    const extrasType = $("extrasType").value;
    const extrasRuns = Number($("extrasRuns").value || 0);
    const runs = Number($("ballRuns").value || 0);
    const wicket = $("ballWicket").value === "yes";
    const over = Number($("ballOver").value);
    const ball = Number($("ballNumber").value);

    const data = {
      matchId,
      matchLabel: `${matchDoc.data().teamName || "DPPCC"} vs ${matchDoc.data().opponent}`,
      innings: Number($("inningsNumber").value),
      over,
      ball,
      batter: $("batterName").value.trim(),
      bowler: $("bowlerName").value.trim(),
      runs,
      extrasType,
      extrasRuns,
      wicket,
      dismissedPlayer: $("dismissedPlayer").value.trim(),
      commentary: $("ballCommentary").value.trim(),
      legalBall: !["Wide", "No-ball"].includes(extrasType),
      createdAt: serverTimestamp(),
      createdBy: currentUser.email
    };

    if (
      !Number.isInteger(data.innings) ||
      data.innings < 1 || data.innings > 2 ||
      !Number.isInteger(over) || over < 0 ||
      !Number.isInteger(ball) || ball < 1 || ball > 6 ||
      runs < 0 || runs > 6 ||
      extrasRuns < 0
    ) {
      throw new Error("Please check innings, over, ball and runs.");
    }

    await addDoc(collection(db, "liveScores"), data);

    await updateDoc(doc(db, "matches", matchId), {
      status: "Live",
      updatedAt: serverTimestamp()
    });

    $("ballCommentary").value = "";
    $("ballRuns").value = "0";
    $("extrasRuns").value = "0";
    showMessage("scoreNotice", "Ball added to live score.");

    await loadLiveScores(matchId);
    await loadMatches();

  } catch (error) {
    showMessage("scoreNotice", error.message, true);
  } finally {
    button.disabled = false;
  }
}

async function loadLiveScores(matchId = "") {
  const list = $("liveScoresList");
  if (!list) return;

  list.innerHTML = "<p>Loading score...</p>";

  try {
    const snapshot = await getDocs(collection(db, "liveScores"));

    let balls = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    if (matchId) {
      balls = balls.filter(item => item.matchId === matchId);
    }

    balls.sort((a, b) =>
      (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0)
    );

    if (!balls.length) {
      list.innerHTML = '<div class="empty">No live score available yet.</div>';
      return;
    }

    const inningsGroups = {};

    balls.forEach(item => {
      const inning = item.innings || 1;
      if (!inningsGroups[inning]) inningsGroups[inning] = [];
      inningsGroups[inning].push(item);
    });

    list.innerHTML = Object.keys(inningsGroups).sort().map(inning => {
      const inningBalls = inningsGroups[inning];

      const totalRuns = inningBalls.reduce(
        (sum, item) => sum + Number(item.runs || 0) + Number(item.extrasRuns || 0), 0
      );

      const wickets = inningBalls.filter(item => item.wicket).length;
      const legalBalls = inningBalls.filter(item => item.legalBall !== false).length;
      const overs = `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;

      return `
        <section class="panel">
          <h3>Innings ${inning}</h3>
          <div class="jersey-number">${totalRuns}/${wickets}</div>
          <p>Overs: ${overs}</p>
          <h4>Ball-by-ball Commentary</h4>
          ${inningBalls.slice().reverse().map(item => `
            <p>
              <strong>${escapeHTML(item.over)}.${escapeHTML(item.ball)}</strong>
              — ${escapeHTML(item.batter || "")}
              ${escapeHTML(item.runs)} run(s)
              ${item.extrasType !== "None" ? ` · ${escapeHTML(item.extrasType)} ${escapeHTML(item.extrasRuns)}` : ""}
              ${item.wicket ? " · WICKET" : ""}
              <br>
              <span>${escapeHTML(item.commentary || "")}</span>
            </p>
          `).join("")}
        </section>
      `;
    }).join("");

  } catch (error) {
    list.innerHTML = '<div class="empty">Could not load live scores.</div>';
    console.error(error);
  }
}

// ========================================
// NEWS MANAGEMENT
// ========================================

async function loadNews() {
  const list = $("newsList");
  if (!list) return;

  try {
    const snapshot = await getDocs(collection(db, "news"));

    const news = snapshot.docs.map(item => ({
      id: item.id,
      ...item.data()
    }));

    news.sort((a, b) =>
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );

    list.innerHTML = news.length
      ? news.map(item => `
        <article class="panel">
          <h3>${escapeHTML(item.title)}</h3>
          <p>${escapeHTML(item.body)}</p>
          <small>${escapeHTML(item.createdBy || "DPPCC")}</small>
          ${
            canManageNews()
              ? `<button class="btn" data-delete-news="${escapeHTML(item.id)}">Delete</button>`
              : ""
          }
        </article>
      `).join("")
      : '<div class="empty">No news published yet.</div>';

    list.querySelectorAll("[data-delete-news]").forEach(button => {
      button.addEventListener("click", async () => {
        if (!canManageNews()) return;
        if (!confirm("Delete this news post?")) return;

        try {
          await deleteDoc(doc(db, "news", button.dataset.deleteNews));
          await loadNews();
        } catch (error) {
          alert(error.message);
        }
      });
    });

  } catch (error) {
    list.textContent = "Could not load news.";
    console.error(error);
  }
}

async function saveNews(event) {
  event.preventDefault();

  if (!requireStaff() || !canManageNews()) return;

  try {
    await addDoc(collection(db, "news"), {
      title: $("newsTitle").value.trim(),
      body: $("newsBody").value.trim(),
      createdAt: serverTimestamp(),
      createdBy: currentUser.email
    });

    $("newsForm").reset();
    showMessage("newsNotice", "News published successfully.");
    await loadNews();

  } catch (error) {
    showMessage("newsNotice", error.message, true);
  }
}

// ========================================
// JERSEY ORDERS
// ========================================

async function submitJerseyOrder(event) {
  event.preventDefault();

  const button = $("jerseySubmit");
  button.disabled = true;

  try {
    await addDoc(collection(db, "jerseyOrders"), {
      name: $("jerseyName").value.trim(),
      phone: $("jerseyPhone").value.trim(),
      size: $("jerseySize").value,
      number: Number($("jerseyNumber").value),
      createdAt: serverTimestamp()
    });

    $("jerseyOrderForm").reset();
    showMessage("jerseyNotice", "Jersey order submitted successfully.");

  } catch (error) {
    showMessage("jerseyNotice", error.message, true);
  } finally {
    button.disabled = false;
  }
}

// ========================================
// DASHBOARD ACCESS
// ========================================

function setupDashboard() {
  const pages = [
    { id: "ownerContent", role: "Owner", email: "ownerEmail", logout: "ownerLogout" },
    { id: "adminContent", role: "Admin", email: "adminEmail", logout: "adminLogout" },
    { id: "managerContent", role: "Manager", email: "managerEmail", logout: "managerLogout" },
    { id: "captainContent", role: "Captain", email: "captainEmail", logout: "captainLogout" }
  ];

  pages.forEach(page => {
    const content = $(page.id);
    if (!content) return;

    const allowed =
      currentRole === "Owner" ||
      currentRole === page.role;

    if (!currentUser || !allowed) {
      alert("You do not have permission to access this dashboard.");
      window.location.replace("login.html");
      return;
    }

    content.style.display = "block";

    if ($(page.email)) {
      $(page.email).textContent = `Signed in as: ${currentUser.email}`;
    }

    if ($(page.logout)) {
      $(page.logout).addEventListener("click", async () => {
        await signOut(auth);
        window.location.replace("login.html");
      });
    }
  });
}

// ========================================
// INITIALIZE PAGE FEATURES
// ========================================

async function initializeDPPCC() {
  await authReady;

  setupDashboard();

  if ($("playersList")) {
    await loadPlayers();
  }

  if ($("playerForm")) {
    if (canManagePlayers()) {
      $("playerForm").addEventListener("submit", savePlayer);
    } else {
      $("playerForm").style.display = "none";
    }
  }

  if ($("playerRegistrationForm")) {
    $("playerRegistrationForm").addEventListener("submit", submitRegistration);
  }

  if ($("registrationAdminList")) {
    if (canReviewApplications()) {
      await loadApplications();
    } else {
      $("registrationAdminList").style.display = "none";
    }
  }

  if ($("matchForm")) {
    if (canManageMatches()) {
      $("matchForm").addEventListener("submit", saveMatch);
    } else {
      $("matchForm").style.display = "none";
    }
  }

  if ($("matchesList") || $("scoreMatchId")) {
    await loadMatches();
  }

  if ($("liveBallForm")) {
    if (canScore()) {
      $("liveBallForm").addEventListener("submit", submitBall);
    } else {
      $("liveBallForm").style.display = "none";
    }
  }

  if ($("liveScoresList")) {
    const selectedMatch = new URLSearchParams(location.search).get("match") || "";
    await loadLiveScores(selectedMatch);
  }

  if ($("newsList")) {
    await loadNews();
  }

  if ($("newsForm")) {
    if (canManageNews()) {
      $("newsForm").addEventListener("submit", saveNews);
    } else {
      $("newsForm").style.display = "none";
    }
  }

  if ($("jerseyOrderForm")) {
    $("jerseyOrderForm").addEventListener("submit", submitJerseyOrder);
  }
}

initializeDPPCC().catch(error => {
  console.error("DPPCC initialization error:", error);
});
