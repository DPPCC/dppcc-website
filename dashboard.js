"use strict";

const $ = id => document.getElementById(id);

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

const valueOf = (form, name) =>
  form.elements.namedItem(name)?.value ?? "";

const pageRole = document.body.dataset.role;

let role = pageRole;
let currentUser = null;

/* Logout button */
if (!$("logoutButton") && $("welcomeText")) {
  const logout = document.createElement("button");

  logout.id = "logoutButton";
  logout.type = "button";
  logout.textContent = "LOG OUT";
  logout.style.margin = "0 0 16px";

  $("welcomeText").insertAdjacentElement(
    "afterend",
    logout
  );
}

/* Role permissions */
const permissions = {
  Owner: [
    "players",
    "matches",
    "live",
    "news",
    "submissions",
    "owner"
  ],

  Admin: [
    "players",
    "news"
  ],

  Manager: [
    "matches",
    "submissions"
  ],

  Captain: [
    "players",
    "live"
  ]
};

const can = permission =>
  (permissions[role] || []).includes(permission);

function applyPermissions() {
  document.querySelectorAll("[data-permission]").forEach(element => {
    element.classList.toggle(
      "hidden",
      !can(element.dataset.permission)
    );
  });
}

applyPermissions();

/* Dashboard message */
function setNotice(message, isError = false) {
  const box = $("accessMessage");

  if (!box) return;

  box.textContent = message;

  box.style.background = isError
    ? "#ffe5e5"
    : "#e5f7eb";

  box.style.color = isError
    ? "#9b1717"
    : "#14532d";
}

/* Add Entry Number, Batting Style and Photo Upload fields */
function addPlayerExtraFields(form) {
  if (!form || form.dataset.extraFieldsReady === "true") {
    return;
  }

  const photoUrl = form.elements.namedItem("photoUrl");
  const photoLabel = photoUrl?.previousElementSibling;

  if (!photoUrl || !photoLabel) return;

  const fields = [
    {
      name: "entryNo",
      label: "Entry Number (e.g. 07 or 9th)",
      max: 20
    },
    {
      name: "battingStyle",
      label: "Batting Style (e.g. Right-hand / Left-hand)",
      max: 40
    }
  ];

  fields.forEach(field => {
    if (form.elements.namedItem(field.name)) return;

    const label = document.createElement("label");
    label.textContent = field.label;

    const input = document.createElement("input");
    input.name = field.name;
    input.type = "text";
    input.maxLength = field.max;

    form.insertBefore(label, photoLabel);
    form.insertBefore(input, photoLabel);
  });

  if (!form.elements.namedItem("playerPhotoFile")) {
    const label = document.createElement("label");

    label.textContent =
      "Upload Player Photo (JPG, PNG or WEBP · max 5 MB)";

    const input = document.createElement("input");

    input.type = "file";
    input.name = "playerPhotoFile";
    input.accept = "image/jpeg,image/png,image/webp";
    input.style.width = "100%";

    form.insertBefore(label, photoLabel);
    form.insertBefore(input, photoLabel);
  }

  form.dataset.extraFieldsReady = "true";
}

const playerForm = $("playerForm");
const matchForm = $("matchForm");

if (playerForm) {
  addPlayerExtraFields(playerForm);
}

/* Verify Dashboard Access */
async function verifyDashboardUser(user) {
  if (!user?.email) return false;

  const email = user.email.trim().toLowerCase();

  if (email === OWNER_EMAIL) {
    role = "Owner";
    applyPermissions();
    return true;
  }

  const staffDoc = await dppccDb
    .collection("staff")
    .doc(email)
    .get();

  return (
    staffDoc.exists &&
    staffDoc.data().active === true &&
    staffDoc.data().role === pageRole
  );
}

/* Dashboard record display */
function renderItem(title, details, actions = "") {
  return `
    <div class="item">
      <b>${escapeHTML(title)}</b>
      <br>
      ${details}
      ${actions}
    </div>
  `;
}

