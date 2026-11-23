// DPPCC Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAd--LMKzEIiPxBHCu-rWZojbKExwe_CAA",
  authDomain: "dppcc-official.firebaseapp.com",
  projectId: "dppcc-official",
  storageBucket: "dppcc-official.firebasestorage.app",
  messagingSenderId: "476337423288",
  appId: "1:476337423288:web:a81ff59d9cc742ed5b854d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export { app };

export const OWNER_EMAIL =
  "dungsreepaschimparacricketclub@gmail.com";

export const CLOUDINARY_CLOUD_NAME = "zkgexaov";
export const CLOUDINARY_UPLOAD_PRESET = "dppcc_player_photos";
