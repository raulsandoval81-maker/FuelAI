import {
  readFile
} from "node:fs/promises";

import {
  after,
  before,
  beforeEach,
  test
} from "node:test";

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment
} from "@firebase/rules-unit-testing";

import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where
} from "firebase/firestore";


const PROJECT_ID =
  "fuelai-firestore-rules-test";


let testEnvironment;


function authenticatedDb(
  uid,
  email = `${uid}@example.com`
) {
  return testEnvironment
    .authenticatedContext(
      uid,
      {
        email
      }
    )
    .firestore();
}


async function seedDocuments(
  documents
) {
  await testEnvironment
    .withSecurityRulesDisabled(
      async context => {
        const db =
          context.firestore();

        for (
          const [
            path,
            data
          ] of Object.entries(
            documents
          )
        ) {
          await setDoc(
            doc(db, path),
            data
          );
        }
      }
    );
}


function userRecord(
  uid,
  overrides = {}
) {
  return {
    uid,
    email:
      `${uid}@example.com`,
    setup: {
      nickname:
        uid
    },
    identity: {
      roles: [],
      teamMemberships: [],
      updatedAt:
        "2026-08-16T00:00:00.000Z"
    },
    updatedAt:
      Timestamp.now(),
    ...overrides
  };
}


function membership(
  uid,
  role,
  status = "active"
) {
  return {
    uid,
    email:
      `${uid}@example.com`,
    role,
    status,
    joinedAt:
      Timestamp.now()
  };
}


test(
  "consent records are owner-readable and client-immutable",
  async () => {
    await seedDocuments({
      "users/alice/privacy/current": {
        uid: "alice",
        ageBand: "18_plus",
        status: "active",
        privacyVersion: "2026-08-17",
        termsVersion: "2026-08-17",
        acceptedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      },
      "users/alice/teamSharing/team-one": {
        status: "active",
        approvedAt: Timestamp.now()
      }
    });

    const alice = authenticatedDb("alice");
    const bob = authenticatedDb("bob");
    const consent = doc(alice, "users/alice/privacy/current");
    const sharing = doc(alice, "users/alice/teamSharing/team-one");

    await assertSucceeds(getDoc(consent));
    await assertSucceeds(getDoc(sharing));
    await assertFails(getDoc(doc(bob, "users/alice/privacy/current")));
    await assertFails(getDoc(doc(bob, "users/alice/teamSharing/team-one")));
    await assertFails(updateDoc(consent, { acceptedAt: Timestamp.now() }));
    await assertFails(setDoc(doc(alice, "users/alice/privacy/forged"), { status: "active" }));
    await assertFails(updateDoc(sharing, { status: "active" }));
  }
);


before(
  async () => {
    testEnvironment =
      await initializeTestEnvironment({
        projectId:
          PROJECT_ID,
        firestore: {
          rules:
            await readFile(
              new URL(
                "../firestore.rules",
                import.meta.url
              ),
              "utf8"
            )
        }
      });
  }
);


beforeEach(
  async () => {
    await testEnvironment
      .clearFirestore();
  }
);


after(
  async () => {
    await testEnvironment
      ?.cleanup();
  }
);


test(
  "a user can create, read, and update their own allowed account fields",
  async () => {
    const db =
      authenticatedDb("user-a");

    const ref =
      doc(db, "users/user-a");

    await assertSucceeds(
      setDoc(
        ref,
        userRecord("user-a")
      )
    );

    await assertSucceeds(
      getDoc(ref)
    );

    await assertSucceeds(
      updateDoc(
        ref,
        {
          setup: {
            nickname:
              "Updated"
          },
          updatedAt:
            Timestamp.now()
        }
      )
    );
  }
);


test(
  "a user cannot change server-authoritative plan, beta, or metering data",
  async () => {
    await seedDocuments({
      "users/user-a":
        userRecord(
          "user-a",
          {
            plan:
              "free"
          }
        )
    });

    const db =
      authenticatedDb("user-a");

    await assertFails(
      updateDoc(
        doc(db, "users/user-a"),
        {
          plan:
            "plus",
          updatedAt:
            Timestamp.now()
        }
      )
    );

    await assertSucceeds(
      updateDoc(
        doc(db, "users/user-a"),
        {
          setup: {
            nickname:
              "Allowed profile change"
          },
          updatedAt:
            Timestamp.now()
        }
      )
    );

    await assertFails(
      setDoc(
        doc(
          db,
          "users/user-a/aiUsage/2026-08-16"
        ),
        {
          used: 0
        }
      )
    );
  }
);


test(
  "an unauthenticated client cannot read account or team records",
  async () => {
    await seedDocuments({
      "users/user-a":
        userRecord("user-a"),
      "teams/red": {
        name: "Red Team",
        status: "active"
      }
    });

    const db =
      testEnvironment
        .unauthenticatedContext()
        .firestore();

    await assertFails(
      getDoc(
        doc(db, "users/user-a")
      )
    );

    await assertFails(
      getDoc(
        doc(db, "teams/red")
      )
    );
  }
);


