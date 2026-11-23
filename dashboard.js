
"use strict";

const $ = id => document.getElementById(id);
const role = document.body.dataset.role;
let activeUser = null;

const OWNER_EMAIL = "dungsreepaschimparacricketclub@gmail.com";

const permissions = {
  Owner: ["players", "matches", "liveScores", "news", "registrations", "jerseyOrders", "staff", "delete", "backup"],
  Admin: ["players", "news"],
  Manager: ["matches", "registrations", "jerseyOrders"],
  Captain: ["players", "liveScores"]
};

const can = permission => permissions[role]?.includes(permission) === true;

const stamp = () => firebase.firestore.FieldValue.serverTimestamp();

const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[char]));

function showStatus(message, error = false) {
  const box = $("accessMessage");
  if (!box) return;

  box.textContent = message;
  box.classList.remove("hidden");
  box.style.background = error ? "#ffe5e5" : "#e5f7eb";
  box.style.color = error ? "#9b1717" : "#14532d";
}

function input(label, name, type = "text", extra = "") {
  return `<label>${label}</label><input name="${name}" type="${type}" ${extra} required>`;
}

function buildForms() {
  let html = "";

  if (can("players")) {
    html += `
      <section class="formbox">
        <h3>Add / Edit Player</h3>
        <form id="playerForm">
          <input type="hidden" name="docId">
          ${input("Player Name", "name", "text", 'maxlength="70"')}
          <label>Playing Role</label>
          <select name="role" required>
            <option>Batsman</option>
            <option>Bowler</option>
            <option>All-Rounder</option>
            <option>Wicket Keeper</option>
          </select>
          ${input("Jersey Number", "jerseyNo", "number", 'min="0" max="999"')}
          ${input("Entry Number", "entryNo", "text", 'maxlength="30"')}
          <label>Batting Style</label>
          <select name="battingStyle" required>
            <option value="Right-hand">Right-hand</option>
            <option value="Left-hand">Left-hand</option>
          </select>
          ${input("Player Photo URL (optional)", "photoUrl", "url", "")}
          <button id="playerSubmit">ADD PLAYER</button>
          <button type="button" id="cancelPlayer" class="secondary hidden">CANCEL EDIT</button>
        </form>
      </section>`;
  }

  if (can("matches")) {
    html += `
      <section class="formbox">
        <h3>Add / Edit Match</h3>
        <form id="matchForm">
          <input type="hidden" name="docId">
          ${input("Team Name", "teamName", "text", 'maxlength="70"')}
          ${input("Opponent Team", "opponent", "text", 'maxlength="70"')}
          ${input("Match Date", "date", "date")}
          ${input("Venue", "venue", "text", 'maxlength="100"')}
          <label>Match Status</label>
          <select name="status">
            <option>Upcoming</option>
            <option>Live</option>
            <option>Completed</option>
          </select>
          <label>Match Type</label>
          <select name="matchType">
            <option>Friendly</option>
            <option>T20</option>
            <option>ODI</option>
            <option>Test</option>
            <option>Other</option>
          </select>
          ${input("Overs", "overs", "number", 'min="1" max="100"')}
          ${input("Score / Result", "result", "text", 'maxlength="250"')}
          <button id="matchSubmit">ADD MATCH</button>
          <button type="button" id="cancelMatch" class="secondary hidden">CANCEL EDIT</button>
        </form>
      </section>`;
  }

  if (can("liveScores")) {
    html += `
      <section class="formbox">
        <h3>Ball-by-Ball Update</h3>
        <form id="ballForm">
          <label>Match</label>
          <select name="matchId" id="ballMatch" required>
            <option value="">Select match</option>
          </select>
          ${input("Innings", "innings", "number", 'min="1" max="2" value="1"')}
          ${input("Over", "over", "number", 'min="0" max="99"')}
          ${input("Ball (1–6)", "ball", "number", 'min="1" max="6"')}
          ${input("Batter", "batter", "text", 'maxlength="80"')}
          ${input("Bowler", "bowler", "text", 'maxlength="80"')}
          ${input("Runs", "runs", "number", 'min="0" max="6"')}
          <label>Extras Type</label>
          <select name="extrasType">
            <option>None</option>
            <option>Wide</option>
            <option>No Ball</option>
            <option>Bye</option>
            <option>Leg Bye</option>
          </select>
          ${input("Extra Runs", "extrasRuns", "number", 'min="0" max="10" value="0"')}
          <label>Wicket?</label>
          <select name="wicket">
            <option value="false">No</option>
            <option value="true">Yes</option>
          </select>
          ${input("Dismissed Player", "dismissedPlayer", "text", 'maxlength="80"')}
          <label>Commentary</label>
          <input name="commentary" maxlength="250">
          <button>POST BALL UPDATE</button>
        </form>
      </section>`;
  }

  if (can("news")) {
    html += `
      <section class="formbox">
        <h3>Publish News</h3>
        <form id="newsForm">
          ${input("Headline", "title", "text", 'maxlength="150"')}
          <label>Details</label>
          <textarea name="body" maxlength="5000" required></textarea>
          <button>PUBLISH NEWS</button>
        </form>
      </section>`;
  }

  if (can("staff")) {
    html += `
      <section class="formbox">
        <h3>Staff Role Management</h3>
        <p>Create staff accounts first in Firebase Authentication.</p>
        <form id="staffForm">
          ${input("Staff Email", "email", "email")}
          <label>Role</label>
          <select name="role">
            <option>Admin</option>
            <option>Manager</option>
            <option>Captain</option>
          </select>
          <label>Account Status</label>
          <select name="active">
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button>SAVE STAFF ACCESS</button>
        </form>
        <div id="staffList">Loading staff...</div>
      </section>

      <section class="formbox">
        <h3>Owner Data Backup</h3>
        <p>Download a JSON backup of club data.</p>
        <button id="backupButton">DOWNLOAD BACKUP</button>
      </section>`;
  }

  $("formsArea").innerHTML = html;
}

