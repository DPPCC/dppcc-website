
// DPPCC Firebase Configuration

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyAd--LMKzEIiPxBHCu-rWZojbKExwe_CAA",
  authDomain: "dppcc-official.firebaseapp.com",
  projectId: "dppcc-official",
  storageBucket: "dppcc-official.firebasestorage.app",
  messagingSenderId: "476337423288",
  appId: "1:476337423288:web:a81ff59d9cc742ed5b854d"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
