import {
  activateAccountStorage,
  logoutAccountStorage
} from "./account-storage.js";

import {
  CONSENT_STORAGE_KEY,
  PRIVACY_NOTICE_VERSION,
  TERMS_VERSION,
  getConsentState
} from "./consent-config.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  collectionGroup,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";


const firebaseConfig = {
  apiKey:
    "AIzaSyB-XMYTxae3fzUfiteGT26tV-0y61PK4Vc",

  authDomain:
    "fuelai-app.firebaseapp.com",

  projectId:
    "fuelai-app",

  storageBucket:
    "fuelai-app.firebasestorage.app",

  messagingSenderId:
    "144354006763",

  appId:
    "1:144354006763:web:66a1de0a5bb291d25cd0ae"
};


const app =
  initializeApp(
    firebaseConfig
  );


const auth =
  getAuth(app);


const db =
  getFirestore(app);


async function createAccount(
  email,
  password
) {
  const credential =
    await createUserWithEmailAndPassword(
      auth,
      String(email || "")
        .trim()
        .toLowerCase(),
      password
    );

  activateAccountStorage(
    credential.user.uid,
    globalThis.localStorage,
    credential.user.email
  );

  return credential.user;
}


async function signIn(
  email,
  password
) {
  const credential =
    await signInWithEmailAndPassword(
      auth,
      String(email || "")
        .trim()
        .toLowerCase(),
      password
    );

  activateAccountStorage(
    credential.user.uid,
    globalThis.localStorage,
    credential.user.email
  );

  return credential.user;
}


async function firebaseSignOut() {
  logoutAccountStorage(
    auth.currentUser?.uid
  );

  await signOut(auth);
}


function watchAuth(
  callback
) {
  return onAuthStateChanged(
    auth,
    user => {
      if (user?.uid) {
        activateAccountStorage(
          user.uid,
          globalThis.localStorage,
          user.email
        );
      }

      callback(user);
    }
  );
}


onAuthStateChanged(
  auth,
  user => {
    if (user?.uid) {
      activateAccountStorage(
        user.uid,
        globalThis.localStorage,
        user.email
      );
    }
  }
);


window.FuelAIFirebase = {
  app,
  auth,
  db,

  projectId:
    firebaseConfig.projectId,

  createAccount,
  signIn,

  signOut:
    firebaseSignOut,

  watchAuth
};


window.dispatchEvent(
  new CustomEvent(
    "fuelai:firebase-ready"
  )
);


console.info(
  "FuelAI Firebase connected:",
  firebaseConfig.projectId
);


async function saveCurrentUserRecord(
  data = {}
) {

  const user =
    auth.currentUser;


  if (!user) {
    throw new Error(
      "No Firebase user is signed in."
    );
  }


  const ref =
    doc(
      db,
      "users",
      user.uid
    );


  await setDoc(
    ref,
    {
      uid:
        user.uid,

      email:
        user.email ||
        "",

      ...data,

      updatedAt:
        serverTimestamp()
    },
    {
      merge: true
    }
  );


  return true;
}


async function getCurrentUserRecord() {

  const user =
    auth.currentUser;


  if (!user) {
    return null;
  }


  const ref =
    doc(
      db,
      "users",
      user.uid
    );


  const snapshot =
    await getDoc(
      ref
    );


  if (
    !snapshot.exists()
  ) {
    return null;
  }


  return {
    id:
      snapshot.id,

    ...snapshot.data()
  };
}


async function getCurrentConsentRecord() {
  const user = auth.currentUser;

  if (!user) {
    return null;
  }

  const token = await user.getIdToken();
  const response = await fetch("/api/consent/record", {
    headers: { Authorization: `Bearer ${token}` }
  });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
      "FuelAI could not check consent."
    );
  }
  const record = payload.consent || null;

  if (record) {
    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(record)
    );
  } else {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
  }

  return record;
}


window.FuelAIFirebase
  .saveCurrentUserRecord =
    saveCurrentUserRecord;


window.FuelAIFirebase
  .getCurrentUserRecord =
    getCurrentUserRecord;

window.FuelAIFirebase
  .getCurrentConsentRecord =
    getCurrentConsentRecord;

window.FuelAIFirebase.consent = {
  privacyVersion: PRIVACY_NOTICE_VERSION,
  termsVersion: TERMS_VERSION,
  getState: getConsentState
};


async function getCurrentUserTeamMemberships() {

  const user =
    auth.currentUser;


  if (!user) {
    return [];
  }


  const membershipsQuery =
    query(
      collectionGroup(
        db,
        "members"
      ),
      where(
        "uid",
        "==",
        user.uid
      )
    );


  const snapshot =
    await getDocs(
      membershipsQuery
    );


  const memberships =
    [];


  for (
    const memberDoc
    of snapshot.docs
  ) {

    const memberData =
      memberDoc.data();


    /*
     * Secure Firestore rules intentionally
     * deny team data to inactive/invited
     * memberships. Skip those records before
     * attempting the team document read so one
     * stale membership cannot break hydration
     * of the user's active teams.
     */
    if (
      memberData.status !==
      "active"
    ) {
      continue;
    }


    const teamRef =
      memberDoc.ref.parent.parent;


    if (!teamRef) {
      continue;
    }


    const teamSnapshot =
      await getDoc(
        teamRef
      );


    if (!teamSnapshot.exists()) {
      continue;
    }


    const teamData =
      teamSnapshot.data();


    memberships.push({

      teamId:
        teamRef.id,

      teamName:
        teamData.name ||
        "",

      role:
        memberData.role ||
        "athlete",

      status:
        memberData.status ||
        "inactive",

      joinedAt:
        memberData.joinedAt
          ?.toDate?.()
          ?.toISOString?.() ||
        null

    });

  }


  return memberships;
}


window.FuelAIFirebase
  .getCurrentUserTeamMemberships =
    getCurrentUserTeamMemberships;