async function getRole(user) {
  const email = (user.email || "").trim().toLowerCase();

  if (email === OWNER_EMAIL) return "Owner";

  const snapshot = await dppccDb.collection("staff").doc(email).get();

  if (!snapshot.exists) return null;

  const data = snapshot.data();

  if (data.active !== true) return null;
  if ((data.email || "").toLowerCase() !== email) return null;

  return ["Admin", "Manager", "Captain"].includes(data.role)
    ? data.role
    : null;
}

async function loadStaff() {
  const box = $("staffList");
  if (!box) return;

  try {
    const snapshot = await dppccDb.collection("staff").get();

    box.innerHTML = snapshot.empty
      ? "No staff roles assigned."
      : snapshot.docs.map(doc => {
          const item = doc.data();
          return `
            <div class="item">
              <b>${esc(item.email || doc.id)}</b>
              · ${esc(item.role)}
              · ${item.active ? "Active" : "Inactive"}
            </div>`;
        }).join("");
  } catch (error) {
    box.textContent = "Could not load staff: " + error.message;
  }
}

async function loadRecords() {
  const tasks = [
    can("players") ? dppccDb.collection("players").get() : null,
    can("matches") || can("liveScores") ? dppccDb.collection("matches").get() : null,
    can("news") ? dppccDb.collection("news").get() : null
  ];

  const [players, matches, news] = await Promise.all(tasks);

  $("statPlayers").textContent = players ? players.size : "—";
  $("statMatches").textContent = matches ? matches.size : "—";
  $("statNews").textContent = news ? news.size : "—";

  let html = "";

  if (players) {
    html += `<section class="formbox"><h3>Players</h3>`;
    html += players.empty ? "No players yet." : players.docs.map(doc => {
      const p = doc.data();
      return `<div class="item">
        <b>${esc(p.name)}</b> · ${esc(p.role)}
        · Jersey ${esc(p.jerseyNo)}
        <br>
        <button class="smallbtn edit-player" data-id="${esc(doc.id)}">EDIT</button>
        ${can("delete") ? `<button class="smallbtn danger delete-record" data-col="players" data-id="${esc(doc.id)}">DELETE</button>` : ""}
      </div>`;
    }).join("");
    html += `</section>`;
  }

  if (matches && can("matches")) {
    html += `<section class="formbox"><h3>Matches</h3>`;
    html += matches.empty ? "No matches yet." : matches.docs.map(doc => {
      const m = doc.data();
      return `<div class="item">
        <b>${esc(m.teamName || "DPPCC")} vs ${esc(m.opponent)}</b>
        · ${esc(m.status)} · ${esc(m.date)}
        <br>
        <button class="smallbtn edit-match" data-id="${esc(doc.id)}">EDIT</button>
        ${can("delete") ? `<button class="smallbtn danger delete-record" data-col="matches" data-id="${esc(doc.id)}">DELETE</button>` : ""}
      </div>`;
    }).join("");
    html += `</section>`;
  }

  if (can("registrations")) {
    const snapshot = await dppccDb.collection("registrations").get();
    html += `<section class="formbox"><h3>Player Registrations</h3>`;
    html += snapshot.empty ? "No registrations yet." : snapshot.docs.map(doc => {
      const r = doc.data();
      return `<div class="item">
        <b>${esc(r.name)}</b> · ${esc(r.status || "Pending")}
        <br>Phone: ${esc(r.phone)} · Age: ${esc(r.age)} · ${esc(r.role)}
        <br>Address: ${esc(r.address)}
        ${r.photoUrl ? `<br><a href="${esc(r.photoUrl)}" target="_blank" rel="noopener">View Photo</a>` : ""}
        <br>
        <button class="smallbtn review-reg" data-id="${esc(doc.id)}" data-status="Approved">APPROVE</button>
        <button class="smallbtn danger review-reg" data-id="${esc(doc.id)}" data-status="Rejected">REJECT</button>
      </div>`;
    }).join("");
    html += `</section>`;
  }

  if (can("jerseyOrders")) {
    const snapshot = await dppccDb.collection("jerseyOrders").get();
    html += `<section class="formbox"><h3>Jersey Orders</h3>`;
    html += snapshot.empty ? "No jersey orders yet." : snapshot.docs.map(doc => {
      const o = doc.data();
      const current = o.status || "Pending";
      return `<div class="item">
        <b>${esc(o.name)}</b> · ${esc(current)}
        <br>Phone: ${esc(o.phone)} · Size: ${esc(o.size)} · No: ${esc(o.number)}
        <label>Order Status</label>
        <select class="order-status" data-id="${esc(doc.id)}">
          ${["Pending","Processing","Completed","Cancelled"].map(s => `<option ${s === current ? "selected" : ""}>${s}</option>`).join("")}
        </select>
      </div>`;
    }).join("");
    html += `</section>`;
  }

  if (news) {
    html += `<section class="formbox"><h3>Published News</h3>`;
    html += news.empty ? "No news yet." : news.docs.map(doc => `
      <div class="item">
        <b>${esc(doc.data().title)}</b><br>${esc(doc.data().body)}
        ${can("delete") ? `<br><button class="smallbtn danger delete-record" data-col="news" data-id="${esc(doc.id)}">DELETE</button>` : ""}
      </div>`).join("");
    html += `</section>`;
  }

  if (can("liveScores")) {
    const scores = await dppccDb.collection("liveScores").get();
    html += `<section class="formbox"><h3>Live Score Updates</h3>`;
    html += scores.empty ? "No live updates yet." : scores.docs.map(doc => {
      const s = doc.data();
      return `<div class="item">
        ${esc(s.matchLabel)} · Innings ${esc(s.innings || 1)}
        · Over ${esc(s.over)}.${esc(s.ball)}
        · ${esc(s.runs)} runs ${s.wicket ? "· WICKET" : ""}
        ${can("delete") ? `<br><button class="smallbtn danger delete-record" data-col="liveScores" data-id="${esc(doc.id)}">DELETE</button>` : ""}
      </div>`;
    }).join("");
    html += `</section>`;
  }

  $("recordsArea").innerHTML = html;

  const selector = $("ballMatch");
  if (selector && matches) {
    selector.innerHTML = '<option value="">Select match</option>' +
      matches.docs.map(doc => {
        const m = doc.data();
        return `<option value="${esc(doc.id)}">${esc(m.teamName || "DPPCC")} vs ${esc(m.opponent)}</option>`;
      }).join("");
  }

  if (can("staff")) await loadStaff();
}

