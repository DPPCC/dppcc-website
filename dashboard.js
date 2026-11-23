
/* dashboard.js — নিচের পরিবর্তনগুলো প্রয়োগ করো। */

// buildForms() এর Player Photo URL লাইনটি বদলে:
<label>Player Photo URL (optional)</label>
<input name="photoUrl" type="url" placeholder="Leave blank if no photo">

// পুরোনো logoutButton click handler সরিয়ে এই ফাংশন বসাও:
function setupLogoutButton() {
  const welcome = $("welcomeText");
  if (!welcome) return;

  let button = $("logoutButton");

  if (!button) {
    button = document.createElement("button");
    button.id = "logoutButton";
    button.type = "button";
    button.textContent = "LOG OUT";
    button.style.margin = "12px 0";
    button.style.padding = "10px 18px";
    button.style.border = "0";
    button.style.borderRadius = "6px";
    button.style.cursor = "pointer";
    button.style.fontWeight = "700";
    button.style.background = "#b42318";
    button.style.color = "#ffffff";

    welcome.insertAdjacentElement("afterend", button);
  }

  if (button.dataset.bound === "true") return;
  button.dataset.bound = "true";

  button.addEventListener("click", async () => {
    button.disabled = true;

    try {
      await dppccAuth.signOut();
      location.replace("login.html");
    } catch (error) {
      button.disabled = false;
      alert("Logout failed: " + error.message);
    }
  });
}

// dppccAuth.onAuthStateChanged() এর ভিতরে
// welcomeText সেট করার পর এই লাইনটি যোগ করো:
setupLogoutButton();
