const FUELAI_IDENTITY_KEY =
  "fuelai-identity";


const FUELAI_VALID_ROLES =
  new Set([
    "athlete",
    "coach"
  ]);


const FUELAI_VALID_TEAM_ROLES =
  new Set([
    "athlete",
    "coach",
    "admin"
  ]);


const FUELAI_VALID_TEAM_STATUSES =
  new Set([
    "active",
    "invited",
    "inactive"
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


function normalizeFuelAITeamMembership(
  membership
) {

  if (
    !membership ||
    typeof membership !== "object"
  ) {
    return null;
  }


  const teamId =
    String(
      membership.teamId || ""
    ).trim();


  if (!teamId) {
    return null;
  }


  const role =
    String(
      membership.role || ""
    )
      .trim()
      .toLowerCase();


  const status =
    String(
      membership.status || ""
    )
      .trim()
      .toLowerCase();


  return {

    teamId,

    teamName:
      String(
        membership.teamName || ""
      ).trim(),

    role:
      FUELAI_VALID_TEAM_ROLES
        .has(role)
        ? role
        : "athlete",

    status:
      FUELAI_VALID_TEAM_STATUSES
        .has(status)
        ? status
        : "active",

    joinedAt:
      membership.joinedAt ||
      null

  };

}


function normalizeFuelAITeamMemberships(
  memberships
) {

  if (
    !Array.isArray(
      memberships
    )
  ) {
    return [];
  }


  const normalized =
    memberships
      .map(
        normalizeFuelAITeamMembership
      )
      .filter(Boolean);


  const unique =
    new Map();


  normalized.forEach(
    membership => {

      unique.set(
        membership.teamId,
        membership
      );

    }
  );


  return [
    ...unique.values()
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
        normalizeFuelAITeamMemberships(
          stored.teamMemberships
        ),

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
      normalizeFuelAITeamMemberships(
        identity?.teamMemberships
      ),

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


function setFuelAITeamMemberships(
  memberships
) {

  const current =
    getFuelAIIdentity();


  return saveFuelAIIdentity({
    ...current,

    teamMemberships:
      memberships
  });

}



function addFuelAITeamMembership(
  membership
) {

  const normalized =
    normalizeFuelAITeamMembership(
      membership
    );


  if (!normalized) {
    return false;
  }


  const current =
    getFuelAIIdentity();


  const memberships =
    current.teamMemberships
      .filter(
        item =>
          item.teamId !==
          normalized.teamId
      );


  memberships.push(
    normalized
  );


  return saveFuelAIIdentity({
    ...current,
    teamMemberships:
      memberships
  });

}


function removeFuelAITeamMembership(
  teamId
) {

  const normalizedTeamId =
    String(
      teamId || ""
    ).trim();


  if (!normalizedTeamId) {
    return false;
  }


  const current =
    getFuelAIIdentity();


  return saveFuelAIIdentity({
    ...current,

    teamMemberships:
      current.teamMemberships
        .filter(
          membership =>
            membership.teamId !==
            normalizedTeamId
        )
  });

}


function hasFuelAIActiveTeam() {

  return getFuelAITeamMemberships()
    .some(
      membership =>
        membership.status ===
        "active"
    );

}


window.FuelAIIdentity = {

  getFuelAIIdentity,

  saveFuelAIIdentity,

  setFuelAIRoles,

  hasFuelAIRole,

  getFuelAIUserTypeLabel,

  getFuelAITeamMemberships,

  setFuelAITeamMemberships,

  addFuelAITeamMembership,

  removeFuelAITeamMembership,

  hasFuelAIActiveTeam

};
