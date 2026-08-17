import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";


async function loadAuthSoft() {
  const source = await readFile(
    new URL(
      "../public/assets/js/core/auth-soft.js",
      import.meta.url
    ),
    "utf8"
  );

  const listeners = new Map();
  const storage = {
    getItem: () => null,
    removeItem: () => {},
    setItem: () => {}
  };
  let reloads = 0;

  const window = {
    addEventListener(type, callback) {
      listeners.set(type, callback);
    },
    location: {
      href: "",
      reload() {
        reloads += 1;
      }
    }
  };

  vm.runInNewContext(source, {
    console,
    document: {
      documentElement: {
        style: {}
      }
    },
    localStorage: storage,
    window
  });

  return {
    getReloads: () => reloads,
    onStorage: listeners.get("storage"),
    storage,
    window
  };
}


test(
  "another tab changing UID ownership reloads the stale tab",
  async () => {
    const context = await loadAuthSoft();

    context.onStorage({
      key: "fuelai-account-storage-owner-v1",
      newValue: "user-b",
      oldValue: "user-a",
      storageArea: context.storage
    });

    assert.equal(context.getReloads(), 1);
  }
);


test(
  "another tab changing the soft session reloads the stale tab",
  async () => {
    const context = await loadAuthSoft();

    context.onStorage({
      key: "fuelai-user",
      newValue: null,
      oldValue: "user-a-session",
      storageArea: context.storage
    });

    assert.equal(context.getReloads(), 1);
  }
);


test(
  "device-wide preference changes do not reload other tabs",
  async () => {
    const context = await loadAuthSoft();

    [
      "fuelai-theme",
      "fuelai-trainingwise-sound-v1"
    ].forEach(key => {
      context.onStorage({
        key,
        newValue: "new-value",
        oldValue: "old-value",
        storageArea: context.storage
      });
    });

    assert.equal(context.getReloads(), 0);
  }
);
