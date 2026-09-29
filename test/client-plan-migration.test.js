import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../public/assets/js/core/plan.js", import.meta.url),
  "utf8"
);

function loadPlan({ setup = {}, plan = null, beta = null } = {}) {
  const storage = new Map();
  storage.set("fuelai-setup", JSON.stringify(setup));
  if (plan !== null) storage.set("fuelai-plan", plan);
  if (beta !== null) storage.set("fuelai-beta-access", JSON.stringify(beta));

  const localStorage = {
    getItem(key) { return storage.has(key) ? storage.get(key) : null; },
    setItem(key, value) { storage.set(key, String(value)); },
    removeItem(key) { storage.delete(key); }
  };

  const context = {
    window: {},
    localStorage,
    console
  };

  vm.runInNewContext(source, context);
  return { api: context.window.FuelAIPlan, storage };
}

test("canonical client plans match server naming", () => {
  const { api } = loadPlan();
  assert.deepEqual(
    Array.from(api.canonicalPlans),
    ["wellness", "fitness", "sports", "combat"]
  );
});

test("profiles receive canonical default plans", () => {
  const cases = [
    ["general-health", "wellness"],
    ["fitness-enthusiast", "fitness"],
    ["sports-athlete", "sports"],
    ["combat-athlete", "combat"]
  ];

  for (const [lifestyleType, expected] of cases) {
    const { api } = loadPlan({ setup: { lifestyleType } });
    assert.equal(api.getFuelAIPlan(), expected);
  }
});

test("legacy free maps to wellness", () => {
  const { api } = loadPlan({ plan: "free" });
  assert.equal(api.getFuelAIPlan(), "wellness");
  assert.equal(api.getFuelAIPlanMigration().status, "mapped");
});

test("legacy standard and plus preserve profile lane", () => {
  assert.equal(
    loadPlan({ setup: { lifestyleType: "fitness-enthusiast" }, plan: "standard" }).api.getFuelAIPlan(),
    "fitness"
  );
  assert.equal(
    loadPlan({ setup: { lifestyleType: "sports-athlete" }, plan: "standard" }).api.getFuelAIPlan(),
    "sports"
  );
  assert.equal(
    loadPlan({ setup: { lifestyleType: "combat-athlete" }, plan: "plus" }).api.getFuelAIPlan(),
    "combat"
  );
});

test("explicit migration rewrites legacy storage to canonical value", () => {
  const { api, storage } = loadPlan({
    setup: { lifestyleType: "combat-athlete" },
    plan: "plus"
  });
  const result = api.migrateStoredFuelAIPlan();
  assert.equal(result.status, "migrated");
  assert.equal(storage.get("fuelai-plan"), "combat");
});

test("setFuelAIPlan writes canonical values even when given a legacy alias", () => {
  const { api, storage } = loadPlan({ setup: { lifestyleType: "sports-athlete" } });
  assert.equal(api.setFuelAIPlan("standard"), true);
  assert.equal(storage.get("fuelai-plan"), "sports");
});

test("beta access translates legacy access levels without mutating stored data", () => {
  const { api } = loadPlan({
    setup: { lifestyleType: "combat-athlete" },
    beta: { enabled: true, accessLevel: "plus", cohort: "beta" }
  });
  const beta = api.getFuelAIBetaAccess();
  assert.equal(beta.accessLevel, "combat");
  assert.equal(beta.migrationStatus, "mapped");
  assert.equal(api.getFuelAIEffectivePlan(), "combat");
});

test("canonical tool gates preserve the previous access surface", () => {
  const fitness = loadPlan({
    setup: { lifestyleType: "fitness-enthusiast" },
    plan: "fitness"
  }).api;
  assert.equal(fitness.canUseFuelAITool("trainingwise"), true);
  assert.equal(fitness.canUseFuelAITool("weightwise"), false);

  const combat = loadPlan({
    setup: { lifestyleType: "combat-athlete" },
    plan: "combat"
  }).api;
  assert.equal(combat.canUseFuelAITool("trainingwise"), true);
  assert.equal(combat.canUseFuelAITool("weightwise"), true);
});
