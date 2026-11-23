
"use strict";

const $ = id => document.getElementById(id);

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;"
}[c]));

const role = document.body.dataset.role;
let activeUser = null;

const caps = {
  Owner: [
    "players", "matches", "liveScores", "news",
    "registrations", "jerseyOrders", "staff",
    "delete", "backup"
  ],
  Admin: ["players", "news"],
  Manager: ["matches", "registrations", "jerseyOrders"],
  Captain: ["players", "liveScores"]
};

const can = permission => caps[role]?.includes(permission);

function status(message, bad = false) {
  const e = $("accessMessage");
  e.textContent = message;
  e.classList.remove("hidden");
  e.style.background = bad ? "#ffe5e5" : "#e5f7eb";
  e.style.color = bad ? "#9b1717" : "#14532d";
}

function field(label, name, type = "text", extra = "") {
  return `<label>${label}</label>
  <input name="${name}" type="${type}" ${extra} required>`;
}

function buildForms() {
  let h = "";

  if (can("players")) {
    h += `
    <div class="formbox">
      <h3>Add / Edit Player</h3>
      <form id="playerForm">
        <input type="hidden" name="docId">
        ${field("Player Name", "name", "text", 'maxlength="70"')}
        <label>Playing Role</label>
        <select name="role">
          <option>Batsman</option>
          <option>Bowler</option>
          <option>All-Rounder</option>
          <option>Wicket Keeper</option>
        </select>
        ${field("Jersey Number", "jerseyNo", "number", 'min="0" max="999"')}
        <label>Player Photo URL</label>
        <input name="photoUrl" type="url" placeholder="https://...">
        <button id="playerSubmit">ADD PLAYER</button>
        <button type="button" id="cancelPlayer" class="secondary hidden">CANCEL EDIT</button>
      </form>
    </div>`;
  }

  if (can("matches")) {
    h += `
    <div class="formbox">
      <h3>Add / Edit Match</h3>
      <form id="matchForm">
        <input type="hidden" name="docId">
        ${field("Opponent Team", "opponent", "text", 'maxlength="70"')}
        ${field("Match Date", "date", "date")}
        ${field("Venue", "venue", "text", 'maxlength="100"')}
        <label>Match Status</label>
        <select name="status">
          <option>Upcoming</option>
          <option>Live</option>
          <option>Completed</option>
        </select>
        <label>Score / Result</label>
        <input name="result" maxlength="150">
        <button id="matchSubmit">ADD MATCH</button>
        <button type="button" id="cancelMatch" class="secondary hidden">CANCEL EDIT</button>
      </form>
    </div>`;
  }

  if (can("liveScores")) {
    h += `
    <div class="formbox">
      <h3>Add Ball-by-Ball Update</h3>
      <form id="ballForm">
        <label>Match</label>
        <select name="matchId" id="ballMatch" required>
          <option value="">Select match</option>
        </select>
        ${field("Over", "over", "number", 'min="0" max="99"')}
        ${field("Ball (1–6)", "ball", "number", 'min="1" max="6"')}
        ${field("Runs", "runs", "number", 'min="0" max="6"')}
        <label>Wicket?</label>
        <select name="wicket">
          <option value="false">No</option>
          <option value="true">Yes</option>
        </select>
        <label>Commentary</label>
        <input name="commentary" maxlength="180">
        <button>POST BALL UPDATE</button>
      </form>
    </div>`;
  }

  if (can("news")) {
    h += `
    <div class="formbox">
      <h3>Publish News</h3>
      <form id="newsForm">
        ${field("Headline", "title", "text", 'maxlength="100"')}
        <label>Details</label>
        <textarea name="body" maxlength="1000" required></textarea>
        <button>PUBLISH NEWS</button>
      </form>
    </div>`;
  }

  if (can("staff")) {
    h += `
    <div class="formbox">
      <h3>Staff Role Management</h3>
      <div class="notice">
        Create staff accounts first in Firebase Authentication.
        Then enter their UID and email.
      </div>
      <form id="staffForm">
        ${field("Firebase Authentication UID", "uid", "text", 'maxlength="128"')}
        ${field("Staff Email", "email", "email")}
        <label>Role</label>
        <select name="role">
          <option>Admin</option>
          <option>Captain</option>
          <option>Manager</option>
        </select>
        <label>Account Status</label>
        <select name="active">
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
        <button>SAVE STAFF ACCESS</button>
      </form>
      <div id="staffList">Loading staff...</div>
    </div>`;
  }

  if (can("backup")) {
    h += `
    <div class="formbox">
      <h3>Owner Data Backup</h3>
      <p>Download JSON backup of club data.</p>
      <button id="backupButton">DOWNLOAD BACKUP</button>
    </div>`;
  }

  $("formsArea").innerHTML = h;
}

