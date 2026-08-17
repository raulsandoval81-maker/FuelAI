export function evaluateRegistration({
  ageBand,
  privacyAccepted = false,
  termsAccepted = false
}) {
  if (!ageBand) {
    return {
      allowed: false,
      code: "AGE_REQUIRED"
    };
  }

  if (ageBand === "under_13") {
    return {
      allowed: false,
      code: "AGE_NOT_SUPPORTED"
    };
  }

  if (
    ageBand === "18_plus" &&
    (!privacyAccepted || !termsAccepted)
  ) {
    return {
      allowed: false,
      code: "ACCEPTANCE_REQUIRED"
    };
  }

  if (ageBand !== "13_17" && ageBand !== "18_plus") {
    return {
      allowed: false,
      code: "INVALID_AGE_BAND"
    };
  }

  return {
    allowed: true,
    code: "ALLOWED"
  };
}
