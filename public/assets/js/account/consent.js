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
const consequence = document.getElementById("ageConsequence");
const consequenceTitle = document.getElementById("ageConsequenceTitle");
const consequenceText = document.getElementById("ageConsequenceText");
const getAgeGateState =
  window.FuelAIRegistrationPolicy.getAgeGateState;
let ageLocked = false;

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

function showStatus(text) {
  message.textContent = text;
  message.hidden = !text;
}

function renderAgeState(
  ageBand,
  { resetAcceptances = true } = {}
) {
  const state = getAgeGateState(ageBand);

  consequence.dataset.state = state.code;
  consequenceTitle.textContent = state.title;
  consequenceText.textContent = state.message;
  adult.hidden = !state.showAdultAcceptance;
  continueBtn.textContent = state.consentAction;
  continueBtn.disabled =
    state.actionDisabled ||
    (
      ageLocked &&
      ageBand !== "18_plus"
    );

  if (resetAcceptances) {
    privacy.checked = false;
    terms.checked = false;
  }

  return state;
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
  ageLocked = Boolean(record?.ageBand);
  age.disabled = ageLocked;
  renderAgeState(age.value, {
    resetAcceptances: true
  });
  showStatus(explain(state.reason));
  form.hidden = false;
}

age.addEventListener("change", () => {
  showStatus("");
  renderAgeState(age.value);
});

continueBtn.addEventListener("click", async () => {
  const ageState = renderAgeState(age.value, {
    resetAcceptances: false
  });
  if (ageState.actionDisabled) {
    showStatus(ageState.message);
    return;
  }
  if (!age.value) { showStatus("Choose your age group."); return; }
  if (age.value === "18_plus" && (!privacy.checked || !terms.checked)) {
    showStatus("Accept both the Privacy Notice and Terms to continue.");
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
    else {
      ageLocked = Boolean(record?.ageBand);
      age.disabled = ageLocked;
      renderAgeState(record?.ageBand || age.value, {
        resetAcceptances: false
      });
      showStatus(explain(state.reason));
    }
  } catch (error) {
    showStatus(error.message);
  } finally {
    renderAgeState(age.value, {
      resetAcceptances: false
    });
  }
});

document.getElementById("logoutBtn").addEventListener("click", async () => {
  await window.FuelAIAuth.softLogout();
  location.replace("/account/login.html");
});

load().catch(() => {
  showStatus("FuelAI could not check consent. Please sign in again.");
  renderAgeState("");
  form.hidden = false;
});
