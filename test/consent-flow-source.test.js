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
  assert.match(source, /adultConsent\.hidden\s*=\s*ageBandInput\.value !== "18_plus"/);
  assert.match(source, /privacyAccepted\.checked = false/);
  assert.match(source, /termsAccepted\.checked = false/);
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
