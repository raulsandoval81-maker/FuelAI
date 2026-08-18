import {
  buildCorrectedConsentRecord,
  consentRef,
  ConsentAccessError
} from "../_lib/consent.js";

import {
  FieldValue,
  getAdminAuth,
  getAdminDb
} from "../_lib/firebase-admin.js";


function bearerToken(req) {
  const header = String(req.headers?.authorization || "");
  return header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : "";
}


async function requireAdmin(req) {
  const token = bearerToken(req);

  if (!token) {
    throw new ConsentAccessError(
      "Admin authentication is required.",
      "AUTH_REQUIRED",
      401
    );
  }

  const decoded = await getAdminAuth().verifyIdToken(token);
  const adminUid = String(
    process.env.FUELAI_ADMIN_UID || ""
  ).trim();

  if (!adminUid || decoded.uid !== adminUid) {
    throw new ConsentAccessError(
      "Admin access is required.",
      "ADMIN_REQUIRED",
      403
    );
  }

  return decoded;
}


export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({
      error: { code: "METHOD_NOT_ALLOWED", message: "Method not allowed." }
    });
  }

  try {
    const admin = await requireAdmin(req);
    const targetUid = String(req.body?.targetUid || "").trim();

    if (!targetUid) {
      throw new ConsentAccessError(
        "targetUid is required.",
        "TARGET_REQUIRED",
        400
      );
    }

    // Resolve the Authentication user before touching consent so a typo
    // cannot create a correction record for a nonexistent account.
    await getAdminAuth().getUser(targetUid);

    const db = getAdminDb();
    const ref = consentRef(db, targetUid);

    await db.runTransaction(async transaction => {
      const snapshot = await transaction.get(ref);
      const existing = snapshot.exists
        ? snapshot.data() || null
        : null;
      const corrected = buildCorrectedConsentRecord({
        uid: targetUid,
        ageBand: req.body?.ageBand,
        correctedBy: admin.uid,
        existing,
        timestamp: FieldValue.serverTimestamp()
      });

      transaction.set(ref, corrected);
    });

    return res.status(200).json({
      ok: true,
      targetUid,
      status: "AGE_CLASSIFICATION_CORRECTED"
    });
  } catch (error) {
    const safe = error instanceof ConsentAccessError;
    return res.status(safe ? error.statusCode : 500).json({
      error: {
        code: safe ? error.code : "INTERNAL_ERROR",
        message: safe
          ? error.message
          : "FuelAI could not correct the age classification."
      }
    });
  }
}