function resetEdit(formId, buttonId, label, cancelId) {
  const form = $(formId);
  form.reset();
  form.elements.docId.value = "";
  $(buttonId).textContent = label;
  $(cancelId).classList.add("hidden");
}

function bindForms() {
  const pf = $("playerForm");

  if (pf) pf.addEventListener("submit", async event => {
    event.preventDefault();
    const f = event.currentTarget;
    const id = f.elements.docId.value;
    const now = stamp();

    const data = {
      name: f.elements.name.value.trim(),
      role: f.elements.role.value,
      jerseyNo: Number(f.elements.jerseyNo.value),
      entryNo: f.elements.entryNo.value.trim(),
      battingStyle: f.elements.battingStyle.value,
      photoUrl: f.elements.photoUrl.value.trim(),
      updatedAt: now,
      updatedBy: activeUser.email
    };

    try {
      if (!data.name || !Number.isInteger(data.jerseyNo) || data.jerseyNo < 0) {
        throw new Error("Check player name and jersey number.");
      }

      if (id) {
        await dppccDb.collection("players").doc(id).update(data);
      } else {
        data.createdAt = stamp();
        data.createdBy = activeUser.email;
        await dppccDb.collection("players").add(data);
      }

      location.reload();
    } catch (error) {
      alert("Player save failed: " + error.message);
    }
  });

  const mf = $("matchForm");

  if (mf) mf.addEventListener("submit", async event => {
    event.preventDefault();
    const f = event.currentTarget;
    const id = f.elements.docId.value;

    const data = {
      teamName: f.elements.teamName.value.trim() || "DPPCC",
      opponent: f.elements.opponent.value.trim(),
      date: f.elements.date.value,
      venue: f.elements.venue.value.trim(),
      status: f.elements.status.value,
      matchType: f.elements.matchType.value,
      overs: Number(f.elements.overs.value),
      result: f.elements.result.value.trim(),
      updatedAt: stamp(),
      updatedBy: activeUser.email
    };

    try {
      if (!data.opponent || !data.date || !data.venue) {
        throw new Error("Opponent, date and venue are required.");
      }

      if (id) {
        await dppccDb.collection("matches").doc(id).update(data);
      } else {
        data.createdAt = stamp();
        data.createdBy = activeUser.email;
        await dppccDb.collection("matches").add(data);
      }

      location.reload();
    } catch (error) {
      alert("Match save failed: " + error.message);
    }
  });

  const bf = $("ballForm");

  if (bf) bf.addEventListener("submit", async event => {
    event.preventDefault();
    const f = event.currentTarget;

    try {
      const matchId = f.elements.matchId.value;
      const matchOption = $("ballMatch").selectedOptions[0];
      if (!matchId || !matchOption) throw new Error("Select a match.");

      const extrasType = f.elements.extrasType.value;
      const data = {
        matchId,
        matchLabel: matchOption.textContent,
        innings: Number(f.elements.innings.value),
        over: Number(f.elements.over.value),
        ball: Number(f.elements.ball.value),
        batter: f.elements.batter.value.trim(),
        bowler: f.elements.bowler.value.trim(),
        runs: Number(f.elements.runs.value),
        extrasType,
        extrasRuns: Number(f.elements.extrasRuns.value || 0),
        wicket: f.elements.wicket.value === "true",
        dismissedPlayer: f.elements.dismissedPlayer.value.trim(),
        commentary: f.elements.commentary.value.trim(),
        legalBall: !["Wide", "No Ball"].includes(extrasType),
        createdAt: stamp(),
        createdBy: activeUser.email
      };

      if (![1,2].includes(data.innings) ||
          !Number.isInteger(data.over) || data.over < 0 ||
          !Number.isInteger(data.ball) || data.ball < 1 || data.ball > 6 ||
          data.runs < 0 || data.runs > 6 ||
          data.extrasRuns < 0 || data.extrasRuns > 10) {
        throw new Error("Check innings, over, ball, runs and extras.");
      }

      await dppccDb.collection("liveScores").add(data);
      await dppccDb.collection("matches").doc(matchId).update({
        status: "Live",
        updatedAt: stamp(),
        updatedBy: activeUser.email
      });

      alert("Ball update published.");
      location.reload();
    } catch (error) {
      alert("Live score failed: " + error.message);
    }
  });

  const nf = $("newsForm");

  if (nf) nf.addEventListener("submit", async event => {
    event.preventDefault();
    const f = event.currentTarget;

    try {
      await dppccDb.collection("news").add({
        title: f.elements.title.value.trim(),
        body: f.elements.body.value.trim(),
        createdAt: stamp(),
        createdBy: activeUser.email
      });
      location.reload();
    } catch (error) {
      alert("News publish failed: " + error.message);
    }
  });

  const sf = $("staffForm");

  if (sf) sf.addEventListener("submit", async event => {
    event.preventDefault();
    const f = event.currentTarget;
    const email = f.elements.email.value.trim().toLowerCase();

    if (email === OWNER_EMAIL) {
      alert("Owner account cannot be changed here.");
      return;
    }

    try {
      const ref = dppccDb.collection("staff").doc(email);
      const old = await ref.get();

      const data = {
        email,
        role: f.elements.role.value,
        active: f.elements.active.value === "true",
        updatedAt: stamp()
      };

      if (!old.exists) data.createdAt = stamp();

      await ref.set(data, { merge: true });
      alert("Staff access saved.");
      await loadStaff();
      f.reset();
    } catch (error) {
      alert("Staff save failed: " + error.message);
    }
  });

  $("backupButton")?.addEventListener("click", downloadBackup);

  $("cancelPlayer")?.addEventListener("click", () =>
    resetEdit("playerForm", "playerSubmit", "ADD PLAYER", "cancelPlayer")
  );

  $("cancelMatch")?.addEventListener("click", () =>
    resetEdit("matchForm", "matchSubmit", "ADD MATCH", "cancelMatch")
  );
}