/* Load Staff Accounts */
async function loadStaff() {
  if (role !== "Owner" || !$("staffList")) return;

  try {
    const snapshot = await dppccDb
      .collection("staff")
      .get();

    if (snapshot.empty) {
      $("staffList").innerHTML =
        "No staff accounts assigned yet.";

      return;
    }

    $("staffList").innerHTML = snapshot.docs.map(doc => {
      const staff = doc.data();
      const active = staff.active === true;

      return renderItem(
        staff.email || doc.id,

        `${escapeHTML(staff.role)} · ${
          active ? "Active" : "Disabled"
        }<br>`,

        `
          <button
            type="button"
            class="smallbtn staffToggle"
            data-email="${escapeHTML(doc.id)}"
            data-active="${active}"
          >
            ${active ? "DISABLE ACCESS" : "ENABLE ACCESS"}
          </button>
        `
      );

    }).join("");

  } catch (error) {
    console.error(error);

    $("staffList").textContent =
      `Unable to load staff list: ${error.message}`;
  }
}

/* Load Dashboard Records */
async function loadRecords() {
  const records = $("recordsArea");

  if (!records) return;

  let output = "";

  const matchesSnapshot = await dppccDb
    .collection("matches")
    .get();

  /* Match selector for Captain and Owner */
  const ballMatch = $("ballMatch");

  if (ballMatch && can("live")) {
    ballMatch.innerHTML =
      '<option value="">Select match</option>' +

      matchesSnapshot.docs.map(doc => {
        const match = doc.data();

        return `
          <option value="${escapeHTML(doc.id)}">
            DPPCC vs ${escapeHTML(match.opponent)}
          </option>
        `;
      }).join("");
  }

  /* Player Records */
  if (can("players")) {
    const snapshot = await dppccDb
      .collection("players")
      .get();

    output += `
      <section class="formbox">
        <h3>Player Records</h3>

        ${
          snapshot.empty
            ? "No players yet."
            : snapshot.docs.map(doc => {
                const player = doc.data();

                const edit = `
                  <button
                    type="button"
                    class="smallbtn edit-player"
                    data-id="${escapeHTML(doc.id)}"
                  >
                    EDIT
                  </button>
                `;

                const remove = role === "Owner"
                  ? `
                    <button
                      type="button"
                      class="smallbtn danger delete"
                      data-col="players"
                      data-id="${escapeHTML(doc.id)}"
                    >
                      DELETE
                    </button>
                  `
                  : "";

                return renderItem(
                  player.name,

                  `
                    ${escapeHTML(player.role)}
                    · Jersey ${escapeHTML(player.jerseyNo ?? "—")}
                    · Entry ${escapeHTML(player.entryNo || "—")}
                    <br>
                  `,

                  edit + remove
                );

              }).join("")
        }
      </section>
    `;
  }

  /* Match Records */
  if (can("matches")) {
    output += `
      <section class="formbox">
        <h3>Match Records</h3>

        ${
          matchesSnapshot.empty
            ? "No matches yet."
            : matchesSnapshot.docs.map(doc => {
                const match = doc.data();

                const edit = `
                  <button
                    type="button"
                    class="smallbtn edit-match"
                    data-id="${escapeHTML(doc.id)}"
                  >
                    EDIT
                  </button>
                `;

                const remove = role === "Owner"
                  ? `
                    <button
                      type="button"
                      class="smallbtn danger delete"
                      data-col="matches"
                      data-id="${escapeHTML(doc.id)}"
                    >
                      DELETE
                    </button>
                  `
                  : "";

                return renderItem(
                  `DPPCC vs ${match.opponent}`,

                  `
                    ${escapeHTML(match.status)}
                    · ${escapeHTML(match.date)}
                    · ${escapeHTML(match.result || "")}
                  `,

                  edit + remove
                );

              }).join("")
        }
      </section>
    `;
  }

  /* Registration and Jersey Orders */
  if (can("submissions")) {
    const [registrations, orders] = await Promise.all([
      dppccDb.collection("registrations").get(),
      dppccDb.collection("jerseyOrders").get()
    ]);

    const registrationHTML = registrations.empty
      ? "No registrations."
      : registrations.docs.map(doc => {
          const item = doc.data();

          const image =
            /^https:\/\//i.test(item.photoUrl || "")
              ? `
                <br>
                <a
                  href="${escapeHTML(item.photoUrl)}"
                  target="_blank"
                  rel="noopener"
                >
                  View applicant photo
                </a>
              `
              : "";

          const actions = `
            <button
              type="button"
              class="smallbtn review"
              data-id="${escapeHTML(doc.id)}"
              data-status="Approved"
            >
              APPROVE
            </button>

            <button
              type="button"
              class="smallbtn danger review"
              data-id="${escapeHTML(doc.id)}"
              data-status="Rejected"
            >
              REJECT
            </button>

            ${
              role === "Owner"
                ? `
                  <button
                    type="button"
                    class="smallbtn danger delete"
                    data-col="registrations"
                    data-id="${escapeHTML(doc.id)}"
                  >
                    DELETE
                  </button>
                `
                : ""
            }
          `;

          return renderItem(
            item.name,

            `
              ${escapeHTML(item.status || "Pending")}
              · ${escapeHTML(item.phone)}
              · Age ${escapeHTML(item.age)}
              · ${escapeHTML(item.role)}
              <br>
              ${escapeHTML(item.address || "")}
              ${image}
              <br>
            `,

            actions
          );

        }).join("");

    const ordersHTML = orders.empty
      ? "No jersey orders."
      : orders.docs.map(doc => {
          const item = doc.data();
          const status = item.status || "Pending";

          const select = `
            <label>Order Status</label>

            <select
              class="orderStatus"
              data-id="${escapeHTML(doc.id)}"
            >
              <option ${status === "Pending" ? "selected" : ""}>
                Pending
              </option>

              <option ${status === "Processing" ? "selected" : ""}>
                Processing
              </option>

              <option ${status === "Completed" ? "selected" : ""}>
                Completed
              </option>

              <option ${status === "Cancelled" ? "selected" : ""}>
                Cancelled
              </option>
            </select>
          `;

          const remove = role === "Owner"
            ? `
              <button
                type="button"
                class="smallbtn danger delete"
                data-col="jerseyOrders"
                data-id="${escapeHTML(doc.id)}"
              >
                DELETE
              </button>
            `
            : "";

          return renderItem(
            item.name,

            `
              ${escapeHTML(item.phone)}
              · ${escapeHTML(item.size)}
              · #${escapeHTML(item.number)}
              <br>
              ${select}
            `,

            remove
          );

        }).join("");

    if ($("registrationsList")) {
      $("registrationsList").innerHTML = registrationHTML;
    }

    if ($("ordersList")) {
      $("ordersList").innerHTML = ordersHTML;
    }
  }

  /* News Records */
  if (can("news")) {
    const snapshot = await dppccDb
      .collection("news")
      .get();

    output += `
      <section class="formbox">
        <h3>News Records</h3>

        ${
          snapshot.empty
            ? "No news yet."
            : snapshot.docs.map(doc => {
                const item = doc.data();

                const remove = role === "Owner"
                  ? `
                    <button
                      type="button"
                      class="smallbtn danger delete"
                      data-col="news"
                      data-id="${escapeHTML(doc.id)}"
                    >
                      DELETE
                    </button>
                  `
                  : "";

                return renderItem(
                  item.title,
                  escapeHTML(item.body),
                  remove
                );

              }).join("")
        }
      </section>
    `;
  }

  /* Live Score History */
  if (can("live")) {
    const snapshot = await dppccDb
      .collection("liveScores")
      .get();

    output += `
      <section class="formbox">
        <h3>Live Score History</h3>

        ${
          snapshot.empty
            ? "No live updates yet."
            : snapshot.docs.map(doc => {
                const item = doc.data();

                const remove = role === "Owner"
                  ? `
                    <button
                      type="button"
                      class="smallbtn danger delete"
                      data-col="liveScores"
                      data-id="${escapeHTML(doc.id)}"
                    >
                      DELETE
                    </button>
                  `
                  : "";

                return renderItem(
                  item.matchLabel || "DPPCC Match",

                  `
                    Over ${escapeHTML(item.over)}.${escapeHTML(item.ball)}
                    · ${escapeHTML(item.runs)} run(s)
                    ${item.wicket ? "· WICKET" : ""}
                    <br>
                    ${escapeHTML(item.commentary || "")}
                  `,

                  remove
                );

              }).join("")
        }
      </section>
    `;
  }

  records.innerHTML = output;

  if (role === "Owner") {
    await loadStaff();
  }
}

