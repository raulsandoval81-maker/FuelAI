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


test("registration and consent messages use labelled high-contrast alert panels", async () => {
  const login = await readFile(
    new URL("../public/account/login.html", import.meta.url),
    "utf8"
  );
  const consentHtml = await readFile(
    new URL("../public/account/consent.html", import.meta.url),
    "utf8"
  );
  const consentScript = await readFile(
    new URL("../public/assets/js/account/consent.js", import.meta.url),
    "utf8"
  );
  const css = await readFile(
    new URL("../public/assets/css/site.css", import.meta.url),
    "utf8"
  );

  for (const source of [login, consentHtml]) {
    assert.match(source, /class="status-panel"/);
    assert.match(source, /class="status-icon"/);
    assert.match(source, /role="status"/);
    assert.match(source, /aria-live="polite"/);
  }
  assert.match(login, /kind === "error" \? "alert" : "status"/);
  assert.match(login, /kind === "error" \? "assertive" : "polite"/);
  assert.match(login, /label: "Acceptance required"/);
  assert.match(login, /label: "Account unavailable"/);
  assert.match(login, /label: "Account creation error"/);
  assert.match(consentScript, /statusPresentation/);
  assert.match(consentScript, /pending_guardian: \{ kind: "warning"/);
  assert.match(consentScript, /under_13: \{ kind: "error"/);
  assert.match(consentScript, /label: "Connection error"/);
  assert.match(css, /\.status-panel\[data-kind="error"\]\{[\s\S]*background:#4c0519;[\s\S]*color:#fff1f2/);
  assert.match(css, /body\[data-theme="day"\] \.status-panel\[data-kind="error"\]\{[\s\S]*background:#fff1f2;[\s\S]*color:#881337/);
  assert.match(css, /@media\(max-width:480px\)\{[\s\S]*\.status-panel/);
});


test("error-panel text colors meet WCAG AA contrast in day and night modes", () => {
  function luminance(hex) {
    const rgb = hex.match(/[a-f\d]{2}/gi).map(value => {
      const channel = parseInt(value, 16) / 255;
      return channel <= 0.03928
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  function contrast(foreground, background) {
    const light = Math.max(luminance(foreground), luminance(background));
    const dark = Math.min(luminance(foreground), luminance(background));
    return (light + 0.05) / (dark + 0.05);
  }

  assert.ok(contrast("#fff1f2", "#4c0519") >= 4.5);
  assert.ok(contrast("#881337", "#fff1f2") >= 4.5);
  assert.ok(contrast("#fef3c7", "#422006") >= 4.5);
  assert.ok(contrast("#78350f", "#fffbeb") >= 4.5);
});


test("legal pages and consent surfaces share accessible branded navigation", async () => {
  const login = await readFile(
    new URL("../public/account/login.html", import.meta.url),
    "utf8"
  );
  const consent = await readFile(
    new URL("../public/account/consent.html", import.meta.url),
    "utf8"
  );
  const privacy = await readFile(
    new URL("../public/privacy/index.html", import.meta.url),
    "utf8"
  );
  const terms = await readFile(
    new URL("../public/terms/index.html", import.meta.url),
    "utf8"
  );
  const css = await readFile(
    new URL("../public/assets/css/site.css", import.meta.url),
    "utf8"
  );

  for (const source of [login, consent, privacy, terms]) {
    assert.match(source, /FuelAI™[\s\S]*Powered by Sandman™/);
    assert.match(source, /class="legal-footer"/);
    assert.match(source, /href="\/privacy\/"|Privacy Notice/);
    assert.match(source, /href="\/terms\/"|>Terms</);
  }

  for (const source of [privacy, terms]) {
    assert.match(source, /class="scan-card legal-document"/);
    assert.match(source, /class="legal-meta"/);
    assert.match(source, /Effective date/);
    assert.match(source, /class="legal-support"/);
    assert.match(source, /Back to Consent/);
    assert.match(source, /Back to Sign In/);
  }

  assert.match(css, /\.legal-document\{[\s\S]*max-width:760px/);
  assert.match(css, /\.legal-document a:visited/);
  assert.match(css, /\.legal-document a:hover/);
  assert.match(css, /\.legal-document a:focus-visible/);
  assert.match(css, /text-decoration-line:underline/);
  assert.match(css, /body\[data-theme="day"\] \.legal-document a/);
  assert.match(css, /@media\(max-width:480px\)\{[\s\S]*\.legal-page/);
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
