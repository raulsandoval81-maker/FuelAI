import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const siteCss = fs.readFileSync(
  new URL("../public/assets/css/site.css", import.meta.url),
  "utf8"
);
const navCss = fs.readFileSync(
  new URL("../public/assets/css/nav.css", import.meta.url),
  "utf8"
);

test("shared FuelAI shell defines one outer width and responsive spacing", () => {
  assert.match(siteCss, /--fuelai-shell-max:1100px/);
  assert.match(siteCss, /body > main\[class\]/);
  assert.match(siteCss, /--fuelai-shell-inline:12px/);
  assert.match(siteCss, /--fuelai-shell-top:18px/);
});

test("shared footer and keyboard-focus treatment remain centralized", () => {
  assert.match(siteCss, /\.trainingwise-footer-link/);
  assert.match(siteCss, /\.sandman-footer/);
  assert.match(siteCss, /:focus-visible/);
});

test("navigation drawer uses dynamic viewport and locks background scroll", () => {
  assert.match(navCss, /height:\s*100dvh/);
  assert.match(navCss, /safe-area-inset-top/);
  assert.match(navCss, /body\.fuelai-nav-open/);
  assert.match(navCss, /overflow:\s*hidden/);
});

