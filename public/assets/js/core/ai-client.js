"use strict";


function createAiRequestId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  const bytes = new Uint8Array(16);
  window.crypto.getRandomValues(bytes);
  bytes[6] =
    (bytes[6] & 0x0f) | 0x40;
  bytes[8] =
    (bytes[8] & 0x3f) | 0x80;

  const hex = [...bytes].map(byte =>
    byte.toString(16).padStart(2, "0")
  );

  return [
    hex.slice(0, 4).join(""),
    hex.slice(4, 6).join(""),
    hex.slice(6, 8).join(""),
    hex.slice(8, 10).join(""),
    hex.slice(10, 16).join("")
  ].join("-");
}


async function getAiAuthToken() {
  if (!window.FuelAIFirebase) {
    await new Promise((resolve, reject) => {
      const timeout = window.setTimeout(
        () => reject(
          new Error(
            "FuelAI sign-in could not be loaded."
          )
        ),
        5000
      );

      window.addEventListener(
        "fuelai:firebase-ready",
        () => {
          window.clearTimeout(timeout);
          resolve();
        },
        { once: true }
      );
    });
  }

  for (let attempt = 0; attempt < 50; attempt++) {
    const user =
      window.FuelAIFirebase
        ?.auth?.currentUser;

    if (user) {
      return user.getIdToken();
    }

    await new Promise(resolve =>
      window.setTimeout(resolve, 100)
    );
  }

  const error = new Error(
    "Sign in to use this FuelAI tool."
  );
  error.code = "AUTH_REQUIRED";
  throw error;
}


window.FuelAIAiClient = {
  createRequestId: createAiRequestId,
  getAuthToken: getAiAuthToken
};
