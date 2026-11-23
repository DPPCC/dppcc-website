"use strict";

const $ = id => document.getElementById(id);

const formValue = (form, name) =>
  form.elements.namedItem(name)?.value ?? "";

const escapeHTML = value =>
  String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));

const safePhoto = url =>
  /^https:\/\//i.test(url || "") ? url : "";

if ($("year")) {
  $("year").textContent = new Date().getFullYear();
}

/* Show success and error messages */
function showPublicMessage(id, message, isError = false) {
  const box = $(id);

  if (!box) return;

  box.textContent = message;
  box.classList.remove("hidden");

  box.style.background = isError
    ? "#ffe5e5"
    : "#e5f7eb";

  box.style.color = isError
    ? "#9b1717"
    : "#14532d";
}

/* Add Cloudinary photo input to Registration Form */
function addPhotoPicker(form, fieldName, labelText, required = false) {
  if (!form || form.querySelector(`[name="${fieldName}"]`)) {
    return null;
  }

  const submit =
    form.querySelector('button[type="submit"]') ||
    form.querySelector("button:last-of-type");

  const label = document.createElement("label");
  label.textContent = labelText;

  const input = document.createElement("input");

  input.type = "file";
  input.name = fieldName;
  input.accept = "image/jpeg,image/png,image/webp";
  input.required = required;
  input.style.width = "100%";

  if (submit) {
    form.insertBefore(label, submit);
    form.insertBefore(input, submit);
  } else {
    form.append(label, input);
  }

  return input;
}

/* Load Public Collections */
async function loadPublicCollection(
  collectionName,
  elementId,
  emptyHTML,
  renderItem
) {
  const box = $(elementId);

  if (!box) return null;

  try {
    const snapshot = await dppccDb
      .collection(collectionName)
      .get();

    const docs = snapshot.docs.slice();

    docs.sort((a, b) => {
      const at = a.data().createdAt?.seconds || 0;
      const bt = b.data().createdAt?.seconds || 0;

      return bt - at;
    });

    box.innerHTML = snapshot.empty
      ? emptyHTML
      : docs.map(renderItem).join("");

    if (
      collectionName === "players" &&
      $("statPlayers")
    ) {
      $("statPlayers").textContent = snapshot.size;
    }

    if (
      collectionName === "matches" &&
      $("statMatches")
    ) {
      $("statMatches").textContent = snapshot.size;
    }

    if (
      collectionName === "news" &&
      $("statNews")
    ) {
      $("statNews").textContent = snapshot.size;
    }

    return snapshot;

  } catch (error) {
    console.error(
      `Could not load ${collectionName}:`,
      error
    );

    box.textContent =
      "Information could not be loaded. Please try again later.";

    return null;
  }
}

/* Player Profiles */
loadPublicCollection(
  "players",
  "playersList",
  '<div class="card">No player profiles have been added yet.</div>',

  doc => {
    const player = doc.data();

    const image = safePhoto(player.photoUrl);

    return `
      <article class="card">

        ${
          image
            ? `
              <img
                src="${escapeHTML(image)}"
                alt="${escapeHTML(player.name)}"
                loading="lazy"
                style="
                  width:100%;
                  height:210px;
                  object-fit:cover;
                  border-radius:9px;
                "
              >
            `
            : ""
        }

        <h3>${escapeHTML(player.name)}</h3>

        <p>
          Role: ${escapeHTML(player.role)}
          <br>

          Jersey:
          ${escapeHTML(
            player.jerseyNo ??
            player.jerseyNumber ??
            "—"
          )}

          <br>

          Entry:
          ${escapeHTML(player.entryNo || "—")}

          <br>

          Batting:
          ${escapeHTML(player.battingStyle || "—")}
        </p>

      </article>
    `;
  }
);

/* Matches */
loadPublicCollection(
  "matches",
  "matchesList",
  '<div class="card">No fixtures or results have been added.</div>',

  doc => {
    const match = doc.data();

    return `
      <article class="card">

        <div class="kicker">
          ${escapeHTML(match.status || "Upcoming")}
        </div>

        <h3>
          DPPCC vs ${escapeHTML(match.opponent)}
        </h3>

        <p>
          Date: ${escapeHTML(match.date || "—")}
          <br>

          Venue: ${escapeHTML(match.venue || "—")}
          <br>

          Result:
          ${escapeHTML(match.result || "To be announced")}
        </p>

      </article>
    `;
  }
);

/* News */
loadPublicCollection(
  "news",
  "newsList",
  '<div class="card">No announcements yet.</div>',

  doc => {
    const news = doc.data();

    const date = news.createdAt?.toDate
      ? news.createdAt.toDate().toLocaleDateString()
      : "";

    return `
      <article class="card">

        <div class="kicker">
          DPPCC UPDATE
        </div>

        <h3>${escapeHTML(news.title)}</h3>

        <p>${escapeHTML(news.body)}</p>

        <small>${escapeHTML(date)}</small>

      </article>
    `;
  }
);

