function evaluateRegistration({
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


function getAgeGateState(ageBand) {
  const states = {
    "": {
      code: "unselected",
      icon: "ℹ️",
      title: "Choose your age group",
      message: "Your selection determines which authorization steps are required.",
      showAdultAcceptance: false,
      actionDisabled: true,
      registrationAction: "Create New Account",
      consentAction: "Continue"
    },
    under_13: {
      code: "blocked",
      icon: "⛔",
      title: "FuelAI is unavailable for users under 13",
      message: "No FuelAI account can be created or activated for this age group.",
      showAdultAcceptance: false,
      actionDisabled: true,
      registrationAction: "Account Unavailable",
      consentAction: "Account Unavailable"
    },
    "13_17": {
      code: "pending_guardian",
      icon: "⚠️",
      title: "Guardian authorization will be required",
      message: "You may create a pending account, but FuelAI and AI tools stay blocked until guardian authorization and your athlete acknowledgement are completed.",
      showAdultAcceptance: false,
      actionDisabled: false,
      registrationAction: "Create Pending Account",
      consentAction: "Create Pending Account"
    },
    "18_plus": {
      code: "adult_consent",
      icon: "ℹ️",
      title: "Adult consent required",
      message: "Review and accept both the Privacy Notice and Terms before continuing.",
      showAdultAcceptance: true,
      actionDisabled: false,
      registrationAction: "Create Adult Account",
      consentAction: "Accept and Continue"
    }
  };

  return states[ageBand] || states[""];
}


globalThis.FuelAIRegistrationPolicy = {
  evaluateRegistration,
  getAgeGateState
};
