import assert from "node:assert/strict";
import test from "node:test";

import {
  buildCorrectedConsentRecord,
  buildConsentRecord,
  getConsentState,
  PRIVACY_NOTICE_VERSION,
  TERMS_VERSION,
  requireActiveConsent,
  requireTeamSharing
} from "../api/_lib/consent.js";

import "../public/assets/js/account/registration-policy.js";

const {
  evaluateRegistration
} = globalThis.FuelAIRegistrationPolicy;

const timestamp = "SERVER_TIMESTAMP";

test("adult activation requires both current acceptances", () => {
  assert.throws(
    () => buildConsentRecord({ uid: "adult", ageBand: "18_plus", privacyAccepted: true, timestamp }),
    error => error.code === "ACCEPTANCE_REQUIRED"
  );
  const record = buildConsentRecord({ uid: "adult", ageBand: "18_plus", privacyAccepted: true, termsAccepted: true, timestamp });
  assert.equal(record.status, "active");
  assert.equal(record.acceptedAt, timestamp);
  assert.equal(record.privacyVersion, PRIVACY_NOTICE_VERSION);
  assert.equal(record.termsVersion, TERMS_VERSION);
  assert.equal(getConsentState(record).active, true);
});

test("an unchanged current acceptance keeps its original acceptance timestamp", () => {
  const original = { uid: "adult", ageBand: "18_plus", status: "active", privacyVersion: PRIVACY_NOTICE_VERSION, termsVersion: TERMS_VERSION, acceptedAt: "ORIGINAL", classifiedAt: "CLASSIFIED" };
  const next = buildConsentRecord({ uid: "adult", ageBand: "18_plus", privacyAccepted: true, termsAccepted: true, existing: original, timestamp });
  assert.equal(next.acceptedAt, "ORIGINAL");
  assert.equal(next.classifiedAt, "CLASSIFIED");
});

test("a changed document version requires re-consent and a new timestamp", () => {
  const next = buildConsentRecord({
    uid: "adult",
    ageBand: "18_plus",
    privacyAccepted: true,
    termsAccepted: true,
    existing: {
      uid: "adult",
      ageBand: "18_plus",
      status: "active",
      privacyVersion: "old",
      termsVersion: TERMS_VERSION,
      acceptedAt: "ORIGINAL"
    },
    timestamp
  });
  assert.equal(next.acceptedAt, timestamp);
  assert.equal(getConsentState(next).active, true);
});

test("under-13 and minor records fail closed", () => {
  const child = buildConsentRecord({ uid: "child", ageBand: "under_13", timestamp });
  const minor = buildConsentRecord({ uid: "minor", ageBand: "13_17", timestamp });
  assert.equal(child.status, "blocked_under_13");
  assert.equal(child.acceptedAt, null);
  assert.equal(getConsentState(child).reason, "under_13");
  assert.equal(minor.status, "pending_guardian");
  assert.equal(getConsentState(minor).reason, "pending_guardian");
});

test("an existing age classification cannot be changed in the app", () => {
  assert.throws(
    () => buildConsentRecord({ uid: "minor", ageBand: "18_plus", privacyAccepted: true, termsAccepted: true, existing: { ageBand: "13_17" }, timestamp }),
    error => error.code === "AGE_BAND_LOCKED"
  );
});

test("admin correction resets acceptance and requires the corrected flow", () => {
  const adult = buildCorrectedConsentRecord({
    uid: "person",
    ageBand: "18_plus",
    correctedBy: "admin",
    existing: { ageBand: "under_13", acceptedAt: "OLD" },
    timestamp
  });
  assert.equal(adult.status, "needs_consent");
  assert.equal(adult.acceptedAt, null);
  assert.equal(adult.previousAgeBand, "under_13");
  assert.equal(adult.correctedBy, "admin");
  assert.equal(getConsentState(adult).active, false);

  const minor = buildCorrectedConsentRecord({
    uid: "person",
    ageBand: "13_17",
    correctedBy: "admin",
    timestamp
  });
  assert.equal(minor.status, "pending_guardian");
});

test("registration policy blocks under-13 and incomplete adult acceptance", () => {
  assert.deepEqual(
    evaluateRegistration({ ageBand: "under_13" }),
    { allowed: false, code: "AGE_NOT_SUPPORTED" }
  );
  assert.deepEqual(
    evaluateRegistration({
      ageBand: "18_plus",
      privacyAccepted: true,
      termsAccepted: false
    }),
    { allowed: false, code: "ACCEPTANCE_REQUIRED" }
  );
  assert.equal(
    evaluateRegistration({
      ageBand: "18_plus",
      privacyAccepted: true,
      termsAccepted: true
    }).allowed,
    true
  );
  assert.equal(
    evaluateRegistration({ ageBand: "13_17" }).allowed,
    true
  );
});

test("missing, outdated, and withdrawn consent are inactive", () => {
  assert.equal(getConsentState(null).reason, "missing");
  assert.equal(getConsentState({ ageBand: "18_plus", status: "active", privacyVersion: "old", termsVersion: TERMS_VERSION, acceptedAt: timestamp }).reason, "outdated");
  const withdrawn = buildConsentRecord({ uid: "adult", action: "withdraw", existing: { ageBand: "18_plus", acceptedAt: "ORIGINAL" }, timestamp });
  assert.equal(getConsentState(withdrawn).reason, "withdrawn");
  assert.equal(withdrawn.acceptedAt, "ORIGINAL");
  assert.equal(withdrawn.withdrawnAt, timestamp);
});

function fakeDb(documents) {
  return {
    collection(name) {
      return {
        doc(id) {
          const parts = [name, id];
          return nested(parts);
        }
      };
    }
  };
  function nested(parts) {
    return {
      collection(name) { return { doc(id) { return nested([...parts, name, id]); } }; },
      async get() {
        const value = documents[parts.join("/")];
        return { exists: value !== undefined, data: () => value };
      }
    };
  }
}

test("AI/server consent enforcement denies inactive states", async () => {
  for (const record of [null, { ageBand: "13_17", status: "pending_guardian" }, { ageBand: "18_plus", status: "withdrawn" }]) {
    const documents = record ? { "users/person/privacy/current": record } : {};
    await assert.rejects(requireActiveConsent("person", fakeDb(documents)), error => error.code === "CONSENT_REQUIRED");
  }
});

test("server consent enforcement rejects a mismatched UID", async () => {
  const record = { uid: "someone-else", ageBand: "18_plus", status: "active", privacyVersion: PRIVACY_NOTICE_VERSION, termsVersion: TERMS_VERSION, acceptedAt: timestamp };
  await assert.rejects(
    requireActiveConsent("person", fakeDb({ "users/person/privacy/current": record })),
    error => error.code === "CONSENT_REQUIRED"
  );
});

test("team sharing requires current consent and explicit current approval", async () => {
  const consent = { uid: "adult", ageBand: "18_plus", status: "active", privacyVersion: PRIVACY_NOTICE_VERSION, termsVersion: TERMS_VERSION, acceptedAt: timestamp };
  const base = { "users/adult/privacy/current": consent };
  await assert.rejects(requireTeamSharing("adult", "team", fakeDb(base)), error => error.code === "TEAM_SHARING_REQUIRED");
  const sharing = { status: "active", privacyVersion: PRIVACY_NOTICE_VERSION, termsVersion: TERMS_VERSION, approvedAt: timestamp };
  assert.equal((await requireTeamSharing("adult", "team", fakeDb({ ...base, "users/adult/teamSharing/team": sharing }))).status, "active");
});
