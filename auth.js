
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

import { auth } from "./firebase-config.js";

const staffRoles = {
  "dungsreepaschimparacricketclub@gmail.com": {
    role: "Owner",
    page: "owner.html"
  },
  "dppccadmin@gmail.com": {
    role: "Admin",
    page: "admin.html"
  },
  "dppccmanager@gmail.com": {
    role: "Manager",
    page: "manager.html"
  },
  "dppcaptain@gmail.com": {
    role: "Captain",
    page: "captain.html"
  }
};

const form = document.querySelector("form");
const emailInput = document.querySelector('input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');
const button = form?.querySelector("button");
const notice = document.querySelector(".notice");

function showMessage(message) {
  if (notice) notice.textContent = message;
}

function redirectStaff(user) {
  const email = user.email?.toLowerCase();
  const staff = staffRoles[email];

  if (!staff) {
    signOut(auth);
    showMessage("Access denied. This email is not an authorized staff account.");
    return;
  }

  window.location.replace(staff.page);
}

if (form && emailInput && passwordInput && button) {
  button.type = "submit";

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = emailInput.value.trim().toLowerCase();
    const password = passwordInput.value;

    if (!staffRoles[email]) {
      showMessage("This email is not authorized for staff login.");
      return;
    }

    button.disabled = true;
    showMessage("Signing in...");

    try {
      const result = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      redirectStaff(result.user);

    } catch (error) {
      showMessage(
        error.code === "auth/invalid-credential"
          ? "Incorrect email or password."
          : "Login failed: " + error.message
      );
    } finally {
      button.disabled = false;
    }
  });
}
