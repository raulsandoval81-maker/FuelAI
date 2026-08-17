import {
  buildConsentRecord,
  consentRef,
  ConsentAccessError,
  getConsentState
} from "../_lib/consent.js";

import {
  FieldValue,
  getAdminAuth,
  getAdminDb
} from "../_lib/firebase-admin.js";


function bearerToken(req) {
  const header = String(
    req.headers?.authorization || ""
  );

  return header.startsWith("Bearer ")
    ? header.slice(7).trim()
    : "";
}


export default async function handler(
  req,
  res
) {
  res.setHeader("Cache-Control", "no-store");

  if (!["GET", "POST"].includes(req.method)) {
    return res.status(405).json({
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Method not allowed."
      }
    });
  }

  try {
    const token = bearerToken(req);

    if (!token) {
      throw new ConsentAccessError(
        "Sign in to record consent.",
        "AUTH_REQUIRED",
        401
      );
    }

    const user =
      await getAdminAuth()
        .verifyIdToken(token);
    const db = getAdminDb();
    const ref = consentRef(db, user.uid);

    if (req.method === "GET") {
      const snapshot = await ref.get();
      const record = snapshot.exists
        ? snapshot.data() || null
        : null;

      return res.status(200).json({
        ok: true,
        consent: record,
        access: getConsentState(record)
      });
    }

    await db.runTransaction(
        async transaction => {
          const snapshot =
            await transaction.get(ref);
          const existing = snapshot.exists
            ? snapshot.data() || null
            : null;
          const next = buildConsentRecord({
            uid: user.uid,
            ageBand: req.body?.ageBand,
            privacyAccepted:
              req.body?.privacyAccepted === true,
            termsAccepted:
              req.body?.termsAccepted === true,
            action:
              req.body?.action || "record",
            existing,
            timestamp:
              FieldValue.serverTimestamp()
          });

          transaction.set(ref, next);
        }
      );

    const written = await ref.get();
    const record = written.data() || null;

    return res.status(200).json({
      ok: true,
      consent: record,
      access: getConsentState(record)
    });
  } catch (error) {
    const safe =
      error instanceof ConsentAccessError;

    return res
      .status(safe ? error.statusCode : 500)
      .json({
        error: {
          code:
            safe
              ? error.code
              : "INTERNAL_ERROR",
          message:
            safe
              ? error.message
              : "FuelAI could not record consent."
        }
      });
  }
}