/* Owner: Add or Update Staff Role */
if ($("staffForm")) {
  $("staffForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (role !== "Owner") return;

    const form = event.currentTarget;

    const email = valueOf(form, "email")
      .trim()
      .toLowerCase();

    const staffRole = valueOf(form, "role");
    const active = form.elements.active.checked;

    try {
      const ref = dppccDb
        .collection("staff")
        .doc(email);

      const previous = await ref.get();

      const data = {
        email,
        role: staffRole,
        active,
        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp()
      };

      if (!previous.exists) {
        data.createdAt =
          firebase.firestore.FieldValue.serverTimestamp();
      }

      await ref.set(data, { merge: true });

      if ($("staffMessage")) {
        $("staffMessage").textContent =
          "Staff role saved. The account must already exist in Firebase Authentication.";

        $("staffMessage").classList.remove("hidden");
      }

      form.reset();
      form.elements.active.checked = true;

      await loadStaff();

    } catch (error) {
      console.error(error);

      alert(
        `Could not save staff access: ${error.message}`
      );
    }
  });
}

/* Player Add and Edit */
if (playerForm) {
  playerForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!can("players")) return;

    const form = event.currentTarget;
    const submit = $("playerSubmit");

    if (submit) submit.disabled = true;

    try {
      const id = valueOf(form, "docId");

      const file =
        form.elements.playerPhotoFile?.files?.[0];

      let photoUrl = valueOf(form, "photoUrl").trim();

      if (file) {
        photoUrl = await uploadDPPCCPhoto(
          file,
          "dppcc/player-photos"
        );
      }

      if (
        photoUrl &&
        !/^https:\/\//i.test(photoUrl)
      ) {
        throw new Error("Photo URL must start with https://");
      }

      const data = {
        name: valueOf(form, "name").trim(),
        role: valueOf(form, "role"),
        jerseyNo: Number(valueOf(form, "jerseyNo")),
        entryNo: valueOf(form, "entryNo").trim(),
        battingStyle: valueOf(form, "battingStyle").trim(),
        photoUrl,

        updatedAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        updatedBy: currentUser.email
      };

      if (
        !Number.isInteger(data.jerseyNo) ||
        data.jerseyNo < 0 ||
        data.jerseyNo > 999
      ) {
        throw new Error(
          "Jersey number must be between 0 and 999."
        );
      }

      const collection = dppccDb.collection("players");

      if (id) {
        await collection.doc(id).update(data);
      } else {
        data.createdAt =
          firebase.firestore.FieldValue.serverTimestamp();

        data.createdBy = currentUser.email;

        await collection.add(data);
      }

      form.reset();
      form.elements.docId.value = "";

      if ($("playerSubmit")) {
        $("playerSubmit").textContent = "ADD PLAYER";
      }

      if ($("cancelPlayerEdit")) {
        $("cancelPlayerEdit").classList.add("hidden");
      }

      await loadRecords();

    } catch (error) {
      console.error(error);

      alert(`Player save failed: ${error.message}`);

    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

/* Match Add and Edit */
if (matchForm) {
  matchForm.addEventListener("submit", async event => {
    event.preventDefault();

    if (!can("matches")) return;

    const form = event.currentTarget;
    const submit = $("matchSubmit");

    if (submit) submit.disabled = true;

    try {
      const id = valueOf(form, "docId");

      const data = {
        opponent: valueOf(form, "opponent").trim(),
        date: valueOf(form, "date"),
        venue: valueOf(form, "venue").trim(),
        status: valueOf(form, "status"),
        result: valueOf(form, "result").trim()
      };

      if (id) {
        await dppccDb
          .collection("matches")
          .doc(id)
          .update(data);
      } else {
        await dppccDb
          .collection("matches")
          .add(data);
      }

      form.reset();
      form.elements.docId.value = "";

      if ($("matchSubmit")) {
        $("matchSubmit").textContent = "ADD MATCH";
      }

      if ($("cancelMatchEdit")) {
        $("cancelMatchEdit").classList.add("hidden");
      }

      await loadRecords();

    } catch (error) {
      console.error(error);

      alert(`Match save failed: ${error.message}`);

    } finally {
      if (submit) submit.disabled = false;
    }
  });
}

/* Captain and Owner: Live Scoring */
if ($("ballForm")) {
  $("ballForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!can("live")) return;

    const form = event.currentTarget;

    try {
      const matchId = valueOf(form, "matchId");
      const selected = $("ballMatch")?.selectedOptions?.[0];

      if (!matchId || !selected) {
        throw new Error("Please select a match first.");
      }

      const data = {
        matchId,

        matchLabel: selected.textContent,

        over: Number(valueOf(form, "over")),
        ball: Number(valueOf(form, "ball")),
        runs: Number(valueOf(form, "runs")),

        wicket: valueOf(form, "wicket") === "true",

        commentary: valueOf(form, "commentary").trim(),

        createdAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        createdBy: currentUser.email
      };

      if (
        ![data.over, data.ball, data.runs]
          .every(Number.isInteger)
      ) {
        throw new Error(
          "Over, ball and runs must be whole numbers."
        );
      }

      await dppccDb
        .collection("liveScores")
        .add(data);

      form.reset();

      alert("Live score update posted successfully.");

      await loadRecords();

    } catch (error) {
      console.error(error);

      alert(`Live score failed: ${error.message}`);
    }
  });
}

