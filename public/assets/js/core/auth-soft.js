function normalizeSoftEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}


function getSoftUser() {
  try {
    return JSON.parse(
      localStorage.getItem("fuelai-user") || "{}"
    );
  } catch (error) {
    console.warn(
      "FuelAI user could not be read.",
      error
    );

    return {};
  }
}


function getSoftUserEmail() {
  const user =
    getSoftUser();

  return normalizeSoftEmail(
    user.email
  );
}


function isSoftLoggedIn() {
  const user =
    getSoftUser();

  return Boolean(
    normalizeSoftEmail(user.email) &&
    user.active
  );
}


function softLogin(email) {
  const normalizedEmail =
    normalizeSoftEmail(email);

  if (!normalizedEmail) {
    return false;
  }

  const existingUser =
    getSoftUser();

  const sameUser =
    normalizeSoftEmail(
      existingUser.email
    ) === normalizedEmail;

  localStorage.setItem(
    "fuelai-user",
    JSON.stringify({
      email:
        normalizedEmail,

      active:
        true,

      createdAt:
        sameUser &&
        existingUser.createdAt
          ? existingUser.createdAt
          : new Date().toISOString(),

      lastLoginAt:
        new Date().toISOString()
    })
  );

  return true;
}


async function softLogout() {
  /*
   * Sign out of Firebase when available,
   * then clear the compatibility session.
   *
   * Account-specific setup and plan data
   * remain stored for the next login.
   */

  try {

    if (
      window.FuelAIFirebase
        ?.signOut
    ) {
      await window.FuelAIFirebase
        .signOut();
    }

  } catch (error) {

    console.warn(
      "FuelAI Firebase sign-out failed.",
      error
    );

  }


  localStorage.removeItem(
    "fuelai-user"
  );
}


function requireSoftLogin() {
  if (!isSoftLoggedIn()) {
    window.location.href =
      "/account/login.html";

    return false;
  }

  return true;
}


window.FuelAIAuth = {
  normalizeSoftEmail,
  getSoftUser,
  getSoftUserEmail,
  isSoftLoggedIn,
  softLogin,
  softLogout,
  requireSoftLogin
};