import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticateMealWise,
  finalizeSuccessfulMealWiseScan,
  reserveMealWiseScan,
  resolveMealWiseLimit
} from "../api/_lib/mealwise-metering.js";


const REQUEST_ONE =
  "123e4567-e89b-42d3-a456-426614174001";

const REQUEST_TWO =
  "123e4567-e89b-42d3-a456-426614174002";


class FakeReference {
  constructor(db, path) {
    this.db = db;
    this.path = path;
  }

  collection(name) {
    return new FakeReference(
      this.db,
      `${this.path}/${name}`
    );
  }

  doc(id) {
    return new FakeReference(
      this.db,
      `${this.path}/${id}`
    );
  }
}


class FakeFirestore {
  constructor(seed = {}) {
    this.documents = new Map(
      Object.entries(seed)
    );
    this.transactionQueue =
      Promise.resolve();
  }

  collection(name) {
    return new FakeReference(this, name);
  }

  read(path) {
    return this.documents.get(path);
  }

  runTransaction(callback) {
    const run =
      this.transactionQueue.then(
        async () => {
          const writes = [];

          const transaction = {
            get: async reference => {
              const value =
                this.documents.get(
                  reference.path
                );

              return {
                exists:
                  value !== undefined,
                data: () => value
              };
            },

            set: (
              reference,
              value,
              options = {}
            ) => {
              writes.push({
                type: "set",
                reference,
                value,
                merge:
                  options.merge === true
              });
            },

            create: (
              reference,
              value
            ) => {
              writes.push({
                type: "create",
                reference,
                value
              });
            }
          };

          const result =
            await callback(transaction);

          for (const write of writes) {
            const path =
              write.reference.path;

            if (
              write.type === "create" &&
              this.documents.has(path)
            ) {
              throw new Error(
                "Document already exists"
              );
            }

            const existing =
              this.documents.get(path) || {};

            this.documents.set(
              path,
              write.merge
                ? {
                    ...existing,
                    ...write.value
                  }
                : write.value
            );
          }

          return result;
        }
      );

    this.transactionQueue =
      run.catch(() => {});

    return run;
  }
}


function errorCode(expected) {
  return error =>
    error?.code === expected;
}


test(
  "requires and verifies a Firebase ID token",
  async () => {
    await assert.rejects(
      authenticateMealWise(
        { headers: {} },
        {
          auth: {
            verifyIdToken: async () => ({
              uid: "should-not-run"
            })
          }
        }
      ),
      errorCode("AUTH_REQUIRED")
    );

    const verified = [];
    const user =
      await authenticateMealWise(
        {
          headers: {
            authorization:
              "Bearer valid-token"
          }
        },
        {
          auth: {
            verifyIdToken:
              async token => {
                verified.push(token);
                return { uid: "user-1" };
              }
          }
        }
      );

    assert.deepEqual(
      verified,
      ["valid-token"]
    );
    assert.equal(user.uid, "user-1");

    await assert.rejects(
      authenticateMealWise(
        {
          headers: {
            authorization:
              "Bearer expired-token"
          }
        },
        {
          auth: {
            verifyIdToken: async () => {
              throw new Error("expired");
            }
          }
        }
      ),
      errorCode("AUTH_REQUIRED")
    );
  }
);


test(
  "resolves purchased, beta, and custom entitlements server-side",
  () => {
    assert.deepEqual(
      resolveMealWiseLimit({
        plan: "basic"
      }),
      {
        purchasedPlan: "standard",
        effectivePlan: "standard",
        limit: 5
      }
    );

    assert.deepEqual(
      resolveMealWiseLimit({
        plan: "free",
        beta: {
          enabled: true,
          accessLevel: "plus"
        }
      }),
      {
        purchasedPlan: "free",
        effectivePlan: "plus",
        limit: 8
      }
    );

    assert.equal(
      resolveMealWiseLimit({
        plan: "plus",
        aiAccess: {
          customMealLimit: 3
        }
      }).limit,
      3
    );
  }
);


test(
  "atomically grants only one final scan",
  async () => {
    const db = new FakeFirestore({
      "users/user-1": {
        plan: "free",
        aiAccess: {
          customMealLimit: 1
        }
      }
    });

    const attempts =
      await Promise.allSettled([
        reserveMealWiseScan({
          uid: "user-1",
          requestId: REQUEST_ONE,
          db
        }),
        reserveMealWiseScan({
          uid: "user-1",
          requestId: REQUEST_TWO,
          db
        })
      ]);

    assert.equal(
      attempts.filter(
        attempt =>
          attempt.status === "fulfilled"
      ).length,
      1
    );

    const rejected =
      attempts.find(
        attempt =>
          attempt.status === "rejected"
      );

    assert.equal(
      rejected.reason.code,
      "SCAN_LIMIT_REACHED"
    );
  }
);


test(
  "rejects a reused request ID without consuming another scan",
  async () => {
    const db = new FakeFirestore({
      "users/user-1": {
        plan: "standard"
      }
    });

    await reserveMealWiseScan({
      uid: "user-1",
      requestId: REQUEST_ONE,
      db
    });

    await assert.rejects(
      reserveMealWiseScan({
        uid: "user-1",
        requestId: REQUEST_ONE,
        db
      }),
      errorCode("REQUEST_ALREADY_USED")
    );

    const usage =
      [...db.documents.entries()]
        .find(([path]) =>
          path.startsWith(
            "users/user-1/aiUsage/"
          )
        )[1];

    assert.equal(
      usage.meal.reserved,
      1
    );
  }
);


test(
  "enforces the global daily cap across users",
  async () => {
    const db = new FakeFirestore({
      "users/user-1": { plan: "plus" },
      "users/user-2": { plan: "plus" },
      "system/aiControls": {
        dailyRequestCap: 1
      }
    });

    await reserveMealWiseScan({
      uid: "user-1",
      requestId: REQUEST_ONE,
      db
    });

    await assert.rejects(
      reserveMealWiseScan({
        uid: "user-2",
        requestId: REQUEST_TWO,
        db
      }),
      errorCode(
        "AI_TEMPORARILY_DISABLED"
      )
    );

    const userTwoUsage =
      [...db.documents.keys()]
        .some(path =>
          path.startsWith(
            "users/user-2/aiUsage/"
          )
        );

    assert.equal(userTwoUsage, false);
  }
);


test(
  "does not discard a successful result when finalization fails",
  async () => {
    const logged = [];

    const finalized =
      await finalizeSuccessfulMealWiseScan({
        reservation: { id: "reserved" },
        providerUsage: {
          prompt_tokens: 10
        },
        finalize: async () => {
          throw new Error(
            "Firestore unavailable"
          );
        },
        logger: {
          error: (...values) =>
            logged.push(values)
        }
      });

    assert.equal(finalized, false);
    assert.equal(logged.length, 1);
  }
);
