
/* DPPCC — Complete Staff Dashboard
   Roles: Owner, Admin, Manager, Captain
*/

(() => {
  "use strict";

  const OWNER_EMAIL = "dungsreepaschimparacricketclub@gmail.com";
  const $ = (id) => document.getElementById(id);

  const auth = window.dppccAuth;
  const db = window.dppccDb;
  const pageRole = document.body.dataset.role || "";

  if (!auth || !db) {
    const message = $("accessMessage");
    if (message) message.textContent = "Firebase connection is missing.";
    return;
  }

  let currentUser = null;
  let currentRole = null;

  const escapeHTML = (value = "") =>
    String(value).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#039;"
    })[c]);

  const showMessage = (message, error = false) => {
    const box = $("dashboardNotice") || $("accessMessage");
    if (!box) return;
    box.textContent = message;
    box.style.color = error ? "#b42318" : "#176b37";
  };

  const setHTML = (id, html) => {
    const element = $(id);
    if (element) element.innerHTML = html;
  };

  const button = (label, action, danger = false) =>
    `<button type="button" data-action="${action}" ${danger ? 'class="danger"' : ""}>${label}</button>`;

  function logoutButton() {
    let btn = $("logoutButton");
    if (!btn) {
      btn = document.createElement("button");
      btn.id = "logoutButton";
      btn.type = "button";
      btn.textContent = "LOG OUT";
      btn.style.cssText =
        "margin:12px 0;padding:11px 20px;border:0;border-radius:7px;background:#b42318;color:white;font-weight:bold;cursor:pointer";
      $("welcomeText")?.insertAdjacentElement("afterend", btn);
    }

    btn.onclick = async () => {
      btn.disabled = true;
      try {
        await auth.signOut();
        location.replace("login.html");
      } catch (error) {
        btn.disabled = false;
        alert("Logout failed: " + error.message);
      }
    };
  }

  async function getRole(user) {
    const email = (user.email || "").trim().toLowerCase();
    if (email === OWNER_EMAIL) return "Owner";

    const staffDoc = await db.collection("staff").doc(email).get();
    if (!staffDoc.exists) return null;

    const staff = staffDoc.data();
    if (
      staff.active !== true ||
      String(staff.email || "").toLowerCase() !== email ||
      !["Admin", "Manager", "Captain"].includes(staff.role)
    ) return null;

    return staff.role;
  }

  function permissions(role) {
    return {
      staff: role === "Owner",
      players: ["Owner", "Admin", "Captain"].includes(role),
      matches: ["Owner", "Manager"].includes(role),
      news: ["Owner", "Admin"].includes(role),
      scoring: ["Owner", "Captain"].includes(role),
      applications: ["Owner", "Manager"].includes(role),
      jerseys: ["Owner", "Manager"].includes(role)
    };
  }

  function renderNavigation(role) {
    const p = permissions(role);
    const links = [];

    if (p.staff) links.push(["Staff Management", "staff"]);
    if (p.players) links.push(["Players", "players.html"]);
    if (p.matches) links.push(["Matches", "matches.html"]);
    if (p.scoring) links.push(["Live Scoring", "match-centre.html"]);
    if (p.news) links.push(["News", "news.html"]);
    if (p.applications) links.push(["Player Applications", "applications"]);
    if (p.jerseys) links.push(["Jersey Orders", "jerseys"]);

    setHTML("formsArea", `
      <section class="formbox">
        <h3>${escapeHTML(role)} Quick Actions</h3>
        <div class="dashboard-actions">
          ${links.map(([label, target]) =>
            target.endsWith(".html")
              ? `<a class="btn dark" href="${target}">${label}</a>`
              : `<button type="button" data-open="${target}">${label}</button>`
          ).join("")}
        </div>
      </section>
    `);

    document.querySelectorAll("[data-open]").forEach((el) => {
      el.addEventListener("click", () => {
        const target = el.dataset.open;
        if (target === "staff") loadStaff();
        if (target === "applications") loadApplications();
        if (target === "jerseys") loadJerseys();
      });
    });
  }

  async function loadStats() {
    const collections = ["players", "matches", "news"];
    const ids = ["statPlayers", "statMatches", "statNews"];

    await Promise.all(collections.map(async (name, index) => {
      try {
        const snap = await db.collection(name).get();
        if ($(ids[index])) $(ids[index]).textContent = snap.size;
      } catch (error) {
        if ($(ids[index])) $(ids[index]).textContent = "—";
        console.error("Statistics error:", name, error);
      }
    }));
  }

  async function loadStaff() {
    if (currentRole !== "Owner") return;

    setHTML("recordsArea", `
      <section class="formbox">
        <h3>Add / Manage Staff Members</h3>
        <form id="staffForm">
          <label>Staff Email</label>
          <input id="staffMemberEmail" type="email" required maxlength="120">
          <label>Role</label>
          <select id="staffMemberRole" required>
            <option value="Admin">Admin</option>
            <option value="Manager">Manager</option>
            <option value="Captain">Captain</option>
          </select>
          <label>
            <input id="staffMemberActive" type="checkbox" checked>
            Active Staff Member
          </label>
          <button type="submit">SAVE STAFF MEMBER</button>
          <p id="staffNotice" aria-live="polite"></p>
        </form>
        <p>Note: This creates the staff permission record. The person must also have a Firebase Authentication account with this email.</p>
        <div id="staffList">Loading staff...</div>
      </section>
    `);

    $("staffForm")?.addEventListener("submit", saveStaff);
    await refreshStaff();
  }

  async function saveStaff(event) {
    event.preventDefault();
    if (currentRole !== "Owner") return;

    const email = $("staffMemberEmail").value.trim().toLowerCase();
    const role = $("staffMemberRole").value;
    const active = $("staffMemberActive").checked;

    if (!email || email === OWNER_EMAIL) {
      $("staffNotice").textContent = "Enter a valid staff email. Owner email cannot be added as staff.";
      return;
    }

    try {
      await db.collection("staff").doc(email).set({
        email,
        role,
        active,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });

      $("staffNotice").textContent = "Staff permission saved.";
      $("staffForm").reset();
      $("staffMemberActive").checked = true;
      await refreshStaff();
    } catch (error) {
      $("staffNotice").textContent = "Could not save staff: " + error.message;
    }
  }

  async function refreshStaff() {
    const list = $("staffList");
    if (!list || currentRole !== "Owner") return;

    try {
      const snap = await db.collection("staff").get();
      if (snap.empty) {
        list.innerHTML = "<p>No staff members added yet.</p>";
        return;
      }

      list.innerHTML = snap.docs.map((doc) => {
        const staff = doc.data();
        return `
          <article class="item">
            <b>${escapeHTML(staff.email || doc.id)}</b>
            <p>Role: ${escapeHTML(staff.role || "—")}</p>
            <p>Status: ${staff.active === true ? "Active" : "Inactive"}</p>
            <button type="button" data-staff-role="${escapeHTML(doc.id)}">Change Role</button>
            <button type="button" data-staff-active="${escapeHTML(doc.id)}" data-active="${staff.active === true ? "true" : "false"}">
              ${staff.active === true ? "Deactivate" : "Activate"}
            </button>
            <button type="button" class="danger" data-staff-delete="${escapeHTML(doc.id)}">Remove</button>
          </article>
        `;
      }).join("");

      list.querySelectorAll("[data-staff-role]").forEach((btn) => {
        btn.onclick = async () => {
          const newRole = prompt("Enter new role: Admin, Manager, or Captain");
          if (!["Admin", "Manager", "Captain"].includes(newRole)) return;
          try {
            await db.collection("staff").doc(btn.dataset.staffRole).update({
              role: newRole,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await refreshStaff();
          } catch (error) { alert(error.message); }
        };
      });

      list.querySelectorAll("[data-staff-active]").forEach((btn) => {
        btn.onclick = async () => {
          try {
            await db.collection("staff").doc(btn.dataset.staffActive).update({
              active: btn.dataset.active !== "true",
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await refreshStaff();
          } catch (error) { alert(error.message); }
        };
      });

      list.querySelectorAll("[data-staff-delete]").forEach((btn) => {
        btn.onclick = async () => {
          if (!confirm("Remove this staff permission?")) return;
          try {
            await db.collection("staff").doc(btn.dataset.staffDelete).delete();
            await refreshStaff();
          } catch (error) { alert(error.message); }
        };
      });
    } catch (error) {
      list.textContent = "Could not load staff: " + error.message;
    }
  }

  async function loadApplications() {
    if (!permissions(currentRole).applications) return;
    setHTML("recordsArea", `
      <section class="formbox">
        <h3>Player Applications</h3>
        <div id="applicationList">Loading applications...</div>
      </section>
    `);

    const list = $("applicationList");
    try {
      const snap = await db.collection("registrations").get();
      if (snap.empty) {
        list.textContent = "No applications received.";
        return;
      }

      list.innerHTML = snap.docs.map((doc) => {
        const a = doc.data();
        return `
          <article class="item">
            <b>${escapeHTML(a.name)}</b>
            <p>Phone: ${escapeHTML(a.phone)}</p>
            <p>Age: ${escapeHTML(a.age)}</p>
            <p>Role: ${escapeHTML(a.role)}</p>
            <p>Address: ${escapeHTML(a.address)}</p>
            <p>Status: ${escapeHTML(a.status || "Pending")}</p>
            ${a.photoUrl ? `<p><a href="${escapeHTML(a.photoUrl)}" target="_blank" rel="noopener">View Photo</a></p>` : ""}
            ${["Pending", "Approved", "Rejected"].includes(a.status || "Pending") ? `
              <button data-app-id="${doc.id}" data-app-status="Approved">Approve</button>
              <button class="danger" data-app-id="${doc.id}" data-app-status="Rejected">Reject</button>
            ` : ""}
          </article>
        `;
      }).join("");

      list.querySelectorAll("[data-app-id]").forEach((btn) => {
        btn.onclick = async () => {
          try {
            await db.collection("registrations").doc(btn.dataset.appId).update({
              status: btn.dataset.appStatus,
              reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
              reviewedBy: currentUser.email
            });
            await loadApplications();
          } catch (error) { alert("Update failed: " + error.message); }
        };
      });
    } catch (error) {
      list.textContent = "Could not load applications: " + error.message;
    }
  }

  async function loadJerseys() {
    if (!permissions(currentRole).jerseys) return;
    setHTML("recordsArea", `
      <section class="formbox">
        <h3>Jersey Orders</h3>
        <div id="jerseyList">Loading orders...</div>
      </section>
    `);

    const list = $("jerseyList");
    try {
      const snap = await db.collection("jerseyOrders").get();
      if (snap.empty) {
        list.textContent = "No jersey orders received.";
        return;
      }

      list.innerHTML = snap.docs.map((doc) => {
        const order = doc.data();
        return `
          <article class="item">
            <b>${escapeHTML(order.name)}</b>
            <p>Phone: ${escapeHTML(order.phone)}</p>
            <p>Size: ${escapeHTML(order.size)}</p>
            <p>Jersey Number: ${escapeHTML(order.number)}</p>
            <p>Status: ${escapeHTML(order.status || "Pending")}</p>
            <label>Update Order Status</label>
            <select data-jersey-status="${doc.id}">
              ${["Pending", "Processing", "Completed", "Cancelled"].map(s =>
                `<option value="${s}" ${s === (order.status || "Pending") ? "selected" : ""}>${s}</option>`
              ).join("")}
            </select>
            <button data-jersey-save="${doc.id}">SAVE STATUS</button>
          </article>
        `;
      }).join("");

      list.querySelectorAll("[data-jersey-save]").forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.dataset.jerseySave;
          const status = list.querySelector(`[data-jersey-status="${id}"]`).value;
          try {
            await db.collection("jerseyOrders").doc(id).update({
              status,
              statusUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
              statusUpdatedBy: currentUser.email
            });
            alert("Jersey order status updated.");
            await loadJerseys();
          } catch (error) { alert("Update failed: " + error.message); }
        };
      });
    } catch (error) {
      list.textContent = "Could not load jersey orders: " + error.message;
    }
  }

  auth.onAuthStateChanged(async (user) => {
    currentUser = user || null;
    currentRole = null;

    if (!user) {
      location.replace("login.html");
      return;
    }

    try {
      currentRole = await getRole(user);

      if (!currentRole || currentRole !== pageRole) {
        $("accessMessage").textContent =
          "Access denied. This account is not authorized for this dashboard.";
        $("dashboardContent")?.classList.add("hidden");
        return;
      }

      $("accessMessage").textContent = "Access verified.";
      $("dashboardContent")?.classList.remove("hidden");
      if ($("welcomeText")) {
        $("welcomeText").textContent =
          `Welcome ${user.email} — ${currentRole} Dashboard`;
      }

      logoutButton();
      renderNavigation(currentRole);
      await loadStats();
    } catch (error) {
      $("accessMessage").textContent =
        "Could not verify access: " + error.message;
    }
  });
})();