async function downloadBackup() {
  const collections = [
    "staff", "players", "matches", "registrations",
    "jerseyOrders", "liveScores", "news"
  ];

  try {
    const result = {
      project: "dppcc-official",
      createdAt: new Date().toISOString(),
      collections: {}
    };

    for (const name of collections) {
      const snapshot = await dppccDb.collection(name).get();
      result.collections[name] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `DPPCC-backup-${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    alert("Backup failed: " + error.message);
  }
}

document.addEventListener("click", async event => {
  const button = event.target.closest("button");
  if (!button) return;

  try {
    if (button.matches(".delete-record") && can("delete")) {
      const collection = button.dataset.col;
      const allowed = ["players","matches","news","liveScores"];
      if (!allowed.includes(collection)) return;
      if (!confirm("Permanently delete this record?")) return;

      await dppccDb.collection(collection).doc(button.dataset.id).delete();
      location.reload();
    }

    if (button.matches(".review-reg") && can("registrations")) {
      await dppccDb.collection("registrations").doc(button.dataset.id).update({
        status: button.dataset.status,
        reviewedAt: stamp(),
        reviewedBy: activeUser.email
      });
      location.reload();
    }

    if (button.matches(".edit-player") && can("players")) {
      const snapshot = await dppccDb.collection("players").doc(button.dataset.id).get();
      if (!snapshot.exists) return;

      const p = snapshot.data();
      const f = $("playerForm");
      f.elements.docId.value = snapshot.id;
      f.elements.name.value = p.name || "";
      f.elements.role.value = p.role || "Batsman";
      f.elements.jerseyNo.value = p.jerseyNo ?? "";
      f.elements.entryNo.value = p.entryNo || "";
      f.elements.battingStyle.value = p.battingStyle || "Right-hand";
      f.elements.photoUrl.value = p.photoUrl || "";
      $("playerSubmit").textContent = "SAVE PLAYER";
      $("cancelPlayer").classList.remove("hidden");
      f.scrollIntoView({behavior:"smooth"});
    }

    if (button.matches(".edit-match") && can("matches")) {
      const snapshot = await dppccDb.collection("matches").doc(button.dataset.id).get();
      if (!snapshot.exists) return;

      const m = snapshot.data();
      const f = $("matchForm");
      f.elements.docId.value = snapshot.id;
      f.elements.teamName.value = m.teamName || "DPPCC";
      f.elements.opponent.value = m.opponent || "";
      f.elements.date.value = m.date || "";
      f.elements.venue.value = m.venue || "";
      f.elements.status.value = m.status || "Upcoming";
      f.elements.matchType.value = m.matchType || "Friendly";
      f.elements.overs.value = m.overs || 20;
      f.elements.result.value = m.result || "";
      $("matchSubmit").textContent = "SAVE MATCH";
      $("cancelMatch").classList.remove("hidden");
      f.scrollIntoView({behavior:"smooth"});
    }
  } catch (error) {
    alert(error.message);
  }
});

document.addEventListener("change", async event => {
  if (event.target.matches(".order-status") && can("jerseyOrders")) {
    try {
      await dppccDb.collection("jerseyOrders").doc(event.target.dataset.id).update({
        status: event.target.value,
        statusUpdatedAt: stamp(),
        statusUpdatedBy: activeUser.email
      });
      alert("Jersey order status updated.");
    } catch (error) {
      alert(error.message);
    }
  }
});

$("logoutButton")?.addEventListener("click", async () => {
  await dppccAuth.signOut();
  location.replace("login.html");
});

dppccAuth.onAuthStateChanged(async user => {
  if (!user) {
    location.replace("login.html");
    return;
  }

  activeUser = user;

  try {
    const actualRole = await getRole(user);

    if (actualRole !== role) {
      await dppccAuth.signOut();
      location.replace("login.html");
      return;
    }

    showStatus("Access verified. Signed in as " + role + ".");
    $("dashboardContent").classList.remove("hidden");
    $("welcomeText").textContent =
      "Welcome, " + user.email + ". Your access level: " + role + ".";

    buildForms();
    bindForms();
    await loadRecords();

  } catch (error) {
    console.error(error);
    showStatus(
      "Access verification failed. Check Firestore Rules and staff assignment.",
      true
    );
  }
});