/* Admin and Owner: Publish News */
if ($("newsForm")) {
  $("newsForm").addEventListener("submit", async event => {
    event.preventDefault();

    if (!can("news")) return;

    const form = event.currentTarget;

    try {
      await dppccDb
        .collection("news")
        .add({
          title: valueOf(form, "title").trim(),
          body: valueOf(form, "body").trim(),

          createdAt:
            firebase.firestore.FieldValue.serverTimestamp(),

          createdBy: currentUser.email
        });

      form.reset();

      alert("News published successfully.");

      await loadRecords();

    } catch (error) {
      console.error(error);

      alert(`News publish failed: ${error.message}`);
    }
  });
}

/* Dashboard Buttons */
document.addEventListener("click", async event => {
  const target = event.target;

  /* Cancel Player Edit */
  const cancelPlayer = target.closest("#cancelPlayerEdit");

  if (cancelPlayer && playerForm) {
    playerForm.reset();
    playerForm.elements.docId.value = "";

    if ($("playerSubmit")) {
      $("playerSubmit").textContent = "ADD PLAYER";
    }

    cancelPlayer.classList.add("hidden");
    return;
  }

  /* Cancel Match Edit */
  const cancelMatch = target.closest("#cancelMatchEdit");

  if (cancelMatch && matchForm) {
    matchForm.reset();
    matchForm.elements.docId.value = "";

    if ($("matchSubmit")) {
      $("matchSubmit").textContent = "ADD MATCH";
    }

    cancelMatch.classList.add("hidden");
    return;
  }

  /* Edit Player */
  const editPlayer = target.closest(".edit-player");

  if (editPlayer && can("players")) {
    try {
      const doc = await dppccDb
        .collection("players")
        .doc(editPlayer.dataset.id)
        .get();

      if (!doc.exists) {
        throw new Error("Player record not found.");
      }

      const player = doc.data();

      playerForm.elements.docId.value = doc.id;
      playerForm.elements.name.value = player.name || "";
      playerForm.elements.role.value =
        player.role || "Batsman";

      playerForm.elements.jerseyNo.value =
        player.jerseyNo ?? "";

      playerForm.elements.entryNo.value =
        player.entryNo || "";

      playerForm.elements.battingStyle.value =
        player.battingStyle || "";

      playerForm.elements.photoUrl.value =
        player.photoUrl || "";

      playerForm.elements.playerPhotoFile.value = "";

      if ($("playerSubmit")) {
        $("playerSubmit").textContent = "SAVE PLAYER";
      }

      if ($("cancelPlayerEdit")) {
        $("cancelPlayerEdit").classList.remove("hidden");
      }

      playerForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    } catch (error) {
      alert(error.message);
    }

    return;
  }

  /* Edit Match */
  const editMatch = target.closest(".edit-match");

  if (editMatch && can("matches")) {
    try {
      const doc = await dppccDb
        .collection("matches")
        .doc(editMatch.dataset.id)
        .get();

      if (!doc.exists) {
        throw new Error("Match record not found.");
      }

      const match = doc.data();

      matchForm.elements.docId.value = doc.id;
      matchForm.elements.opponent.value =
        match.opponent || "";

      matchForm.elements.date.value =
        match.date || "";

      matchForm.elements.venue.value =
        match.venue || "";

      matchForm.elements.status.value =
        match.status || "Upcoming";

      matchForm.elements.result.value =
        match.result || "";

      if ($("matchSubmit")) {
        $("matchSubmit").textContent = "SAVE MATCH";
      }

      if ($("cancelMatchEdit")) {
        $("cancelMatchEdit").classList.remove("hidden");
      }

      matchForm.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    } catch (error) {
      alert(error.message);
    }

    return;
  }

  /* Approve or Reject Registration */
  const review = target.closest(".review");

  if (review && can("submissions")) {
    try {
      await dppccDb
        .collection("registrations")
        .doc(review.dataset.id)
        .update({
          status: review.dataset.status,

          reviewedAt:
            firebase.firestore.FieldValue.serverTimestamp(),

          reviewedBy: currentUser.email
        });

      await loadRecords();

    } catch (error) {
      alert(
        `Registration update failed: ${error.message}`
      );
    }

    return;
  }

  /* Delete: Owner Only */
  const remove = target.closest(".delete");

  if (
    remove &&
    role === "Owner" &&
    confirm("Permanently delete this record?")
  ) {
    try {
      await dppccDb
        .collection(remove.dataset.col)
        .doc(remove.dataset.id)
        .delete();

      await loadRecords();

    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }

    return;
  }

  /* Enable / Disable Staff */
  const toggle = target.closest(".staffToggle");

  if (
    toggle &&
    role === "Owner" &&
    confirm("Change this staff member's access?")
  ) {
    try {
      await dppccDb
        .collection("staff")
        .doc(toggle.dataset.email)
        .update({
          active: toggle.dataset.active !== "true",

          updatedAt:
            firebase.firestore.FieldValue.serverTimestamp()
        });

      await loadStaff();

    } catch (error) {
      alert(
        `Staff access update failed: ${error.message}`
      );
    }
  }
});

