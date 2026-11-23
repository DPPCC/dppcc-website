
"use strict";

const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");
const { randomBytes } = require("node:crypto");

initializeApp();

const db = getFirestore();

const OWNER_EMAIL =
  "dungsreepaschimparacricketclub@gmail.com";

const REGION = "asia-south1";

const ALLOWED_ROLES = [
  "Admin",
  "Manager",
  "Captain"
];

const QR_MANAGERS = [
  "Owner",
  "Admin",
  "Captain"
];

async function getStaffRole(request) {
  if (!request.auth) {
    throw new HttpsError(
      "unauthenticated",
      "Please sign in first."
    );
  }

  const email = String(
    request.auth.token.email || ""
  ).trim().toLowerCase();

  if (!email) {
    throw new HttpsError(
      "permission-denied",
      "A verified email is required."
    );
  }

  if (email === OWNER_EMAIL) {
    return {
      email,
      role: "Owner"
    };
  }

  const staffRef = db.collection("staff").doc(email);
  const staffSnap = await staffRef.get();

  if (!staffSnap.exists) {
    throw new HttpsError(
      "permission-denied",
      "You are not an authorized staff member."
    );
  }

  const staff = staffSnap.data();

  if (
    staff.active !== true ||
    String(staff.email || "").trim().toLowerCase() !== email ||
    !ALLOWED_ROLES.includes(staff.role)
  ) {
    throw new HttpsError(
      "permission-denied",
      "Your staff access is inactive or invalid."
    );
  }

  return {
    email,
    role: staff.role
  };
}

async function writeActivity({
  actorEmail,
  actorRole,
  action,
  targetId,
  details
}) {
  await db.collection("activityLogs").add({
    actorEmail,
    actorRole,
    action,
    targetId: targetId || "",
    details: details || {},
    createdAt: FieldValue.serverTimestamp()
  });
}

// ============================================
// CREATE PLAYER QR VERIFICATION
// Owner, Admin and Captain only
// ============================================

exports.createPlayerQr = onCall(
  { region: REGION },
  async (request) => {
    const staff = await getStaffRole(request);

    if (!QR_MANAGERS.includes(staff.role)) {
      throw new HttpsError(
        "permission-denied",
        "You cannot create player QR codes."
      );
    }

    const playerId = String(
      request.data?.playerId || ""
    ).trim();

    if (!playerId || playerId.length > 150) {
      throw new HttpsError(
        "invalid-argument",
        "A valid player ID is required."
      );
    }

    const playerRef = db.collection("players").doc(playerId);
    const playerSnap = await playerRef.get();

    if (!playerSnap.exists) {
      throw new HttpsError(
        "not-found",
        "Player was not found."
      );
    }

    const player = playerSnap.data();

    if (
      typeof player.name !== "string" ||
      !player.name.trim()
    ) {
      throw new HttpsError(
        "failed-precondition",
        "Player information is incomplete."
      );
    }

    const token = randomBytes(32).toString("hex");

    const qrRef = db.collection("playerQrTokens").doc(token);

    await qrRef.set({
      playerId,
      name: player.name,
      role: player.role || "",
      jerseyNo: Number(player.jerseyNo || 0),
      entryNo: String(player.entryNo || ""),
      photoUrl: String(player.photoUrl || ""),
      active: true,
      createdBy: staff.email,
      createdAt: FieldValue.serverTimestamp()
    });

    await writeActivity({
      actorEmail: staff.email,
      actorRole: staff.role,
      action: "PLAYER_QR_CREATED",
      targetId: playerId,
      details: {
        playerName: player.name
      }
    });

    return {
      success: true,
      token,
      playerId,
      message: "Player QR verification token created."
    };
  }
);

// ============================================
// PUBLIC PLAYER QR VERIFICATION
// No login required
// ============================================

