const OWNER_KEY =
  "fuelai-account-storage-owner-v1";

const SNAPSHOT_PREFIX =
  "fuelai-account-storage-snapshot-v1:";

const ACCOUNT_KEYS = new Set([
  "fuelai-setup",
  "fuelai-plan",
  "fuelai-beta-access",
  "fuelai-identity",
  "fuelai-log-v1",
  "fuelai-daily-log-v1",
  "fuelai-history",
  "fuelai-fridgewise-memory",
  "fuelai-last-meal",
  "fuelai-weightwise-beta",
  "fuelai-weightwise-history",
  "fuelai-team-dashboard-range",
  "fuelai-team-dashboard-view",
  "fuelai-dev-unlock-all",
  "fuelwise_fridge_result",
  "fuelwise_fridge_usage"
]);

const ACCOUNT_KEY_PREFIXES = [
  "fuelai-water-oz-",
  "fuelai-workout-",
  "fuelai-sleep-hours-",
  "fuelai-sleep-quality-"
];

const SESSION_KEYS = new Set([
  "fuelai-user"
]);


function normalizeUid(uid) {
  return String(uid || "").trim();
}


function normalizeEmail(email) {
  return String(email || "")
    .trim()
    .toLowerCase();
}


function getLegacySessionEmail(storage) {
  try {
    const session = JSON.parse(
      storage.getItem("fuelai-user") || "{}"
    );

    return normalizeEmail(session.email);
  } catch {
    return "";
  }
}


function isAccountKey(key) {
  return (
    ACCOUNT_KEYS.has(key) ||
    ACCOUNT_KEY_PREFIXES.some(
      prefix => key.startsWith(prefix)
    )
  );
}


function listKeys(storage) {
  const keys = [];

  for (
    let index = 0;
    index < storage.length;
    index += 1
  ) {
    const key = storage.key(index);

    if (key) {
      keys.push(key);
    }
  }

  return keys;
}


function listActiveAccountKeys(storage) {
  return listKeys(storage).filter(
    key => isAccountKey(key)
  );
}


function clearActiveAccountData(storage) {
  listActiveAccountKeys(storage)
    .forEach(key => storage.removeItem(key));

  SESSION_KEYS.forEach(
    key => storage.removeItem(key)
  );
}


function snapshotKey(uid) {
  return `${SNAPSHOT_PREFIX}${uid}`;
}


function parkAccountStorage(
  uid,
  storage = globalThis.localStorage
) {
  const normalizedUid = normalizeUid(uid);

  if (!normalizedUid || !storage) {
    return {
      parked: false,
      reason: "missing-account"
    };
  }

  const snapshot = {};

  listActiveAccountKeys(storage)
    .forEach(key => {
      snapshot[key] = storage.getItem(key);
    });

  let parked = true;

  try {
    if (Object.keys(snapshot).length) {
      storage.setItem(
        snapshotKey(normalizedUid),
        JSON.stringify(snapshot)
      );
    } else {
      storage.removeItem(
        snapshotKey(normalizedUid)
      );
    }
  } catch (error) {
    parked = false;

    console.warn(
      "FuelAI account storage could not be preserved; active account data was cleared for safety.",
      error
    );
  }

  clearActiveAccountData(storage);
  storage.removeItem(OWNER_KEY);

  return {
    parked,
    keyCount: Object.keys(snapshot).length
  };
}


function restoreAccountStorage(
  uid,
  storage
) {
  const key = snapshotKey(uid);
  const rawSnapshot = storage.getItem(key);

  if (!rawSnapshot) {
    return 0;
  }

  let snapshot;

  try {
    snapshot = JSON.parse(rawSnapshot);
  } catch (error) {
    console.warn(
      "FuelAI account storage snapshot could not be read.",
      error
    );

    storage.removeItem(key);
    return 0;
  }

  if (
    !snapshot ||
    typeof snapshot !== "object" ||
    Array.isArray(snapshot)
  ) {
    storage.removeItem(key);
    return 0;
  }

  // Release the serialized copy before restoring its
  // entries so localStorage does not need double space.
  storage.removeItem(key);

  let restored = 0;

  Object.entries(snapshot)
    .forEach(([storedKey, value]) => {
      if (
        isAccountKey(storedKey) &&
        typeof value === "string"
      ) {
        storage.setItem(storedKey, value);
        restored += 1;
      }
    });

  return restored;
}


function activateAccountStorage(
  uid,
  storage = globalThis.localStorage,
  email = ""
) {
  const normalizedUid = normalizeUid(uid);

  if (!normalizedUid || !storage) {
    return {
      activated: false,
      reason: "missing-account"
    };
  }

  const previousUid = normalizeUid(
    storage.getItem(OWNER_KEY)
  );

  if (previousUid === normalizedUid) {
    return {
      activated: true,
      sameUser: true,
      restored: 0
    };
  }

  if (previousUid) {
    parkAccountStorage(
      previousUid,
      storage
    );
  } else if (
    normalizeEmail(email) &&
    normalizeEmail(email) ===
      getLegacySessionEmail(storage)
  ) {
    // First-run migration: preserve legacy data only when
    // its local session email matches the verified user.
    storage.setItem(
      OWNER_KEY,
      normalizedUid
    );

    return {
      activated: true,
      migratedLegacyData: true,
      restored: 0
    };
  }

  clearActiveAccountData(storage);

  const restored = restoreAccountStorage(
    normalizedUid,
    storage
  );

  storage.setItem(
    OWNER_KEY,
    normalizedUid
  );

  return {
    activated: true,
    sameUser: false,
    restored
  };
}


function logoutAccountStorage(
  uid,
  storage = globalThis.localStorage
) {
  if (!storage) {
    return {
      parked: false,
      reason: "missing-storage"
    };
  }

  const ownerUid = normalizeUid(
    storage.getItem(OWNER_KEY)
  );

  const accountUid =
    normalizeUid(uid) || ownerUid;

  if (!accountUid) {
    clearActiveAccountData(storage);
    storage.removeItem(OWNER_KEY);

    return {
      parked: false,
      reason: "unknown-account-cleared"
    };
  }

  return parkAccountStorage(
    accountUid,
    storage
  );
}


export {
  ACCOUNT_KEYS,
  ACCOUNT_KEY_PREFIXES,
  OWNER_KEY,
  SESSION_KEYS,
  SNAPSHOT_PREFIX,
  activateAccountStorage,
  isAccountKey,
  listActiveAccountKeys,
  logoutAccountStorage,
  parkAccountStorage
};