async function getRole(user) {
  if ((user.email || "").toLowerCase() === OWNER_EMAIL.toLowerCase()) {
    return "Owner";
  }

  const d = await dppccDb.collection("staff").doc(user.uid).get();

  if (!d.exists || d.data().active !== true) return null;

  return d.data().role;
}

async function countAndLoad() {
  const [ps, ms, ns] = await Promise.all([
    can("players") ? dppccDb.collection("players").get() : null,
    can("matches") ? dppccDb.collection("matches").get() : null,
    can("news") ? dppccDb.collection("news").get() : null
  ]);

  $("statPlayers").textContent = ps ? ps.size : "—";
  $("statMatches").textContent = ms ? ms.size : "—";
  $("statNews").textContent = ns ? ns.size : "—";

  let out = "";

  if (can("players")) {
    out += `
    <section class="formbox">
      <h3>Players</h3>
      ${ps.empty ? "No players yet." : ps.docs.map(d => {
        const p = d.data();
        return `
        <div class="item">
          <b>${esc(p.name)}</b> · ${esc(p.role)}
          · Jersey ${esc(p.jerseyNo ?? p.jerseyNumber ?? "")}
          <br>
          <button class="smallbtn edit-player" data-id="${esc(d.id)}">EDIT</button>
          ${can("delete") ? `
          <button class="smallbtn danger delete-record"
            data-col="players" data-id="${esc(d.id)}">DELETE</button>` : ""}
        </div>`;
      }).join("")}
    </section>`;
  }

  if (can("matches")) {
    out += `
    <section class="formbox">
      <h3>Matches</h3>
      ${ms.empty ? "No matches yet." : ms.docs.map(d => {
        const m = d.data();
        return `
        <div class="item">
          <b>DPPCC vs ${esc(m.opponent)}</b>
          · ${esc(m.status)} · ${esc(m.date)}
          <br>
          <button class="smallbtn edit-match" data-id="${esc(d.id)}">EDIT</button>
          ${can("delete") ? `
          <button class="smallbtn danger delete-record"
            data-col="matches" data-id="${esc(d.id)}">DELETE</button>` : ""}
        </div>`;
      }).join("")}
    </section>`;
  }

  if (can("registrations")) {
    const rs = await dppccDb.collection("registrations").get();

    out += `
    <section class="formbox">
      <h3>Player Registrations</h3>
      ${rs.empty ? "No registrations yet." : rs.docs.map(d => {
        const r = d.data();
        return `
        <div class="item">
          <b>${esc(r.name)}</b> · ${esc(r.status || "Pending")}
          <br>
          Phone: ${esc(r.phone)} · Age: ${esc(r.age)} · ${esc(r.role)}
          <br>
          Address: ${esc(r.address)}
          <br>
          <button class="smallbtn review-reg" data-id="${esc(d.id)}"
            data-status="Approved">APPROVE</button>
          <button class="smallbtn danger review-reg" data-id="${esc(d.id)}"
            data-status="Rejected">REJECT</button>
        </div>`;
      }).join("")}
    </section>`;
  }

  if (can("jerseyOrders")) {
    const os = await dppccDb.collection("jerseyOrders").get();

    out += `
    <section class="formbox">
      <h3>Jersey Orders</h3>
      ${os.empty ? "No jersey orders yet." : os.docs.map(d => {
        const o = d.data();
        return `
        <div class="item">
          <b>${esc(o.name)}</b> · ${esc(o.status || "Pending")}
          <br>
          Phone: ${esc(o.phone)} · Size: ${esc(o.size)} · No: ${esc(o.number)}
          <label>Order Status</label>
          <select class="order-status" data-id="${esc(d.id)}">
            <option ${o.status === "Pending" ? "selected" : ""}>Pending</option>
            <option ${o.status === "Processing" ? "selected" : ""}>Processing</option>
            <option ${o.status === "Completed" ? "selected" : ""}>Completed</option>
            <option ${o.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
          </select>
        </div>`;
      }).join("")}
    </section>`;
  }

  if (can("news")) {
    out += `
    <section class="formbox">
      <h3>Published News</h3>
      ${ns.empty ? "No news yet." : ns.docs.map(d => `
        <div class="item">
          <b>${esc(d.data().title)}</b><br>
          ${esc(d.data().body)}
          ${can("delete") ? `
          <br><button class="smallbtn danger delete-record"
            data-col="news" data-id="${esc(d.id)}">DELETE</button>` : ""}
        </div>`).join("")}
    </section>`;
  }

  if (can("liveScores")) {
    const ls = await dppccDb.collection("liveScores").get();

    out += `
    <section class="formbox">
      <h3>Live Score Updates</h3>
      ${ls.empty ? "No live updates yet." : ls.docs.map(d => {
        const x = d.data();
        return `
        <div class="item">
          ${esc(x.matchLabel)} · Over ${esc(x.over)}.${esc(x.ball)}
          · ${esc(x.runs)} runs ${x.wicket ? "· WICKET" : ""}
          ${can("delete") ? `
          <br><button class="smallbtn danger delete-record"
            data-col="liveScores" data-id="${esc(d.id)}">DELETE</button>` : ""}
        </div>`;
      }).join("")}
    </section>`;
  }

  $("recordsArea").innerHTML = out;

  const matchSel = $("ballMatch");
  if (matchSel && ms) {
    matchSel.innerHTML =
      '<option value="">Select match</option>' +
      ms.docs.map(d => `
        <option value="${esc(d.id)}">DPPCC vs ${esc(d.data().opponent)}</option>
      `).join("");
  }

  if (can("staff")) await loadStaff();
}

async function loadStaff() {
  const box = $("staffList");

  try {
    const s = await dppccDb.collection("staff").get();

    box.innerHTML = s.empty ? "No staff roles assigned yet." :
      s.docs.map(d => {
        const x = d.data();
        return `
        <div class="item">
          <b>${esc(x.email || d.id)}</b> · ${esc(x.role)}
          · ${x.active ? "Active" : "Inactive"}
          <br><small>UID: ${esc(d.id)}</small>
        </div>`;
      }).join("");
  } catch (e) {
    box.textContent = "Could not load staff list: " + e.message;
  }
}

function resetForm(id, submitId, label) {
  const f = $(id);
  f.reset();
  f.elements.docId.value = "";
  $(submitId).textContent = label;

  const c = id === "playerForm" ? "cancelPlayer" : "cancelMatch";
  $(c).classList.add("hidden");
}

function bindForms() {
  const pf = $("playerForm");

  if (pf) pf.addEventListener("submit", async e => {
    e.preventDefault();

    const f = e.target;
    const id = f.elements.docId.value;

    const data = {
      name: f.elements.name.value.trim(),
      role: f.elements.role.value,
      jerseyNo: Number(f.elements.jerseyNo.value),
      photoUrl: /^https:\/\//i.test(f.elements.photoUrl.value)
        ? f.elements.photoUrl.value : ""
    };

    try {
      if (id) {
        await dppccDb.collection("players").doc(id).update(data);
      } else {
        await dppccDb.collection("players").add(data);
      }
      location.reload();
    } catch (x) {
      alert("Player save failed: " + x.message);
    }
  });

  const mf = $("matchForm");

  if (mf) mf.addEventListener("submit", async e => {
    e.preventDefault();

    const f = e.target;
    const id = f.elements.docId.value;

    const data = {
      opponent: f.elements.opponent.value.trim(),
      date: f.elements.date.value,
      venue: f.elements.venue.value.trim(),
      status: f.elements.status.value,
      result: f.elements.result.value.trim()
    };

    try {
      if (id) {
        await dppccDb.collection("matches").doc(id).update(data);
      } else {
        await dppccDb.collection("matches").add(data);
      }
      location.reload();
    } catch (x) {
      alert("Match save failed: " + x.message);
    }
  });

  const bf = $("ballForm");

  if (bf) bf.addEventListener("submit", async e => {
    e.preventDefault();

    const f = e.target;

    try {
      await dppccDb.collection("liveScores").add({
        matchId: f.elements.matchId.value,
        matchLabel: $("ballMatch").selectedOptions[0].text,
        over: Number(f.elements.over.value),
        ball: Number(f.elements.ball.value),
        runs: Number(f.elements.runs.value),
        wicket: f.elements.wicket.value === "true",
        commentary: f.elements.commentary.value.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: activeUser.email
      });

      alert("Ball update published.");
      f.reset();
    } catch (x) {
      alert("Live score update failed: " + x.message);
    }
  });

  const nf = $("newsForm");

  if (nf) nf.addEventListener("submit", async e => {
    e.preventDefault();

    const f = e.target;

    try {
      await dppccDb.collection("news").add({
        title: f.elements.title.value.trim(),
        body: f.elements.body.value.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: activeUser.email
      });

      alert("News published.");
      location.reload();
    } catch (x) {
      alert("News publish failed: " + x.message);
    }
  });

  const sf = $("staffForm");

  if (sf) sf.addEventListener("submit", async e => {
    e.preventDefault();

    const f = e.target;
    const uid = f.elements.uid.value.trim();
    const email = f.elements.email.value.trim().toLowerCase();

    if (!uid || !email) return;

    try {
      await dppccDb.collection("staff").doc(uid).set({
        email,
        role: f.elements.role.value,
        active: f.elements.active.value === "true",
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      alert("Staff access saved.");
      await loadStaff();
      f.reset();
    } catch (x) {
      alert("Staff role save failed: " + x.message);
    }
  });

  const backup = $("backupButton");

  if (backup) backup.addEventListener("click", async () => {
    const cols = [
      "players", "matches", "registrations",
      "jerseyOrders", "news", "liveScores", "staff"
    ];

    const data = {
      project: "dppcc-official",
      createdAt: new Date().toISOString(),
      collections: {}
    };

    try {
      for (const c of cols) {
        const s = await dppccDb.collection(c).get();
        data.collections[c] = s.docs.map(d => ({
          id: d.id,
          ...d.data()
        }));
      }

      const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");

      a.href = url;
      a.download = "DPPCC-backup-" +
        new Date().toISOString().slice(0, 10) + ".json";

      a.click();
      URL.revokeObjectURL(url);
    } catch (x) {
      alert("Backup failed: " + x.message);
    }
  });

  $("cancelPlayer")?.addEventListener("click", () =>
    resetForm("playerForm", "playerSubmit", "ADD PLAYER")
  );

  $("cancelMatch")?.addEventListener("click", () =>
    resetForm("matchForm", "matchSubmit", "ADD MATCH")
  );
}

document.addEventListener("click", async e => {
  const del = e.target.closest(".delete-record");

  if (del && can("delete")) {
    const col = del.dataset.col;

    if (![
      "players", "matches", "registrations",
      "jerseyOrders", "news", "liveScores"
    ].includes(col)) return;

    if (confirm("Permanently delete this record?")) {
      try {
        await dppccDb.collection(col).doc(del.dataset.id).delete();
        location.reload();
      } catch (x) {
        alert(x.message);
      }
    }
  }

  const rev = e.target.closest(".review-reg");

  if (rev && can("registrations")) {
    try {
      await dppccDb.collection("registrations")
        .doc(rev.dataset.id)
        .update({
          status: rev.dataset.status,
          reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
          reviewedBy: activeUser.email
        });

      location.reload();
    } catch (x) {
      alert(x.message);
    }
  }

  const ep = e.target.closest(".edit-player");

  if (ep && can("players")) {
    const d = await dppccDb.collection("players").doc(ep.dataset.id).get();
    if (!d.exists) return;

    const f = $("playerForm");
    const p = d.data();

    f.elements.docId.value = d.id;
    f.elements.name.value = p.name || "";
    f.elements.role.value = p.role || "Batsman";
    f.elements.jerseyNo.value = p.jerseyNo ?? p.jerseyNumber ?? "";
    f.elements.photoUrl.value = p.photoUrl || "";

    $("playerSubmit").textContent = "SAVE PLAYER";
    $("cancelPlayer").classList.remove("hidden");
    f.scrollIntoView({ behavior: "smooth" });
  }

  const em = e.target.closest(".edit-match");

  if (em && can("matches")) {
    const d = await dppccDb.collection("matches").doc(em.dataset.id).get();
    if (!d.exists) return;

    const f = $("matchForm");
    const m = d.data();

    f.elements.docId.value = d.id;
    f.elements.opponent.value = m.opponent || "";
    f.elements.date.value = m.date || m.matchDate || "";
    f.elements.venue.value = m.venue || "";
    f.elements.status.value = m.status || "Upcoming";
    f.elements.result.value = m.result || m.score || "";

    $("matchSubmit").textContent = "SAVE MATCH";
    $("cancelMatch").classList.remove("hidden");
    f.scrollIntoView({ behavior: "smooth" });
  }
});

document.addEventListener("change", async e => {
  if (e.target.matches(".order-status") && can("jerseyOrders")) {
    try {
      await dppccDb.collection("jerseyOrders")
        .doc(e.target.dataset.id)
        .update({
          status: e.target.value,
          statusUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          statusUpdatedBy: activeUser.email
        });

      alert("Order status updated.");
    } catch (x) {
      alert(x.message);
    }
  }
});

$("logoutButton").addEventListener("click", () => {
  dppccAuth.signOut().then(() => location.replace("login.html"));
});

dppccAuth.onAuthStateChanged(async user => {
  if (!user) {
    location.replace("login.html");
    return;
  }

  activeUser = user;

  try {
    const actual = await getRole(user);

    if (actual !== role) {
      await dppccAuth.signOut();
      location.replace("login.html");
      return;
    }

    status("Access verified. You are signed in as " + role + ".");

    $("dashboardContent").classList.remove("hidden");

    $("welcomeText").textContent =
      "Welcome, " + (user.email || "staff member") +
      ". Your access level: " + role + ".";

    buildForms();
    bindForms();

    await countAndLoad();

  } catch (e) {
    console.error(e);
    status(
      "Could not verify access. Check Firestore Rules and staff assignment.",
      true
    );
  }
});
