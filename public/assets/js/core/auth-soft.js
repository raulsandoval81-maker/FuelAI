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
   * park account-owned device data under the
   * verified UID, then clear the compatibility
   * session. A later login restores only data
   * belonging to that same UID.
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

  const path = window.location.pathname;
  const consentExempt =
    path.startsWith("/account/consent") ||
    path.startsWith("/privacy") ||
    path.startsWith("/terms");

  if (!consentExempt) {
    document.documentElement.style.visibility =
      "hidden";
    let consent = null;

    try {
      consent = JSON.parse(
        localStorage.getItem("fuelai-consent") || "null"
      );
    } catch {
      consent = null;
    }

    Promise.all([
      import("./consent-config.js"),
      new Promise((resolve, reject) => {
        if (window.FuelAIFirebase) {
          resolve(window.FuelAIFirebase);
          return;
        }

        const firebaseScript = document.querySelector(
          'script[src*="/assets/js/core/firebase.js"]'
        );

        if (firebaseScript) {
          window.addEventListener(
            "fuelai:firebase-ready",
            () => resolve(window.FuelAIFirebase),
            { once: true }
          );
          return;
        }

        import("./firebase.js")
          .then(() => resolve(window.FuelAIFirebase))
          .catch(reject);
      })
    ])
      .then(async ([{ getConsentState }, firebase]) => {
        // The cache can deny early, but it can never grant access.
        if (!getConsentState(consent).active) {
          window.location.replace(
            "/account/consent.html"
          );
          return;
        }

        const current =
          await firebase.getCurrentConsentRecord();

        if (!getConsentState(current).active) {
          window.location.replace(
            "/account/consent.html"
          );
          return;
        }

        document.documentElement.style.visibility =
          "";
      })
      .catch(() => {
        window.location.replace(
          "/account/consent.html"
        );
      });
  }

  return true;
}


function isAccountBoundaryStorageEvent(
  event
) {
  return Boolean(
    event &&
    event.oldValue !== event.newValue &&
    (
      event.key ===
        "fuelai-account-storage-owner-v1" ||
      event.key === "fuelai-user"
    )
  );
}


window.addEventListener(
  "storage",
  event => {
    if (
      event.storageArea !== localStorage ||
      !isAccountBoundaryStorageEvent(event)
    ) {
      return;
    }

    // Another tab changed the authenticated account.
    // Hide this tab immediately so its previous user's
    // data cannot remain visible or keep accepting input.
    document.documentElement.style.visibility =
      "hidden";

    window.location.reload();
  }
);


window.FuelAIAuth = {
  normalizeSoftEmail,
  getSoftUser,
  getSoftUserEmail,
  isSoftLoggedIn,
  softLogin,
  softLogout,
  requireSoftLogin,
  isAccountBoundaryStorageEvent
};
