"use strict";

const $ = id => document.getElementById(id);

const dashboardPages = {
  Owner: "owner.html",
  Admin: "admin.html",
  Manager: "manager.html",
  Captain: "captain.html"
};

function showLoginMessage(message, isError = true) {
  const box = $("loginMessage");

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

async function getDPPCCRole(user) {
  if (!user || !user.email) return null;

  const email = user.email.trim().toLowerCase();

  if (email === OWNER_EMAIL) {
    return "Owner";
  }

  const staffDoc = await dppccDb
    .collection("staff")
    .doc(email)
    .get();

  if (!staffDoc.exists) return null;

  const staff = staffDoc.data();

  if (staff.active !== true) return null;

  if (
    !["Admin", "Manager", "Captain"].includes(staff.role)
  ) {
    return null;
  }

  return staff.role;
}

async function routeSignedInUser(user) {
  try {
    const role = await getDPPCCRole(user);

    if (role && dashboardPages[role]) {
      location.replace(dashboardPages[role]);
      return;
    }

    await dppccAuth.signOut();

    showLoginMessage(
      "This account has no active DPPCC staff role. Please contact the Owner."
    );

  } catch (error) {
    console.error("DPPCC role check failed:", error);

    showLoginMessage(
      "Could not verify your staff access. Please try again."
    );
  }
}

if ($("loginForm")) {

  dppccAuth.onAuthStateChanged(user => {
    if (user) {
      routeSignedInUser(user);
    }
  });

  $("loginForm").addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const button = $("loginButton");

    if (button) button.disabled = true;

    try {
      const email = form.elements.email.value
        .trim()
        .toLowerCase();

      const password = form.elements.password.value;

      await dppccAuth.signInWithEmailAndPassword(
        email,
        password
      );

      showLoginMessage(
        "Login successful. Checking your dashboard access...",
        false
      );

    } catch (error) {
      console.error("DPPCC login failed:", error);

      showLoginMessage(
        "Login failed. Check your email and password, then try again."
      );

    } finally {
      if (button) button.disabled = false;
    }
  });
}
