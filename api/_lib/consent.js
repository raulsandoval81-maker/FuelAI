import {
  CONSENT_AGE_BANDS,
  PRIVACY_NOTICE_VERSION,
  TERMS_VERSION,
  getConsentState
} from "../../public/assets/js/core/consent-config.js";

import {
  FieldValue,
  getAdminDb
} from "./firebase-admin.js";


export class ConsentAccessError extends Error {
  constructor(
    message,
    code = "CONSENT_REQUIRED",
    statusCode = 403
  ) {
    super(message);
    this.name = "ConsentAccessError";
    this.code = code;
    this.statusCode = statusCode;
  }
}


export function consentRef(
  db,
  uid
) {
  return db
    .collection("users")
    .doc(uid)
    .collection("privacy")
    .doc("current");
}


export function teamSharingRef(
  db,
  uid,
  teamId
) {
  return db
    .collection("users")
    .doc(uid)
    .collection("teamSharing")
    .doc(teamId);
}


export function buildConsentRecord({
  uid,
  ageBand,
  privacyAccepted = false,
  termsAccepted = false,
  action = "record",
  existing = null,
  timestamp = FieldValue.serverTimestamp()
}) {
  const safeAgeBand =
    String(ageBand || "").trim();

  if (action === "withdraw") {
    return {
      uid,
      ageBand:
        existing?.ageBand ||
        safeAgeBand ||
        null,
      status: "withdrawn",
      privacyVersion:
        existing?.privacyVersion ||
        PRIVACY_NOTICE_VERSION,
      termsVersion:
        existing?.termsVersion ||
        TERMS_VERSION,
      acceptedAt:
        existing?.acceptedAt ||
        null,
      classifiedAt:
        existing?.classifiedAt ||
        timestamp,
      withdrawnAt: timestamp,
      updatedAt: timestamp
    };
  }

  if (!CONSENT_AGE_BANDS.has(safeAgeBand)) {
    throw new ConsentAccessError(
      "Choose a valid age group.",
      "INVALID_AGE_BAND",
      400
    );
  }


  if (
    existing?.ageBand &&
    existing.ageBand !== safeAgeBand
  ) {
    throw new ConsentAccessError(
      "This account's age classification cannot be changed in the app.",
      "AGE_BAND_LOCKED",
      409
    );
  }

  if (safeAgeBand === "under_13") {
    return {
      uid,
      ageBand: safeAgeBand,
      status: "blocked_under_13",
      privacyVersion:
        PRIVACY_NOTICE_VERSION,
      termsVersion:
        TERMS_VERSION,
      acceptedAt: null,
      classifiedAt:
        existing?.classifiedAt ||
        timestamp,
      withdrawnAt: null,
      updatedAt: timestamp
    };
  }

  if (safeAgeBand === "13_17") {
    return {
      uid,
      ageBand: safeAgeBand,
      status: "pending_guardian",
      privacyVersion:
        PRIVACY_NOTICE_VERSION,
      termsVersion:
        TERMS_VERSION,
      acceptedAt: null,
      classifiedAt:
        existing?.classifiedAt ||
        timestamp,
      withdrawnAt: null,
      updatedAt: timestamp
    };
  }

  if (!privacyAccepted || !termsAccepted) {
    throw new ConsentAccessError(
      "Accept the current Privacy Notice and Terms to continue.",
      "ACCEPTANCE_REQUIRED",
      400
    );
  }

  const sameCurrentAcceptance =
    existing?.status === "active" &&
    existing?.ageBand === "18_plus" &&
    existing?.privacyVersion ===
      PRIVACY_NOTICE_VERSION &&
    existing?.termsVersion ===
      TERMS_VERSION &&
    existing?.acceptedAt;

  return {
    uid,
    ageBand: safeAgeBand,
    status: "active",
    privacyVersion:
      PRIVACY_NOTICE_VERSION,
    termsVersion:
      TERMS_VERSION,
    acceptedAt:
      sameCurrentAcceptance
        ? existing.acceptedAt
        : timestamp,
    classifiedAt:
      existing?.classifiedAt ||
      timestamp,
    withdrawnAt: null,
    updatedAt: timestamp
  };
}


export async function getConsentRecord(
  uid,
  db = getAdminDb()
) {
  const snapshot =
    await consentRef(db, uid).get();

  return snapshot.exists
    ? snapshot.data() || null
    : null;
}


export async function requireActiveConsent(
  uid,
  db = getAdminDb()
) {
  const record =
    await getConsentRecord(uid, db);
  const state =
    getConsentState(record);

  if (!state.active || record?.uid !== uid) {
    throw new ConsentAccessError(
      state.reason === "under_13"
        ? "FuelAI is not available for users under 13."
        : "Current FuelAI consent is required.",
      state.reason === "under_13"
        ? "AGE_NOT_SUPPORTED"
        : "CONSENT_REQUIRED"
    );
  }

  return record;
}


export async function requireTeamSharing(
  uid,
  teamId,
  db = getAdminDb()
) {
  await requireActiveConsent(uid, db);

  const snapshot =
    await teamSharingRef(
      db,
      uid,
      teamId
    ).get();
  const sharing = snapshot.exists
    ? snapshot.data() || {}
    : {};

  if (
    sharing.status !== "active" ||
    sharing.privacyVersion !==
      PRIVACY_NOTICE_VERSION ||
    sharing.termsVersion !==
      TERMS_VERSION ||
    !sharing.approvedAt
  ) {
    throw new ConsentAccessError(
      "Team sharing approval is required.",
      "TEAM_SHARING_REQUIRED"
    );
  }

  return sharing;
}

export {
  PRIVACY_NOTICE_VERSION,
  TERMS_VERSION,
  getConsentState
};
