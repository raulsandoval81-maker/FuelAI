import assert from "node:assert/strict";
import test from "node:test";

import {
  OWNER_KEY,
  SNAPSHOT_PREFIX,
  activateAccountStorage,
  isAccountKey,
  logoutAccountStorage
} from "../public/assets/js/core/account-storage.js";


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


class InterruptibleStorage extends MemoryStorage {
  constructor(entries = {}) {
    super(entries);
    this.interruptKey = "";
  }

  setItem(key, value) {
    if (key === this.interruptKey) {
      this.interruptKey = "";
      throw new Error("simulated interruption");
    }

    super.setItem(key, value);
  }
}


test(
  "tool and account caches are classified as account-owned",
  () => {
    [
      "fuelai-setup",
      "fuelai-plan",
      "fuelai-beta-access",
      "fuelai-consent",
      "fuelai-identity",
      "fuelai-log-v1",
      "fuelai-daily-log-v1",
      "fuelai-history",
      "fuelai-fridgewise-memory",
      "fuelwise_fridge_result",
      "fuelai-weightwise-beta",
      "fuelai-weightwise-history",
      "fuelai-water-oz-2026-08-16",
      "fuelai-workout-2026-08-16",
      "fuelai-sleep-hours-2026-08-16",
      "fuelai-sleep-quality-2026-08-16"
    ].forEach(
      key => assert.equal(
        isAccountKey(key),
        true,
        `${key} should be account-owned`
      )
    );

    assert.equal(
      isAccountKey("fuelai-theme"),
      false
    );
    assert.equal(
      isAccountKey(
        "fuelai-trainingwise-sound-v1"
      ),
      false
    );
  }
);


test(
  "User A logout prevents User B from inheriting account data",
  () => {
    const storage = new MemoryStorage();

    activateAccountStorage("user-a", storage);
    storage.setItem("fuelai-log-v1", "A-log");
    storage.setItem("fuelai-fridgewise-memory", "A-pantry");
    storage.setItem("fuelai-user", "A-session");

    logoutAccountStorage("user-a", storage);

    assert.equal(
      storage.getItem("fuelai-log-v1"),
      null
    );
    assert.equal(
      storage.getItem("fuelai-user"),
      null
    );

    activateAccountStorage("user-b", storage);

    assert.equal(
      storage.getItem("fuelai-fridgewise-memory"),
      null
    );
    assert.equal(
      storage.getItem(OWNER_KEY),
      "user-b"
    );
  }
);


test(
  "direct Firebase account switch parks User A and restores only User B",
  () => {
    const storage = new MemoryStorage({
      [`${SNAPSHOT_PREFIX}user-b`]: JSON.stringify({
        "fuelai-history": "B-meals",
        "fuelai-weightwise-beta": "B-weight"
      })
    });

    activateAccountStorage("user-a", storage);
    storage.setItem("fuelai-history", "A-meals");
    storage.setItem("fuelai-setup", "A-profile");

    activateAccountStorage("user-b", storage);

    assert.equal(
      storage.getItem("fuelai-history"),
      "B-meals"
    );
    assert.equal(
      storage.getItem("fuelai-weightwise-beta"),
      "B-weight"
    );
    assert.equal(
      storage.getItem("fuelai-setup"),
      null
    );
    assert.match(
      storage.getItem(
        `${SNAPSHOT_PREFIX}user-a`
      ),
      /A-meals/
    );
  }
);


test(
  "same-user navigation and return preserve account data",
  () => {
    const storage = new MemoryStorage();

    activateAccountStorage("user-a", storage);
    storage.setItem(
      "fuelai-daily-log-v1",
      "A-summary"
    );

    activateAccountStorage("user-a", storage);

    assert.equal(
      storage.getItem("fuelai-daily-log-v1"),
      "A-summary"
    );

    logoutAccountStorage("user-a", storage);
    activateAccountStorage("user-a", storage);

    assert.equal(
      storage.getItem("fuelai-daily-log-v1"),
      "A-summary"
    );
  }
);


test(
  "device-wide preferences survive logout and account switching",
  () => {
    const storage = new MemoryStorage({
      "fuelai-theme": "dark",
      "fuelai-trainingwise-sound-v1": "off"
    });

    activateAccountStorage("user-a", storage);
    storage.setItem("fuelai-plan", "plus");
    logoutAccountStorage("user-a", storage);
    activateAccountStorage("user-b", storage);

    assert.equal(
      storage.getItem("fuelai-theme"),
      "dark"
    );
    assert.equal(
      storage.getItem(
        "fuelai-trainingwise-sound-v1"
      ),
      "off"
    );
  }
);


test(
  "existing legacy account data is adopted by the first verified UID",
  () => {
    const storage = new MemoryStorage({
      "fuelai-setup": "legacy-profile",
      "fuelai-water-oz-2026-08-16": "64",
      "fuelai-user": JSON.stringify({
        email: "athlete@example.com",
        active: true
      })
    });

    const result = activateAccountStorage(
      "existing-user",
      storage,
      "athlete@example.com"
    );

    assert.equal(
      result.migratedLegacyData,
      true
    );
    assert.equal(
      storage.getItem("fuelai-setup"),
      "legacy-profile"
    );
    assert.equal(
      storage.getItem(OWNER_KEY),
      "existing-user"
    );
  }
);


test(
  "unverified legacy data is cleared instead of being inherited",
  () => {
    const storage = new MemoryStorage({
      "fuelai-setup": "previous-profile",
      "fuelai-user": JSON.stringify({
        email: "user-a@example.com",
        active: true
      })
    });

    activateAccountStorage(
      "user-b",
      storage,
      "user-b@example.com"
    );

    assert.equal(
      storage.getItem("fuelai-setup"),
      null
    );
    assert.equal(
      storage.getItem(OWNER_KEY),
      "user-b"
    );
  }
);


test(
  "logout with no attributable UID clears active data safely",
  () => {
    const storage = new MemoryStorage({
      "fuelai-history": "unattributed-history",
      "fuelai-user": "unattributed-session"
    });

    const result = logoutAccountStorage(
      "",
      storage
    );

    assert.equal(
      result.reason,
      "unknown-account-cleared"
    );
    assert.equal(
      storage.getItem("fuelai-history"),
      null
    );
    assert.equal(
      storage.getItem("fuelai-user"),
      null
    );
  }
);


test(
  "interrupted restoration rolls back partial data and retries safely",
  () => {
    const storage = new InterruptibleStorage({
      [`${SNAPSHOT_PREFIX}user-a`]: JSON.stringify({
        "fuelai-history": "A-history",
        "fuelai-setup": "A-profile"
      })
    });

    storage.interruptKey = "fuelai-setup";

    const interrupted = activateAccountStorage(
      "user-a",
      storage
    );

    assert.equal(
      interrupted.reason,
      "restore-interrupted"
    );
    assert.equal(
      storage.getItem("fuelai-history"),
      null
    );
    assert.equal(
      storage.getItem(OWNER_KEY),
      null
    );
    assert.ok(
      storage.getItem(
        `${SNAPSHOT_PREFIX}user-a`
      )
    );

    const retried = activateAccountStorage(
      "user-a",
      storage
    );

    assert.equal(retried.activated, true);
    assert.equal(
      storage.getItem("fuelai-history"),
      "A-history"
    );
    assert.equal(
      storage.getItem("fuelai-setup"),
      "A-profile"
    );
  }
);
