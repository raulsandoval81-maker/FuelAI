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

test("legacy free is the only automatic plan migration", () => {
  const { api, storage } = loadPlan({ plan: "free" });
  assert.equal(api.getFuelAIPlan(), "wellness");
  assert.equal(api.getFuelAIPlanMigration().status, "mapped");

  const result = api.migrateStoredFuelAIPlan();
  assert.equal(result.status, "migrated");
  assert.equal(storage.get("fuelai-plan"), "wellness");
});

test("legacy standard and plus are detected but never silently converted", () => {
  for (const legacyPlan of ["standard", "plus", "basic"]) {
    const { api, storage } = loadPlan({
      setup: { lifestyleType: "combat-athlete" },
      plan: legacyPlan
    });

    const migration = api.getFuelAIPlanMigration();
    assert.equal(migration.status, "migration_required");
    assert.equal(migration.plan, null);
    assert.equal(storage.get("fuelai-plan"), legacyPlan);
    assert.equal(api.migrateStoredFuelAIPlan().status, "migration_required");
    assert.equal(storage.get("fuelai-plan"), legacyPlan);
  }
});

test("ambiguous legacy plans fall back to the profile canonical starting plan", () => {
  const cases = [
    ["general-health", "standard", "wellness"],
    ["fitness-enthusiast", "standard", "fitness"],
    ["sports-athlete", "standard", "sports"],
    ["combat-athlete", "plus", "combat"]
  ];

  for (const [lifestyleType, legacyPlan, expected] of cases) {
    const { api } = loadPlan({ setup: { lifestyleType }, plan: legacyPlan });
    assert.equal(api.getFuelAIPlan(), expected);
  }
});

test("setFuelAIPlan accepts only canonical values or the safe free alias", () => {
  const { api, storage } = loadPlan({ setup: { lifestyleType: "sports-athlete" } });

  assert.equal(api.setFuelAIPlan("sports"), true);
  assert.equal(storage.get("fuelai-plan"), "sports");

  assert.equal(api.setFuelAIPlan("standard"), false);
  assert.equal(storage.get("fuelai-plan"), "sports");

  assert.equal(api.setFuelAIPlan("free"), true);
  assert.equal(storage.get("fuelai-plan"), "wellness");
});

test("ambiguous beta access never fabricates a paid entitlement", () => {
  const { api } = loadPlan({
    setup: { lifestyleType: "combat-athlete" },
    beta: { enabled: true, accessLevel: "plus", cohort: "beta" }
  });

  const beta = api.getFuelAIBetaAccess();
  assert.equal(beta.accessLevel, null);
  assert.equal(beta.migrationStatus, "migration_required");
  assert.equal(beta.legacyAccessLevel, "plus");
  assert.equal(api.getFuelAIEffectivePlan(), "combat");
});

test("canonical tool gates preserve the intended client feature surface", () => {
  const fitness = loadPlan({
    setup: { lifestyleType: "fitness-enthusiast" },
    plan: "fitness"
  }).api;
  assert.equal(fitness.canUseFuelAITool("trainingwise"), true);
  assert.equal(fitness.canUseFuelAITool("weightwise"), false);

  const sports = loadPlan({
    setup: { lifestyleType: "sports-athlete" },
    plan: "sports"
  }).api;
  assert.equal(sports.canUseFuelAITool("trainingwise"), true);
  assert.equal(sports.canUseFuelAITool("weightwise"), false);

  const combat = loadPlan({
    setup: { lifestyleType: "combat-athlete" },
    plan: "combat"
  }).api;
  assert.equal(combat.canUseFuelAITool("trainingwise"), true);
  assert.equal(combat.canUseFuelAITool("weightwise"), true);
});