exports.verifyPlayerQr = onCall(
  { region: REGION },
  async (request) => {
    const token = String(
      request.data?.token || ""
    ).trim();

    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid verification code."
      );
    }

    const qrSnap = await db
      .collection("playerQrTokens")
      .doc(token)
      .get();

    if (!qrSnap.exists) {
      return {
        valid: false,
        message: "Player verification record not found."
      };
    }

    const qr = qrSnap.data();

    if (qr.active !== true) {
      return {
        valid: false,
        message: "This player QR verification has been revoked."
      };
    }

    return {
      valid: true,
      player: {
        name: qr.name || "",
        role: qr.role || "",
        jerseyNo: qr.jerseyNo ?? "",
        entryNo: qr.entryNo || "",
        photoUrl: qr.photoUrl || ""
      },
      message: "DPPCC player record verified."
    };
  }
);

// ============================================
// REVOKE PLAYER QR
// Owner and Admin only
// ============================================

exports.revokePlayerQr = onCall(
  { region: REGION },
  async (request) => {
    const staff = await getStaffRole(request);

    if (!["Owner", "Admin"].includes(staff.role)) {
      throw new HttpsError(
        "permission-denied",
        "Only Owner or Admin can revoke QR codes."
      );
    }

    const token = String(
      request.data?.token || ""
    ).trim();

    if (!/^[a-f0-9]{64}$/.test(token)) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid QR token."
      );
    }

    const qrRef = db.collection("playerQrTokens").doc(token);
    const qrSnap = await qrRef.get();

    if (!qrSnap.exists) {
      throw new HttpsError(
        "not-found",
        "QR verification record not found."
      );
    }

    await qrRef.update({
      active: false,
      revokedBy: staff.email,
      revokedAt: FieldValue.serverTimestamp()
    });

    await writeActivity({
      actorEmail: staff.email,
      actorRole: staff.role,
      action: "PLAYER_QR_REVOKED",
      targetId: qrSnap.data().playerId,
      details: {}
    });

    return {
      success: true,
      message: "Player QR verification revoked."
    };
  }
);

// ============================================
// RECORD STAFF ACTIVITY
// Authenticated staff only
// ============================================

exports.logActivity = onCall(
  { region: REGION },
  async (request) => {
    const staff = await getStaffRole(request);

    const allowedActions = [
      "PLAYER_CREATED",
      "PLAYER_UPDATED",
      "PLAYER_DELETED",
      "MATCH_CREATED",
      "MATCH_UPDATED",
      "MATCH_DELETED",
      "NEWS_CREATED",
      "NEWS_UPDATED",
      "NEWS_DELETED",
      "APPLICATION_REVIEWED",
      "JERSEY_ORDER_UPDATED"
    ];

    const action = String(
      request.data?.action || ""
    ).trim();

    const targetId = String(
      request.data?.targetId || ""
    ).trim();

    if (!allowedActions.includes(action)) {
      throw new HttpsError(
        "invalid-argument",
        "Unsupported activity action."
      );
    }

    if (targetId.length > 150) {
      throw new HttpsError(
        "invalid-argument",
        "Invalid target ID."
      );
    }

    await writeActivity({
      actorEmail: staff.email,
      actorRole: staff.role,
      action,
      targetId,
      details: {
        source: "staff-dashboard"
      }
    });

    return {
      success: true,
      message: "Activity recorded."
    };
  }
);

// ============================================
// GET RECENT ACTIVITY LOGS
// Owner only
// ============================================

exports.getActivityLogs = onCall(
  { region: REGION },
  async (request) => {
    const staff = await getStaffRole(request);

    if (staff.role !== "Owner") {
      throw new HttpsError(
        "permission-denied",
        "Only the Owner can view activity logs."
      );
    }

    const requestedLimit = Number(
      request.data?.limit || 50
    );

    const limit = Math.min(
      Math.max(Math.floor(requestedLimit), 1),
      100
    );

    const snapshot = await db
      .collection("activityLogs")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();

    return {
      success: true,
      logs: snapshot.docs.map((doc) => {
        const data = doc.data();

        return {
          id: doc.id,
          actorEmail: data.actorEmail || "",
          actorRole: data.actorRole || "",
          action: data.action || "",
          targetId: data.targetId || "",
          details: data.details || {},
          createdAt: data.createdAt
            ? data.createdAt.toDate().toISOString()
            : null
        };
      })
    };
  }
);
