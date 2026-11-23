/* DPPCC Firebase + Cloudinary Configuration */
"use strict";

const firebaseConfig = {
  apiKey: "AIzaSyAd--LMKzEIiPxBHCu-rWZojbKExwe_CAA",
  authDomain: "dppcc-official.firebaseapp.com",
  projectId: "dppcc-official",
  storageBucket: "dppcc-official.firebasestorage.app",
  messagingSenderId: "476337423288",
  appId: "1:476337423288:web:a81ff59d9cc742ed5b854d"
};

const OWNER_EMAIL = "dungsreepaschimparacricketclub@gmail.com";

const CLOUDINARY_CLOUD_NAME = "zkgexaov";
const CLOUDINARY_UPLOAD_PRESET = "dppcc_player_photos";
const DPPCC_MAX_PHOTO_BYTES = 5 * 1024 * 1024;

if (!window.firebase) {
  throw new Error(
    "Firebase SDK did not load. Check the Firebase compat script tags."
  );
}

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const dppccAuth = firebase.auth();
const dppccDb = firebase.firestore();

async function uploadDPPCCPhoto(file, folder) {
  if (!file) return "";

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  if (!allowed.includes(file.type)) {
    throw new Error("Only JPG, PNG or WEBP photos are allowed.");
  }

  if (file.size > DPPCC_MAX_PHOTO_BYTES) {
    throw new Error("Photo must be 5 MB or smaller.");
  }

  const body = new FormData();

  body.append("file", file);
  body.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  if (folder) {
    body.append("folder", folder);
  }

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body
    }
  );

  const result = await response.json();

  if (!response.ok || !result.secure_url) {
    throw new Error(
      result?.error?.message || "Cloudinary photo upload failed."
    );
  }

  return result.secure_url;
}
