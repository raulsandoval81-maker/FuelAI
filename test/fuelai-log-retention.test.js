import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";


const DAY_MS =
  24 * 60 * 60 * 1000;


class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(
      Object.entries(entries)
    );
  }

  get length() {
    return this.values.size;
  }

  key(index) {
    return Array.from(
      this.values.keys()
    )[index] ?? null;
  }

  getItem(key) {
    return this.values.has(key)
      ? this.values.get(key)
      : null;
  }

  setItem(key, value) {
    this.values.set(
      String(key),
      String(value)
    );
  }

  removeItem(key) {
    this.values.delete(key);
  }
}


function dateKey(value) {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone:
          "America/Los_Angeles",
        year: "numeric",
        month: "2-digit",
        day: "2-digit"
      }
    ).formatToParts(new Date(value));

  const part = type =>
    parts.find(item =>
      item.type === type
    )?.value;

  return `${part("year")}-${part("month")}-${part("day")}`;
}


async function loadFuelLog(storage) {
  const source = await readFile(
    new URL(
      "../public/assets/js/account/fuelai-log.js",
      import.meta.url
    ),
    "utf8"
  );
  const window = {
    dispatchEvent() {}
  };

  vm.runInNewContext(source, {
    console,
    crypto: {
      randomUUID: () => "test-id"
    },
    CustomEvent:
      class CustomEvent {},
    Date,
    Intl,
    localStorage: storage,
    window
  });

  return window.FuelAILog;
}


test(
  "startup/read pruning keeps day 42 and removes day 43 without a new entry",
  async () => {
    const now = Date.now();
    const day42 =
      new Date(
        now - 42 * DAY_MS + 60_000
      ).toISOString();
    const day43 =
      new Date(
        now - 43 * DAY_MS
      ).toISOString();
    const storage = new MemoryStorage({
      "fuelai-log-v1": JSON.stringify([
        { id: "keep", createdAt: day42 },
        { id: "remove", createdAt: day43 }
      ])
    });

    const fuelLog =
      await loadFuelLog(storage);

    assert.equal(fuelLog.retentionDays, 42);
    assert.deepEqual(
      Array.from(
        fuelLog.getFuelLog(),
        entry => entry.id
      ),
      ["keep"]
    );
    assert.doesNotMatch(
      storage.getItem("fuelai-log-v1"),
      /remove/
    );
  }
);


test(
  "daily summaries and all legacy dated keys use the 42-day boundary",
  async () => {
    const now = Date.now();
    const keepKey =
      dateKey(
        now - 42 * DAY_MS + 60_000
      );
    const removeKey =
      dateKey(
        now - 43 * DAY_MS
      );
    const entries = {
      "fuelai-daily-log-v1":
        JSON.stringify({
          [keepKey]: { calories: 1 },
          [removeKey]: { calories: 2 }
        })
    };

    [
      "fuelai-water-oz-",
      "fuelai-workout-",
      "fuelai-sleep-hours-",
      "fuelai-sleep-quality-"
    ].forEach(prefix => {
      entries[`${prefix}${keepKey}`] =
        "keep";
      entries[`${prefix}${removeKey}`] =
        "remove";
    });

    entries["fuelai-theme"] = "dark";

    const storage =
      new MemoryStorage(entries);
    const fuelLog =
      await loadFuelLog(storage);

    assert.deepEqual(
      Object.keys(
        fuelLog.getDailyLogs()
      ),
      [keepKey]
    );

    [
      "fuelai-water-oz-",
      "fuelai-workout-",
      "fuelai-sleep-hours-",
      "fuelai-sleep-quality-"
    ].forEach(prefix => {
      assert.equal(
        storage.getItem(
          `${prefix}${keepKey}`
        ),
        "keep"
      );
      assert.equal(
        storage.getItem(
          `${prefix}${removeKey}`
        ),
        null
      );
    });

    assert.equal(
      storage.getItem("fuelai-theme"),
      "dark"
    );
  }
);


test(
  "plan history entitlements are 7, 30, and 42 while zero-day streak remains",
  async () => {
    const [
      planSource,
      trackwiseDashboard,
      trackwisePlans
    ] =
      await Promise.all([
        readFile(
          new URL(
            "../public/assets/js/core/plan.js",
            import.meta.url
          ),
          "utf8"
        ),
        readFile(
          new URL(
            "../public/tools/trackwise/dashboard.html",
            import.meta.url
          ),
          "utf8"
        ),
        readFile(
          new URL(
            "../public/tools/trackwise/index.html",
            import.meta.url
          ),
          "utf8"
        )
      ]);

    const values = Array.from(
      planSource.matchAll(
        /trackwiseDays:\s*(\d+)/g
      ),
      match => Number(match[1])
    );

    assert.deepEqual(
      values.slice(0, 3),
      [7, 30, 42]
    );
    assert.equal(values.includes(0), false);
    assert.match(
      trackwiseDashboard,
      />\s*0 Days\s*</
    );
    assert.match(
      trackwisePlans,
      /7-Day History/
    );
    assert.match(
      trackwisePlans,
      /30-Day History/
    );
    assert.match(
      trackwisePlans,
      /42-Day History/
    );
  }
);
