import assert from "node:assert/strict";
import test from "node:test";

import {
  authenticateFridgeWise,
  finalizeFridgeWiseScan,
  finalizeSuccessfulFridgeWiseScan,
  reserveFridgeWiseScan,
  resolveFridgeWiseLimit
} from "../api/_lib/fridgewise-metering.js";

import {
  PRIVACY_NOTICE_VERSION,
  TERMS_VERSION
} from "../public/assets/js/core/consent-config.js";

import {
  MAX_FRIDGEWISE_IMAGE_BYTES,
  validateFridgeWiseRequest,
  validateFridgeWiseResult
} from "../api/_lib/fridgewise-security.js";


const REQUEST_ONE =
  "223e4567-e89b-42d3-a456-426614174001";
const REQUEST_TWO =
  "223e4567-e89b-42d3-a456-426614174002";
const PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgo=";


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
    for (const path of Object.keys(seed)) {
      const match = path.match(/^users\/([^/]+)$/);
      if (match) {
        this.documents.set(
          `users/${match[1]}/privacy/current`,
          {
            uid: match[1], ageBand: "18_plus", status: "active",
            privacyVersion: PRIVACY_NOTICE_VERSION, termsVersion: TERMS_VERSION,
            acceptedAt: "server-time"
          }
        );
      }
    }
    this.transactionQueue =
      Promise.resolve();
  }

  collection(name) {
    return new FakeReference(this, name);
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
            create: (reference, value) => {
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
            const path = write.reference.path;

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


function validResult() {
  return {
    detectedItems: ["eggs", "cheese"],
    possibleItems: ["spinach"],
    unclearItems: [],
    suggestedMeals: [
      {
        type: "meal",
        name: "Egg scramble",
        time: "10 minutes",
        whyItWorks: "Fast and practical.",
        uses: ["eggs", "cheese"],
        needs: [],
        steps: ["Cook the eggs."]
      },
      {
        type: "meal",
        name: "Cheese toast",
        time: "8 minutes",
        whyItWorks: "Uses what is available.",
        uses: ["cheese"],
        needs: ["bread"],
        steps: ["Toast and top."]
      },
      {
        type: "snack",
        name: "Cheese bites",
        time: "2 minutes",
        whyItWorks: "No cooking needed.",
        uses: ["cheese"],
        needs: [],
        steps: ["Slice and serve."]
      }
    ],
    groceryList: ["bread"]
  };
}


test(
  "FridgeWise requires and verifies Firebase authentication",
  async () => {
    await assert.rejects(
      authenticateFridgeWise(
        { headers: {} },
        {
          auth: {
            verifyIdToken: async () => ({})
          }
        }
      ),
      errorCode("AUTH_REQUIRED")
    );

    const user =
      await authenticateFridgeWise(
        {
          headers: {
            authorization:
              "Bearer fridge-token"
          }
        },
        {
          auth: {
            verifyIdToken: async token => {
              assert.equal(
                token,
                "fridge-token"
              );
              return { uid: "user-1" };
            }
          }
        }
      );

    assert.equal(user.uid, "user-1");

    await assert.rejects(
      authenticateFridgeWise(
        {
          headers: {
            authorization: "Bearer expired"
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
  "FridgeWise resolves plan, beta, and legacy Basic entitlements",
  () => {
    assert.deepEqual(
      resolveFridgeWiseLimit({
        plan: "basic"
      }),
      {
        purchasedPlan: "standard",
        effectivePlan: "standard",
        limit: 2
      }
    );

    assert.deepEqual(
      resolveFridgeWiseLimit({
        plan: "free",
        beta: {
          enabled: true,
          accessLevel: "plus"
        }
      }),
      {
        purchasedPlan: "free",
        effectivePlan: "plus",
        limit: 4
      }
    );
  }
);


test(
  "FridgeWise atomically grants only the final available scan",
  async () => {
    const db = new FakeFirestore({
      "users/user-1": { plan: "free" }
    });

    const attempts =
      await Promise.allSettled([
        reserveFridgeWiseScan({
          uid: "user-1",
          requestId: REQUEST_ONE,
          db
        }),
        reserveFridgeWiseScan({
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

    assert.equal(
      attempts.find(
        attempt =>
          attempt.status === "rejected"
      ).reason.code,
      "SCAN_LIMIT_REACHED"
    );
  }
);


test(
  "FridgeWise UUID idempotency does not consume a second scan",
  async () => {
    const db = new FakeFirestore({
      "users/user-1": {
        plan: "standard"
      }
    });

    await reserveFridgeWiseScan({
      uid: "user-1",
      requestId: REQUEST_ONE,
      db
    });

    await assert.rejects(
      reserveFridgeWiseScan({
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

    assert.equal(usage.fridge.reserved, 1);
  }
);


test(
  "FridgeWise obeys account access and the shared global cap",
  async () => {
    const deniedDb = new FakeFirestore({
      "users/user-1": {
        plan: "plus",
        aiAccess: {
          fridgeEnabled: false
        }
      }
    });

    await assert.rejects(
      reserveFridgeWiseScan({
        uid: "user-1",
        requestId: REQUEST_ONE,
        db: deniedDb
      }),
      errorCode("AI_ACCESS_DENIED")
    );

    const disabledDb = new FakeFirestore({
      "users/user-1": { plan: "plus" },
      "system/aiControls": {
        enabled: false
      }
    });

    await assert.rejects(
      reserveFridgeWiseScan({
        uid: "user-1",
        requestId: REQUEST_ONE,
        db: disabledDb
      }),
      errorCode(
        "AI_TEMPORARILY_DISABLED"
      )
    );

    const db = new FakeFirestore({
      "users/user-1": { plan: "plus" },
      "users/user-2": { plan: "plus" },
      "system/aiControls": {
        dailyRequestCap: 1
      }
    });

    await reserveFridgeWiseScan({
      uid: "user-1",
      requestId: REQUEST_ONE,
      db
    });

    await assert.rejects(
      reserveFridgeWiseScan({
        uid: "user-2",
        requestId: REQUEST_TWO,
        db
      }),
      errorCode(
        "AI_TEMPORARILY_DISABLED"
      )
    );
  }
);


test(
  "FridgeWise rejects forged and oversized images",
  () => {
    assert.throws(
      () => validateFridgeWiseRequest({
        image:
          "data:image/jpeg;base64,iVBORw0KGgo="
      }),
      errorCode("UNSUPPORTED_IMAGE")
    );

    const oversized = Buffer.alloc(
      MAX_FRIDGEWISE_IMAGE_BYTES + 1
    );
    oversized.set([
      0x89, 0x50, 0x4e, 0x47,
      0x0d, 0x0a, 0x1a, 0x0a
    ]);

    assert.throws(
      () => validateFridgeWiseRequest({
        image:
          `data:image/png;base64,${oversized.toString("base64")}`
      }),
      errorCode("IMAGE_TOO_LARGE")
    );
  }
);


test(
  "FridgeWise bounds pantry context and ignores unused client fields",
  () => {
    const request =
      validateFridgeWiseRequest({
        image: PNG_DATA_URL,
        pantryCompanion: [
          " Eggs ",
          "eggs",
          "Rice"
        ],
        favoriteMeals: [
          { name: "not sent to model" }
        ],
        mealMatches: ["ignored"]
      });

    assert.deepEqual(
      request.pantry,
      ["Eggs", "Rice"]
    );
    assert.equal(
      Object.hasOwn(
        request,
        "favoriteMeals"
      ),
      false
    );

    assert.throws(
      () => validateFridgeWiseRequest({
        image: PNG_DATA_URL,
        pantryCompanion:
          Array.from(
            { length: 41 },
            (_, index) => `item-${index}`
          )
      }),
      errorCode("INVALID_REQUEST")
    );
  }
);


test(
  "FridgeWise strictly validates and bounds AI responses",
  () => {
    const result =
      validateFridgeWiseResult(
        validResult()
      );

    assert.equal(
      result.suggestedMeals.length,
      3
    );

    const wrongMix = validResult();
    wrongMix.suggestedMeals[2].type =
      "meal";

    assert.throws(
      () => validateFridgeWiseResult(
        wrongMix
      ),
      errorCode("AI_RESULT_INVALID")
    );

    const oversized = validResult();
    oversized.suggestedMeals[0]
      .whyItWorks = "x".repeat(501);

    assert.throws(
      () => validateFridgeWiseResult(
        oversized
      ),
      errorCode("AI_RESULT_INVALID")
    );

    const wrongType = validResult();
    wrongType.suggestedMeals[0].name = 42;

    assert.throws(
      () => validateFridgeWiseResult(
        wrongType
      ),
      errorCode("AI_RESULT_INVALID")
    );
  }
);


test(
  "FridgeWise preserves successful results when finalization fails",
  async () => {
    const logged = [];

    const finalized =
      await finalizeSuccessfulFridgeWiseScan({
        reservation: { id: "reserved" },
        providerUsage: {
          prompt_tokens: 12,
          completion_tokens: 20
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


test(
  "FridgeWise tracks provider usage without sensitive content",
  async () => {
    const db = new FakeFirestore({
      "users/user-1": { plan: "plus" }
    });

    const reservation =
      await reserveFridgeWiseScan({
        uid: "user-1",
        requestId: REQUEST_ONE,
        db
      });

    await finalizeFridgeWiseScan({
      reservation,
      succeeded: true,
      providerUsage: {
        prompt_tokens: 21,
        completion_tokens: 34
      },
      db
    });

    const usage =
      [...db.documents.entries()]
        .find(([path]) =>
          path.startsWith(
            "users/user-1/aiUsage/"
          )
        )[1];

    assert.equal(usage.inputTokens, 21);
    assert.equal(usage.outputTokens, 34);
    assert.equal(usage.fridge.succeeded, 1);
    assert.equal(
      JSON.stringify(usage).includes(
        "image"
      ),
      false
    );
  }
);


test(
  "FridgeWise request records contain metadata but no sensitive payload",
  async () => {
    const db = new FakeFirestore({
      "users/user-1": { plan: "plus" }
    });

    await reserveFridgeWiseScan({
      uid: "user-1",
      requestId: REQUEST_ONE,
      db
    });

    const request =
      [...db.documents.entries()]
        .find(([path]) =>
          path.startsWith("aiRequests/")
        )[1];

    assert.deepEqual(
      Object.keys(request).sort(),
      [
        "completedAt",
        "createdAt",
        "date",
        "effectivePlan",
        "purchasedPlan",
        "status",
        "tool",
        "uid"
      ]
    );
  }
);
