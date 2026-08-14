const FUELAI_IDENTITY_KEY =
  "fuelai-identity";


const FUELAI_VALID_ROLES =
  new Set([
    "athlete",
    "coach"
  ]);


function normalizeFuelAIRoles(
  roles
) {

  if (
    !Array.isArray(
      roles
    )
  ) {
    return [];
  }


  return [
    ...new Set(
      roles
        .map(
          role =>
            String(
              role || ""
            )
              .trim()
              .toLowerCase()
        )
        .filter(
          role =>
            FUELAI_VALID_ROLES
              .has(role)
        )
    )
  ];

}


function getFuelAIIdentity() {

  try {

    const stored =
      JSON.parse(
        localStorage.getItem(
          FUELAI_IDENTITY_KEY
        ) || "{}"
      );


    return {

      roles:
        normalizeFuelAIRoles(
          stored.roles
        ),

      teamMemberships:
        Array.isArray(
          stored.teamMemberships
        )
          ? stored.teamMemberships
          : [],

      updatedAt:
        stored.updatedAt ||
        null

    };

  }

  catch (error) {

    console.warn(
      "Unable to read FuelAI identity.",
      error
    );


    return {
      roles: [],
      teamMemberships: [],
      updatedAt: null
    };

  }

}


function saveFuelAIIdentity(
  identity
) {

  const normalized = {

    roles:
      normalizeFuelAIRoles(
        identity?.roles
      ),

    teamMemberships:
      Array.isArray(
        identity?.teamMemberships
      )
        ? identity.teamMemberships
        : [],

    updatedAt:
      new Date()
        .toISOString()

  };


  localStorage.setItem(
    FUELAI_IDENTITY_KEY,
    JSON.stringify(
      normalized
    )
  );


  return normalized;

}


function setFuelAIRoles(
  roles
) {

  const current =
    getFuelAIIdentity();


  return saveFuelAIIdentity({
    ...current,
    roles
  });

}


function hasFuelAIRole(
  role
) {

  const normalized =
    String(
      role || ""
    )
      .trim()
      .toLowerCase();


  return getFuelAIIdentity()
    .roles
    .includes(
      normalized
    );

}


function getFuelAIUserTypeLabel() {

  const roles =
    getFuelAIIdentity()
      .roles;


  const athlete =
    roles.includes(
      "athlete"
    );

  const coach =
    roles.includes(
      "coach"
    );


  if (
    athlete &&
    coach
  ) {
    return "Athlete + Coach";
  }


  if (coach) {
    return "Coach";
  }


  if (athlete) {
    return "Athlete";
  }


  return "Individual";

}


function getFuelAITeamMemberships() {

  return [
    ...getFuelAIIdentity()
      .teamMemberships
  ];

}


window.FuelAIIdentity = {

  getFuelAIIdentity,

  saveFuelAIIdentity,

  setFuelAIRoles,

  hasFuelAIRole,

  getFuelAIUserTypeLabel,

  getFuelAITeamMemberships

};
