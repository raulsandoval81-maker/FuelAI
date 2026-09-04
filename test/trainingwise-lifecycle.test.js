import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../public/tools/trainingwise/trainingwise-core.js", import.meta.url),
  "utf8"
);

function loadCore() {
  const context = { globalThis: {} };
  vm.runInNewContext(source, context);
  return context.globalThis.TrainingWiseCore;
}

function fakeClock() {
  let nextId = 1;
  const timeouts = new Map();
  const intervals = new Map();
  return {
    timeouts,
    intervals,
    setTimeout(fn) { const id = nextId++; timeouts.set(id, fn); return id; },
    clearTimeout(id) { timeouts.delete(id); },
    setInterval(fn) { const id = nextId++; intervals.set(id, fn); return id; },
    clearInterval(id) { intervals.delete(id); }
  };
}

test("opening countdown runs only for the first start", () => {
  const core = loadCore();
  assert.equal(core.shouldRunOpeningCountdown({ hasStarted: false }), true);
  assert.equal(core.shouldRunOpeningCountdown({ hasStarted: true }), false);
});

test("countdown lifecycle prevents duplicate starts and cancels every callback", () => {
  const core = loadCore();
  const clock = fakeClock();
  const lifecycle = core.createCountdownLifecycle(clock);

  assert.equal(lifecycle.begin(), true);
  assert.equal(lifecycle.begin(), false);
  lifecycle.timeout(() => {}, 1000);
  lifecycle.interval(() => {}, 1000);
  assert.equal(clock.timeouts.size, 1);
  assert.equal(clock.intervals.size, 1);

  lifecycle.cancel();
  assert.equal(clock.timeouts.size, 0);
  assert.equal(clock.intervals.size, 0);
  assert.equal(lifecycle.isActive(), false);
  assert.equal(lifecycle.begin(), true);
});

test("recovery movement scaling exactly matches the selected session", () => {
  const core = loadCore();
  const moves = [{ name: "A", seconds: 60 }, { name: "B", seconds: 120 }];
  const scaled = core.scaleMovementDurations(moves, 900);
  assert.equal(scaled.reduce((sum, move) => sum + move.seconds, 0), 900);
  assert.deepEqual(moves, [{ name: "A", seconds: 60 }, { name: "B", seconds: 120 }]);
});

test("legacy string movements normalize without changing their display name", () => {
  const core = loadCore();
  assert.equal(core.normalizeMovement("Air Squats").id, "air-squat");
  assert.equal(core.getMovementName("Coach Custom Drill"), "Coach Custom Drill");
});

test("movement catalog provides stable metadata without requiring visual assets", () => {
  const core = loadCore();
  assert.ok(core.movementLibrary.length >= 80);
  assert.equal(core.getMovementCoachModel("Air Squats", "current"), null);
  assert.equal(core.getMovementName("Air Squats — 10 reps"), "Air Squats — 10 reps");
});

test("visual coaching supports standard-only, modified-only, both, and neither", () => {
  const core = loadCore();
  const base = { name: "Demo Move" };
  const standard = "/assets/images/trainingwise/demo-standard.webp";
  const modified = "/assets/images/trainingwise/demo-modified.webp";

  assert.equal(core.getMovementCoachModel(base, "current"), null);
  assert.equal(core.getMovementCoachModel({ ...base, standardDemoAsset: standard }, "current").standard.src, standard);
  assert.equal(core.getMovementCoachModel({ ...base, modifiedDemoAsset: modified }, "next").modified.src, modified);
  const both = core.getMovementCoachModel({ ...base, standardDemoAsset: standard, modifiedDemoAsset: modified }, "next");
  assert.equal(both.phase, "next");
  assert.ok(both.standard && both.modified);
});

test("visual coaching rejects non-approved and external asset locations", () => {
  const core = loadCore();
  assert.equal(core.getMovementCoachModel({ name: "Move", standardDemoAsset: "https://example.com/a.webp" }), null);
  assert.equal(core.getMovementCoachModel({ name: "Move", standardDemoAsset: "/other/a.webp" }), null);
});

test("clock-only, unknown next movement, and final movement have no empty visual card", () => {
  const core = loadCore();
  assert.equal(core.getMovementCoachModel("", "current"), null);
  assert.equal(core.getMovementCoachModel(null, "next"), null);
  assert.equal(core.getMovementCoachModel({ name: "Final movement" }, "next"), null);
});

test("TrainingWise source preserves mode-specific cue and round-rest contracts", () => {
  const trainingwise = fs.readFileSync(
    new URL("../public/tools/trainingwise/trainingwise.js", import.meta.url),
    "utf8"
  );

  for (const cue of [
    "Get ready", "Go", "Halfway", "All you got", "Next up",
    "3 more good reps", "Switch", "Stop", "Use the break wisely",
    "SESSION COMPLETE", "YOU'VE BEEN FUELED"
  ]) assert.ok(trainingwise.toLowerCase().includes(cue.toLowerCase()), `missing cue: ${cue}`);

  assert.match(trainingwise, /intervalState\.roundRestSeconds/);
  assert.match(trainingwise, /emomState\.roundRestSeconds/);
  assert.match(trainingwise, /if \(emomState\.hasStarted\)/);
  assert.match(trainingwise, /if \(selfGuidedState\.hasStarted\)/);
});

test("mobile Big Clock is CSS-first and native fullscreen is desktop-only enhancement", () => {
  const trainingwise = fs.readFileSync(
    new URL("../public/tools/trainingwise/trainingwise.js", import.meta.url),
    "utf8"
  );
  const css = fs.readFileSync(
    new URL("../public/tools/trainingwise/trainingwise.css", import.meta.url),
    "utf8"
  );

  assert.match(trainingwise, /function setTrainingwiseStage\(active\)/);
  assert.match(trainingwise, /window\.innerWidth >= 900/);
  assert.match(trainingwise, /visualViewport\?\.height/);
  assert.match(trainingwise, /orientationchange/);
  assert.match(css, /position:\s*fixed !important/);
  assert.match(css, /inset:\s*0 !important/);
  assert.match(css, /100dvh/);
  assert.match(css, /safe-area-inset-top/);
  assert.match(css, /safe-area-inset-bottom/);
});

test("Interval, EMOM, and Tabata share one fullscreen controller", () => {
  const trainingwise = fs.readFileSync(
    new URL("../public/tools/trainingwise/trainingwise.js", import.meta.url),
    "utf8"
  );
  const tabata = fs.readFileSync(
    new URL("../public/tools/trainingwise/trainingwise-tabata.js", import.meta.url),
    "utf8"
  );
  assert.equal((trainingwise.match(/function setTrainingwiseStage\(/g) || []).length, 1);
  assert.equal((trainingwise.match(/requestFullscreen\(/g) || []).length, 1);
  assert.match(trainingwise, /TrainingWiseStageController/);
  assert.match(tabata, /TrainingWiseStageController/);
  assert.equal((tabata.match(/requestFullscreen\(/g) || []).length, 0);
  assert.equal((tabata.match(/document\.body\.classList\.(?:add|remove)\(\s*["']trainingwise-stage/g) || []).length, 0);
});