/* Live Scores */
(async () => {
  const box = $("liveScoresList");

  if (!box) return;

  try {
    const snapshot = await dppccDb
      .collection("liveScores")
      .get();

    const items = snapshot.docs
      .map(doc => doc.data())
      .sort((a, b) =>
        (b.createdAt?.seconds || 0) -
        (a.createdAt?.seconds || 0)
      );

    box.innerHTML = items.length
      ? items.slice(0, 30).map(item => `
          <div class="item">

            <b>
              ${escapeHTML(item.matchLabel || "DPPCC Match")}
            </b>

            · Over
            ${escapeHTML(item.over)}.${escapeHTML(item.ball)}

            · ${escapeHTML(item.runs)} run(s)

            ${item.wicket ? "· WICKET" : ""}

            <br>

            ${escapeHTML(item.commentary || "")}

          </div>
        `).join("")
      : "No live score updates yet.";

  } catch (error) {
    console.error(error);

    box.textContent =
      "Live scores are temporarily unavailable.";
  }
})();

/* Player Registration with Cloudinary Photo Upload */
const registrationForm = $("registrationForm");

if (registrationForm) {

  const registrationPhoto = addPhotoPicker(
    registrationForm,
    "registrationPhoto",
    "Player Photo (JPG, PNG or WEBP · max 5 MB)",
    true
  );

  registrationForm.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const button = form.querySelector("button");

    if (button) button.disabled = true;

    try {
      const file = registrationPhoto?.files?.[0];

      if (!file) {
        throw new Error("Please select a player photo.");
      }

      const photoUrl = await uploadDPPCCPhoto(
        file,
        "dppcc/registration-photos"
      );

      const age = Number(formValue(form, "age"));

      if (
        !Number.isInteger(age) ||
        age < 8 ||
        age > 70
      ) {
        throw new Error(
          "Age must be between 8 and 70."
        );
      }

      await dppccDb
        .collection("registrations")
        .add({
          name: formValue(form, "name").trim(),

          phone: formValue(form, "phone").trim(),

          age,

          role: formValue(form, "role"),

          address: formValue(form, "address").trim(),

          photoUrl,

          status: "Pending",

          createdAt:
            firebase.firestore.FieldValue.serverTimestamp()
        });

      showPublicMessage(
        "registrationMessage",
        "Registration submitted successfully. The club will review your application."
      );

      form.reset();

    } catch (error) {
      console.error(error);

      showPublicMessage(
        "registrationMessage",
        error.message || "Registration failed. Please try again.",
        true
      );

    } finally {
      if (button) button.disabled = false;
    }
  });
}

/* Jersey Orders */
const jerseyForm = $("jerseyForm");

if (jerseyForm) {

  jerseyForm.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const button = form.querySelector("button");

    if (button) button.disabled = true;

    try {
      const number = Number(
        formValue(form, "number")
      );

      if (
        !Number.isInteger(number) ||
        number < 0 ||
        number > 99
      ) {
        throw new Error(
          "Jersey number must be between 0 and 99."
        );
      }

      await dppccDb
        .collection("jerseyOrders")
        .add({
          name: formValue(form, "name").trim(),

          phone: formValue(form, "phone").trim(),

          size: formValue(form, "size"),

          number,

          status: "Pending",

          createdAt:
            firebase.firestore.FieldValue.serverTimestamp()
        });

      showPublicMessage(
        "jerseyMessage",
        "Jersey order submitted successfully."
      );

      form.reset();

    } catch (error) {
      console.error(error);

      showPublicMessage(
        "jerseyMessage",
        error.message || "Jersey order failed. Please try again.",
        true
      );

    } finally {
      if (button) button.disabled = false;
    }
  });
}

/* Homepage Highlights */
(async () => {
  if (!$("highlightsList")) return;

  try {
    const [matches, news, players] = await Promise.all([
      dppccDb.collection("matches").get(),
      dppccDb.collection("news").get(),
      dppccDb.collection("players").get()
    ]);

    if ($("statMatches")) {
      $("statMatches").textContent = matches.size;
    }

    if ($("statNews")) {
      $("statNews").textContent = news.size;
    }

    if ($("statPlayers")) {
      $("statPlayers").textContent = players.size;
    }

    const cards = [];

    matches.docs.slice(0, 2).forEach(doc => {
      const match = doc.data();

      cards.push(`
        <article class="card">

          <div class="kicker">
            ${escapeHTML(match.status || "MATCH")}
          </div>

          <h3>
            DPPCC vs ${escapeHTML(match.opponent)}
          </h3>

          <p>
            ${escapeHTML(match.date || "")}
            ·
            ${escapeHTML(match.result || "Fixture")}
          </p>

          <a href="matches.html">
            MATCH CENTRE →
          </a>

        </article>
      `);
    });

    news.docs.slice(0, 2).forEach(doc => {
      const item = doc.data();

      cards.push(`
        <article class="card">

          <div class="kicker">
            LATEST NEWS
          </div>

          <h3>${escapeHTML(item.title)}</h3>

          <p>${escapeHTML(item.body)}</p>

          <a href="news.html">
            READ NEWS →
          </a>

        </article>
      `);
    });

    $("highlightsList").innerHTML =
      cards.join("") ||
      '<div class="card">Club highlights will appear here.</div>';

  } catch (error) {
    console.error(
      "Homepage highlights failed:",
      error
    );

    $("highlightsList").textContent =
      "Club highlights are temporarily unavailable.";
  }
})();
