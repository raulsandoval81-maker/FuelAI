import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";


test("registration is approved before Firebase account creation", async () => {
  const source = await readFile(
    new URL("../public/account/login.html", import.meta.url),
    "utf8"
  );
  const evaluation = source.indexOf("evaluateRegistration({");
  const allowedGuard = source.indexOf("if (!registration.allowed)");
  const firebaseCreation = source.indexOf("firebase.createAccount(");

  assert.ok(evaluation > -1);
  assert.ok(allowedGuard > evaluation);
  assert.ok(firebaseCreation > allowedGuard);
});


test("registration mode visibly exposes two initially unchecked adult agreements", async () => {
  const source = await readFile(
    new URL("../public/account/login.html", import.meta.url),
    "utf8"
  );

  const registrationStart = source.indexOf('id="registrationFields"');
  const registrationEnd = source.indexOf("</div>", source.indexOf('id="cancelRegistrationBtn"'));
  const registrationMarkup = source.slice(registrationStart, registrationEnd);

  assert.match(registrationMarkup, /id="ageBandInput"/);
  assert.match(registrationMarkup, /id="adultConsent"/);
  assert.equal(
    (registrationMarkup.match(/type="checkbox"/g) || []).length,
    2
  );
  assert.doesNotMatch(registrationMarkup, /type="checkbox"[^>]*checked/);
  assert.match(source, /adultConsent\.hidden = !state\.showAdultAcceptance/);
  assert.match(source, /privacyAccepted\.checked = false/);
  assert.match(source, /termsAccepted\.checked = false/);
});


test("consent age UI renders one readable state and clears stale acceptance", async () => {
  const html = await readFile(
    new URL("../public/account/consent.html", import.meta.url),
    "utf8"
  );
  const script = await readFile(
    new URL("../public/assets/js/account/consent.js", import.meta.url),
    "utf8"
  );
  const css = await readFile(
    new URL("../public/assets/css/site.css", import.meta.url),
    "utf8"
  );

  assert.match(html, /id="ageConsequence"/);
  assert.match(html, /class="goal-select age-gate-select"/);
  assert.match(script, /function renderAgeState/);
  assert.match(script, /adult\.hidden = !state\.showAdultAcceptance/);
  assert.match(script, /privacy\.checked = false/);
  assert.match(script, /terms\.checked = false/);
  assert.match(script, /continueBtn\.disabled =[\s\S]*state\.actionDisabled/);
  assert.match(css, /\.age-gate-select option\{[\s\S]*background:#111827;[\s\S]*color:#f8fafc/);
  assert.match(css, /\.age-gate-select option:checked/);
  assert.match(css, /\.age-consequence\[data-state="blocked"\]/);
  assert.match(css, /\.age-consequence\[data-state="pending_guardian"\]/);
  assert.match(css, /\.age-consequence\[data-state="adult_consent"\]/);
});


test("sign-in is the default mode and does not require registration fields", async () => {
  const source = await readFile(
    new URL("../public/account/login.html", import.meta.url),
    "utf8"
  );

  assert.match(source, /id="registrationFields"[\s\S]*?hidden/);
  assert.doesNotMatch(
    source.match(/<button[\s\S]*?id="signInBtn"[\s\S]*?<\/button>/)?.[0] || "",
    /hidden/
  );
  assert.match(source, /signInBtn\.hidden = enabled/);
  assert.match(source, /registrationFields\.hidden = !enabled/);
  assert.match(source, /if \(registrationFields\.hidden\)[\s\S]*?signIn\(\)/);
});


test("existing setup hydrates before an inactive consent redirect", async () => {
  const source = await readFile(
    new URL("../public/account/login.html", import.meta.url),
    "utf8"
  );
  const hydration = source.indexOf(
    "hydrateAccountCache(\n            record"
  );
  const consentGate = source.indexOf(
    "if (!firebase.consent.getState(consent).active)"
  );

  assert.ok(hydration > -1);
  assert.ok(consentGate > hydration);
});


test("consent and login flows cannot redirect into a consent loop", async () => {
  const authSource = await readFile(
    new URL("../public/assets/js/core/auth-soft.js", import.meta.url),
    "utf8"
  );
  const loginSource = await readFile(
    new URL("../public/account/login.html", import.meta.url),
    "utf8"
  );
  const consentSource = await readFile(
    new URL("../public/account/consent.html", import.meta.url),
    "utf8"
  );

  assert.match(authSource, /path\.startsWith\("\/account\/consent"\)/);
  assert.doesNotMatch(loginSource, /requireSoftLogin\(\)/);
  assert.doesNotMatch(consentSource, /requireSoftLogin\(\)/);
});


test("protected pages require a fresh server consent read", async () => {
  const source = await readFile(
    new URL("../public/assets/js/core/auth-soft.js", import.meta.url),
    "utf8"
  );

  assert.match(source, /await firebase\.getCurrentConsentRecord\(\)/);
  assert.match(source, /The cache can deny early, but it can never grant access/);
});


test("all coach-to-athlete endpoints require target sharing", async () => {
  const endpoints = [
    "../api/team/athlete-profile.js",
    "../api/team/dashboard.js",
    "../api/team/member.js",
    "../api/team/roster.js"
  ];

  for (const endpoint of endpoints) {
    const source = await readFile(new URL(endpoint, import.meta.url), "utf8");
    assert.match(source, /requireTeamSharing\(/, endpoint);
  }
});
