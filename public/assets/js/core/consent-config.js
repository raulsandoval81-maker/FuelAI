export const PRIVACY_NOTICE_VERSION =
  "2026-08-17";

export const TERMS_VERSION =
  "2026-08-17";

export const CONSENT_STORAGE_KEY =
  "fuelai-consent";

export const CONSENT_AGE_BANDS =
  new Set([
    "under_13",
    "13_17",
    "18_plus"
  ]);


export function getConsentState(
  record
) {
  if (!record || typeof record !== "object") {
    return {
      active: false,
      reason: "missing"
    };
  }

  if (record.ageBand === "under_13") {
    return {
      active: false,
      reason: "under_13"
    };
  }

  if (record.status === "withdrawn") {
    return {
      active: false,
      reason: "withdrawn"
    };
  }

  if (record.status === "pending_guardian") {
    return {
      active: false,
      reason: "pending_guardian"
    };
  }

  if (
    record.privacyVersion !==
      PRIVACY_NOTICE_VERSION ||
    record.termsVersion !==
      TERMS_VERSION
  ) {
    return {
      active: false,
      reason: "outdated"
    };
  }

  if (
    record.status !== "active" ||
    record.ageBand !== "18_plus" ||
    !record.acceptedAt
  ) {
    return {
      active: false,
      reason: "inactive"
    };
  }

  return {
    active: true,
    reason: "active"
  };
}
