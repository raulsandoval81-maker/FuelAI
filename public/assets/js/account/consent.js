import {
  CONSENT_STORAGE_KEY,
  getConsentState
} from "../core/consent-config.js";

const message = document.getElementById("consentMessage");
const form = document.getElementById("consentForm");
const age = document.getElementById("consentAge");
const adult = document.getElementById("adultAcceptance");
const privacy = document.getElementById("acceptPrivacy");
const terms = document.getElementById("acceptTerms");
const continueBtn = document.getElementById("continueBtn");

function waitForFirebase() {
  if (window.FuelAIFirebase) return Promise.resolve(window.FuelAIFirebase);
  return new Promise(resolve => window.addEventListener(
    "fuelai:firebase-ready",
    () => resolve(window.FuelAIFirebase),
    { once: true }
  ));
}

function explain(reason) {
  const messages = {
    missing: "Choose your age group and record the current consent to continue.",
    outdated: "The Privacy Notice or Terms changed. Review and accept the current versions to continue.",
    withdrawn: "Consent for this account was withdrawn. Record current consent to continue.",
    pending_guardian: "This account is waiting for guardian authorization. FuelAI product and AI access remain blocked.",
    under_13: "FuelAI is not available for users under 13. This account cannot continue.",
    inactive: "Current consent is required before FuelAI can be used."
  };
  return messages[reason] || messages.missing;
}

async function load() {
  const firebase = await waitForFirebase();
  const user = firebase.auth.currentUser || await new Promise(resolve => {
    let stop = () => {};
    stop = firebase.watchAuth(value => { stop(); resolve(value); });
  });
  if (!user) {
    location.replace("/account/login.html");
    return;
  }
  const record = await firebase.getCurrentConsentRecord();
  const state = getConsentState(record);
  if (state.active) {
    location.replace(localStorage.getItem("fuelai-setup") ? "/hub/" : "/account/setup.html");
    return;
  }
  age.value = record?.ageBand || "";
  adult.hidden = age.value !== "18_plus";
  message.textContent = explain(state.reason);
  form.hidden = false;
}

age.addEventListener("change", () => {
  adult.hidden = age.value !== "18_plus";
  if (age.value === "under_13") message.textContent = explain("under_13");
  if (age.value === "13_17") message.textContent = explain("pending_guardian");
});

continueBtn.addEventListener("click", async () => {
  if (!age.value) { message.textContent = "Choose your age group."; return; }
  if (age.value === "18_plus" && (!privacy.checked || !terms.checked)) {
    message.textContent = "Accept both the Privacy Notice and Terms to continue.";
    return;
  }
  continueBtn.disabled = true;
  try {
    const firebase = await waitForFirebase();
    const token = await firebase.auth.currentUser.getIdToken();
    const response = await fetch("/api/consent/record", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ageBand: age.value, privacyAccepted: privacy.checked, termsAccepted: terms.checked })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload?.error?.message || "Consent could not be recorded.");
    const record = await firebase.getCurrentConsentRecord();
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(record));
    const state = getConsentState(record);
    if (state.active) location.replace(localStorage.getItem("fuelai-setup") ? "/hub/" : "/account/setup.html");
    else message.textContent = explain(state.reason);
  } catch (error) {
    message.textContent = error.message;
  } finally {
    continueBtn.disabled = false;
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await window.FuelAIAuth.softLogout();
  location.replace("/account/login.html");
});

load().catch(() => {
  message.textContent = "FuelAI could not check consent. Please sign in again.";
  form.hidden = false;
});
