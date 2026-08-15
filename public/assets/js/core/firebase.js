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
  getFirestore
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

  return credential.user;
}


async function firebaseSignOut() {
  await signOut(auth);
}


function watchAuth(
  callback
) {
  return onAuthStateChanged(
    auth,
    callback
  );
}


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
