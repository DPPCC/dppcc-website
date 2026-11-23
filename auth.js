
import { auth, db, OWNER_EMAIL } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const $ = id => document.getElementById(id);

const dashboardPages = {
  Owner: "owner.html",
  Admin: "admin.html",
  Manager: "manager.html",
  Captain: "captain.html"
};

function showMessage(message, error = false) {
  const box = $("loginNotice");
  if (!box) return;

  box.textContent = message;
  box.style.background = error ? "#ffe5e5" : "#e5f7eb";
  box.style.color = error ? "#9b1717" : "#14532d";
}

async function getDPPCCRole(user) {
  if (!user?.email) return null;

  const email = user.email.trim().toLowerCase();

  if (email === OWNER_EMAIL.toLowerCase()) {
    return "Owner";
  }

  const snapshot = await getDoc(doc(db, "staff", email));

  if (!snapshot.exists()) return null;

  const staff = snapshot.data();

  if (staff.active !== true) return null;

  if (!["Admin", "Manager", "Captain"].includes(staff.role)) {
    return null;
  }

  if ((staff.email || "").toLowerCase() !== email) {
    return null;
  }

  return staff.role;
}

async function routeUser(user) {
  try {
    const role = await getDPPCCRole(user);

    if (!role || !dashboardPages[role]) {
      await signOut(auth);
      showMessage(
        "This account has no active DPPCC staff role. Contact the Owner.",
        true
      );
      return;
    }

    location.replace(dashboardPages[role]);

  } catch (error) {
    console.error("Role verification error:", error);
    showMessage(
      "Could not verify staff access. Please try again.",
      true
    );
  }
}

const loginForm = $("staffLoginForm");

if (loginForm) {
  onAuthStateChanged(auth, user => {
    if (user) routeUser(user);
  });

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();

    const button = loginForm.querySelector('button[type="submit"]');
    const email = $("staffEmail").value.trim().toLowerCase();
    const password = $("staffPassword").value;

    if (button) button.disabled = true;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      showMessage("Login successful. Verifying your access...");

    } catch (error) {
      console.error("Login error:", error);

      showMessage(
        "Login failed. Check your email and password.",
        true
      );

    } finally {
      if (button) button.disabled = false;
    }
  });
}
