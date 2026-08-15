import {
  cert,
  getApps,
  initializeApp
} from "firebase-admin/app";

import {
  getAuth
} from "firebase-admin/auth";

import {
  FieldValue,
  getFirestore
} from "firebase-admin/firestore";


function requireEnv(name) {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `Missing ${name}`
    );
  }

  return value;
}


function getPrivateKey() {
  const encoded =
    requireEnv(
      "FIREBASE_PRIVATE_KEY_B64"
    );

  return Buffer
    .from(
      encoded,
      "base64"
    )
    .toString(
      "utf8"
    );
}


function getAdminApp() {
  if (getApps().length) {
    return getApps()[0];
  }

  return initializeApp({
    credential:
      cert({
        projectId:
          requireEnv(
            "FIREBASE_PROJECT_ID"
          ),

        clientEmail:
          requireEnv(
            "FIREBASE_CLIENT_EMAIL"
          ),

        privateKey:
          getPrivateKey()
      })
  });
}


export function getAdminAuth() {
  return getAuth(
    getAdminApp()
  );
}


export function getAdminDb() {
  return getFirestore(
    getAdminApp()
  );
}


export {
  FieldValue
};