/* Manager and Owner: Jersey Order Status */
document.addEventListener("change", async event => {
  const select = event.target;

  if (
    !select.matches(".orderStatus") ||
    !can("submissions")
  ) {
    return;
  }

  try {
    await dppccDb
      .collection("jerseyOrders")
      .doc(select.dataset.id)
      .update({
        status: select.value,

        statusUpdatedAt:
          firebase.firestore.FieldValue.serverTimestamp(),

        statusUpdatedBy: currentUser.email
      });

  } catch (error) {
    alert(
      `Order status update failed: ${error.message}`
    );
  }
});

/* Owner: Download Data Backup */
if ($("backupButton")) {
  $("backupButton").addEventListener("click", async () => {
    if (role !== "Owner") return;

    const collections = [
      "players",
      "matches",
      "registrations",
      "jerseyOrders",
      "news",
      "liveScores",
      "staff"
    ];

    const backup = {
      project: "dppcc-official",
      createdAt: new Date().toISOString(),
      collections: {}
    };

    try {
      for (const name of collections) {
        const snapshot = await dppccDb
          .collection(name)
          .get();

        backup.collections[name] =
          snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
      }

      const blob = new Blob(
        [JSON.stringify(backup, null, 2)],
        { type: "application/json" }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download =
        `DPPCC-backup-${new Date().toISOString().slice(0, 10)}.json`;

      link.click();

      URL.revokeObjectURL(url);

    } catch (error) {
      alert(`Backup failed: ${error.message}`);
    }
  });
}

/* Logout */
if ($("logoutButton")) {
  $("logoutButton").addEventListener("click", async () => {
    await dppccAuth.signOut();
    location.replace("login.html");
  });
}

/* Start Dashboard */
dppccAuth.onAuthStateChanged(async user => {
  if (!user) {
    location.replace("login.html");
    return;
  }

  try {
    const allowed = await verifyDashboardUser(user);

    if (!allowed) {
      await dppccAuth.signOut();
      location.replace("login.html");
      return;
    }

    currentUser = user;

    setNotice(`Access verified · ${role}`);

    if ($("dashboardContent")) {
      $("dashboardContent").classList.remove("hidden");
    }

    if ($("welcomeText")) {
      $("welcomeText").textContent =
        `Signed in as ${user.email} · ${role} access`;
    }

    await loadRecords();

  } catch (error) {
    console.error("Dashboard initialization failed:", error);

    setNotice(
      `Dashboard data could not be loaded: ${error.message}`,
      true
    );
  }
});
