import {
  adminAuth,
  adminDb,
  FieldValue
} from "../_lib/firebase-admin.js";


const VALID_PLANS =
  new Set([
    "free",
    "standard",
    "plus"
  ]);


function getBearerToken(req) {
  const header =
    String(
      req.headers
        ?.authorization ||
      ""
    );

  if (
    !header.startsWith(
      "Bearer "
    )
  ) {
    return "";
  }

  return header
    .slice(7)
    .trim();
}


async function requireFuelAIAdmin(
  req
) {
  const token =
    getBearerToken(req);

  if (!token) {
    const error =
      new Error(
        "Missing authorization token"
      );

    error.statusCode = 401;

    throw error;
  }


  const decoded =
    await adminAuth
      .verifyIdToken(
        token
      );


  const adminUid =
    String(
      process.env
        .FUELAI_ADMIN_UID ||
      ""
    ).trim();


  if (
    !adminUid ||
    decoded.uid !==
      adminUid
  ) {
    const error =
      new Error(
        "Admin access required"
      );

    error.statusCode = 403;

    throw error;
  }


  return decoded;
}


async function resolveTargetUser({
  targetUid,
  targetEmail
}) {
  const uid =
    String(
      targetUid || ""
    ).trim();

  const email =
    String(
      targetEmail || ""
    )
      .trim()
      .toLowerCase();


  if (uid) {
    return adminAuth
      .getUser(uid);
  }


  if (email) {
    return adminAuth
      .getUserByEmail(
        email
      );
  }


  const error =
    new Error(
      "targetUid or targetEmail is required"
    );

  error.statusCode = 400;

  throw error;
}


export default async function handler(
  req,
  res
) {
  if (
    req.method !== "POST"
  ) {
    return res
      .status(405)
      .json({
        error:
          "Method not allowed"
      });
  }


  try {
    const admin =
      await requireFuelAIAdmin(
        req
      );


    const {
      targetUid = "",
      targetEmail = "",
      plan,
      beta
    } = req.body || {};


    const target =
      await resolveTargetUser({
        targetUid,
        targetEmail
      });


    const update = {
      platformUpdatedAt:
        FieldValue
          .serverTimestamp(),

      platformUpdatedBy:
        admin.uid
    };


    if (
      plan !== undefined
    ) {
      const normalizedPlan =
        String(
          plan || ""
        )
          .trim()
          .toLowerCase();


      if (
        !VALID_PLANS.has(
          normalizedPlan
        )
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid plan"
          });
      }


      update.plan =
        normalizedPlan;
    }


    if (
      beta !== undefined
    ) {
      if (
        !beta ||
        typeof beta !==
          "object"
      ) {
        return res
          .status(400)
          .json({
            error:
              "Invalid beta configuration"
          });
      }


      const enabled =
        beta.enabled === true;


      let accessLevel =
        null;


      if (
        enabled
      ) {
        accessLevel =
          String(
            beta.accessLevel ||
            ""
          )
            .trim()
            .toLowerCase();


        if (
          !VALID_PLANS.has(
            accessLevel
          )
        ) {
          return res
            .status(400)
            .json({
              error:
                "Invalid beta access level"
            });
        }
      }


      update.beta = {
        enabled,

        accessLevel:
          enabled
            ? accessLevel
            : null,

        cohort:
          String(
            beta.cohort || ""
          ).trim(),

        startedAt:
          enabled
            ? (
                beta.startedAt ||
                new Date()
                  .toISOString()
              )
            : null,

        expiresAt:
          beta.expiresAt ||
          null
      };
    }


    if (
      plan === undefined &&
      beta === undefined
    ) {
      return res
        .status(400)
        .json({
          error:
            "Nothing to update"
        });
    }


    const ref =
      adminDb
        .collection("users")
        .doc(target.uid);


    await ref.set(
      {
        uid:
          target.uid,

        email:
          target.email ||
          "",

        ...update
      },
      {
        merge: true
      }
    );


    const snapshot =
      await ref.get();


    return res
      .status(200)
      .json({
        ok: true,

        target: {
          uid:
            target.uid,

          email:
            target.email ||
            ""
        },

        access: {
          plan:
            snapshot.get(
              "plan"
            ) ||
            "free",

          beta:
            snapshot.get(
              "beta"
            ) ||
            null
        }
      });

  } catch (error) {
    console.error(
      "FUELAI ADMIN ACCESS ERROR:",
      error
    );


    return res
      .status(
        error.statusCode ||
        500
      )
      .json({
        error:
          error.message ||
          "Admin access update failed"
      });
  }
}