test(
  "a user cannot read or write another user's account",
  async () => {
    await seedDocuments({
      "users/user-b":
        userRecord("user-b")
    });

    const db =
      authenticatedDb("user-a");

    await assertFails(
      getDoc(
        doc(db, "users/user-b")
      )
    );

    await assertFails(
      updateDoc(
        doc(db, "users/user-b"),
        {
          setup: {
            nickname:
              "Intruder"
          },
          updatedAt:
            Timestamp.now()
        }
      )
    );
  }
);


test(
  "the existing membership query returns only the signed-in user's memberships",
  async () => {
    await seedDocuments({
      "teams/red": {
        name: "Red Team",
        status: "active"
      },
      "teams/red/members/user-a":
        membership(
          "user-a",
          "athlete"
        ),
      "teams/red/members/user-b":
        membership(
          "user-b",
          "athlete"
        )
    });

    const db =
      authenticatedDb("user-a");

    const ownMemberships =
      query(
        collectionGroup(
          db,
          "members"
        ),
        where(
          "uid",
          "==",
          "user-a"
        )
      );

    await assertSucceeds(
      getDocs(ownMemberships)
    );

    const otherMemberships =
      query(
        collectionGroup(
          db,
          "members"
        ),
        where(
          "uid",
          "==",
          "user-b"
        )
      );

    await assertFails(
      getDocs(otherMemberships)
    );
  }
);


test(
  "an athlete cannot access roster management, coach-only metrics, or team writes",
  async () => {
    await seedDocuments({
      "teams/red": {
        name: "Red Team",
        status: "active"
      },
      "teams/red/members/athlete-a":
        membership(
          "athlete-a",
          "athlete"
        ),
      "teams/red/members/coach-a":
        membership(
          "coach-a",
          "coach"
        ),
      "users/athlete-a/teamMetrics/2026-08-16": {
        uid: "athlete-a",
        date: "2026-08-16",
        weight: 170
      }
    });

    const db =
      authenticatedDb("athlete-a");

    await assertSucceeds(
      getDoc(
        doc(db, "teams/red")
      )
    );

    await assertFails(
      getDocs(
        collection(
          db,
          "teams/red/members"
        )
      )
    );

    await assertFails(
      getDoc(
        doc(
          db,
          "users/athlete-a/teamMetrics/2026-08-16"
        )
      )
    );

    await assertFails(
      updateDoc(
        doc(
          db,
          "teams/red/members/coach-a"
        ),
        {
          status:
            "inactive"
        }
      )
    );
  }
);


test(
  "an active coach can read only their permitted team discovery data",
  async () => {
    await seedDocuments({
      "teams/red": {
        name: "Red Team",
        status: "active"
      },
      "teams/blue": {
        name: "Blue Team",
        status: "active"
      },
      "teams/red/members/coach-a":
        membership(
          "coach-a",
          "coach"
        )
    });

    const db =
      authenticatedDb("coach-a");

    await assertSucceeds(
      getDoc(
        doc(db, "teams/red")
      )
    );

    await assertSucceeds(
      getDoc(
        doc(
          db,
          "teams/red/members/coach-a"
        )
      )
    );

    await assertFails(
      getDoc(
        doc(db, "teams/blue")
      )
    );

    await assertFails(
      getDocs(
        collection(
          db,
          "teams/red/members"
        )
      )
    );
  }
);


test(
  "inactive and wrong-team memberships are denied",
  async () => {
    await seedDocuments({
      "teams/red": {
        name: "Red Team",
        status: "active"
      },
      "teams/blue": {
        name: "Blue Team",
        status: "active"
      },
      "teams/red/members/coach-a":
        membership(
          "coach-a",
          "coach",
          "inactive"
        ),
      "teams/blue/members/coach-b":
        membership(
          "coach-b",
          "coach"
        )
    });

    await assertFails(
      getDoc(
        doc(
          authenticatedDb(
            "coach-a"
          ),
          "teams/red"
        )
      )
    );

    await assertFails(
      getDoc(
        doc(
          authenticatedDb(
            "coach-b"
          ),
          "teams/red"
        )
      )
    );

    await assertSucceeds(
      getDoc(
        doc(
          authenticatedDb(
            "coach-a"
          ),
          "teams/red/members/coach-a"
        )
      )
    );
  }
);


test(
  "clients cannot write team metrics or administrative collections",
  async () => {
    const db =
      authenticatedDb("coach-a");

    for (
      const [
        path,
        data
      ] of [
        [
          "users/athlete-a/teamMetrics/2026-08-16",
          {
            uid: "athlete-a",
            date: "2026-08-16"
          }
        ],
        [
          "teams/red/members/athlete-a",
          membership(
            "athlete-a",
            "athlete"
          )
        ],
        [
          "system/aiControls",
          {
            enabled: true
          }
        ],
        [
          "aiSystemUsage/2026-08-16",
          {
            count: 0
          }
        ],
        [
          "aiRequests/request-id",
          {
            status: "complete"
          }
        ]
      ]
    ) {
      await assertFails(
        setDoc(
          doc(db, path),
          data
        )
      );
    }
  }
);
