import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(
  new URL("../public/tools/trainingwise/trainingwise-runtime.js", import.meta.url),
  "utf8"
);

function createHarness({ wakeLock = null } = {}) {
  let now = 0;
  let nextId = 1;
  const intervals = new Map();
  const documentListeners = new Map();
  const windowListeners = new Map();
  const elements = new Map();

  class FakeElement {}

  const document = {
    visibilityState: "visible",
    addEventListener(type, callback) {
      documentListeners.set(type, callback);
    },
    getElementById(id) {
      return elements.get(id) || null;
    }
  };

  const window = {
    performance: { now: () => now },
    setInterval(callback, delay) {
      const id = nextId++;
      intervals.set(id, { callback, delay });
      return id;
    },
    clearInterval(id) {
      intervals.delete(id);
    },
    setTimeout(callback) {
      callback();
      return nextId++;
    },
    addEventListener(type, callback) {
      windowListeners.set(type, callback);
    }
  };

  const navigator = wakeLock ? { wakeLock } : {};

  vm.runInNewContext(source, {
    window,
    document,
    navigator,
    Element: FakeElement,
    Date,
    console
  });

  return {
    window,
    document,
    intervals,
    documentListeners,
    windowListeners,
    elements,
    setNow(value) {
      now = value;
    }
  };
}

test("one-second TrainingWise intervals reconcile delayed browser callbacks", () => {
  const harness = createHarness();
  let ticks = 0;

  const timerId = harness.window.setInterval(() => {
    ticks += 1;
  }, 1000);

  const driver = harness.intervals.get(timerId);
  assert.equal(driver.delay, 200);

  harness.setNow(3400);
  driver.callback();
  assert.equal(ticks, 3);

  harness.setNow(5100);
  driver.callback();
  assert.equal(ticks, 5);

  harness.window.clearInterval(timerId);
  assert.equal(harness.intervals.has(timerId), false);
});

test("non-timer intervals keep their original cadence", () => {
  const harness = createHarness();
  const id = harness.window.setInterval(() => {}, 500);
  assert.equal(harness.intervals.get(id).delay, 500);
});

test("visibility return flushes elapsed timer time immediately", () => {
  const harness = createHarness();
  let ticks = 0;

  harness.window.setInterval(() => {
    ticks += 1;
  }, 1000);

  harness.setNow(2200);
  harness.document.visibilityState = "visible";
  harness.documentListeners.get("visibilitychange")();

  assert.equal(ticks, 2);
});

test("wake lock follows active timed-session controls", async () => {
  let requests = 0;
  let releases = 0;

  const lock = {
    addEventListener() {},
    async release() {
      releases += 1;
    }
  };

  const harness = createHarness({
    wakeLock: {
      async request(type) {
        assert.equal(type, "screen");
        requests += 1;
        return lock;
      }
    }
  });

  harness.elements.set("intervalPauseBtn", { disabled: false });
  await harness.window.TrainingWiseRuntime.syncWakeLockToSession();
  assert.equal(requests, 1);

  harness.elements.set("intervalPauseBtn", { disabled: true });
  await harness.window.TrainingWiseRuntime.syncWakeLockToSession();
  assert.equal(releases, 1);
});

test("runtime is loaded before TrainingWise timer modules", () => {
  const html = fs.readFileSync(
    new URL("../public/tools/trainingwise/index.html", import.meta.url),
    "utf8"
  );

  const runtime = html.indexOf("trainingwise-runtime.js");
  const main = html.indexOf("trainingwise.js");
  const tabata = html.indexOf("trainingwise-tabata.js");

  assert.ok(runtime >= 0);
  assert.ok(runtime < main);
  assert.ok(runtime < tabata);
});
