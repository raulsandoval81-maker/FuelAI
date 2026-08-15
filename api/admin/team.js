import {
  getAdminAuth,
  getAdminDb,
  FieldValue
} from "../_lib/firebase-admin.js";


const VALID_TEAM_ROLES =
  new Set([
    "athlete",
    "coach",
    "admin"
  ]);


const VALID_TEAM_STATUSES =
  new Set([
    "active",
    "invited",
    "inactive"
  ]);


function getBearerToken(req) {
  const header =
    String(
      req.headers?.authorization ||
      ""
    );

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header
    .slice(7)
    .trim();
}


async function requireFuelAIAdmin(req) {
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
    await getAdminAuth()
      .verifyIdToken(token);


  const adminUid =
    String(
      process.env.FUELAI_ADMIN_UID ||
      ""
    ).trim();


  if (
    !adminUid ||
    decoded.uid !== adminUid
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


function normalizeTeamId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


export default async function handler(
  req,
  res
) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }


  try {
    const admin =
      await requireFuelAIAdmin(req);


    const {
      action,
      teamId,
      name,
      sport = "",
      targetUid = "",
      targetEmail = "",
      role = "athlete",
      status = "active"
    } = req.body || {};


    const normalizedAction =
      String(action || "")
        .trim()
        .toLowerCase();


    const normalizedTeamId =
      normalizeTeamId(teamId);


    if (!normalizedTeamId) {
      return res.status(400).json({
        error: "teamId is required"
      });
    }


    const db =
      getAdminDb();


    const teamRef =
      db
        .collection("teams")
        .doc(normalizedTeamId);


    if (normalizedAction === "create") {
      const safeName =
        String(name || "").trim();


      if (!safeName) {
        return res.status(400).json({
          error: "Team name is required"
        });
      }


      const existing =
        await teamRef.get();


      if (existing.exists) {
        return res.status(409).json({
          error: "Team already exists"
        });
      }


      await teamRef.set({
        name: safeName,

        sport:
          String(sport || "").trim(),

        status: "active",

        createdBy:
          admin.uid,

        createdAt:
          FieldValue.serverTimestamp(),

        updatedAt:
          FieldValue.serverTimestamp()
      });


      return res.status(200).json({
        ok: true,
        action: "create",
        teamId: normalizedTeamId,
        name: safeName
      });
    }


    if (normalizedAction === "member") {
      const safeRole =
        String(role || "")
          .trim()
          .toLowerCase();

      const safeStatus =
        String(status || "")
          .trim()
          .toLowerCase();


      if (!VALID_TEAM_ROLES.has(safeRole)) {
        return res.status(400).json({
          error: "Invalid team role"
        });
      }


      if (
        !VALID_TEAM_STATUSES.has(
          safeStatus
        )
      ) {
        return res.status(400).json({
          error: "Invalid team status"
        });
      }


      const teamSnapshot =
        await teamRef.get();


      if (!teamSnapshot.exists) {
        return res.status(404).json({
          error: "Team not found"
        });
      }


      let target;


      if (String(targetUid || "").trim()) {
        target =
          await getAdminAuth()
            .getUser(
              String(targetUid).trim()
            );
      } else if (
        String(targetEmail || "").trim()
      ) {
        target =
          await getAdminAuth()
            .getUserByEmail(
              String(targetEmail)
                .trim()
                .toLowerCase()
            );
      } else {
        return res.status(400).json({
          error:
            "targetUid or targetEmail is required"
        });
      }


      const memberRef =
        teamRef
          .collection("members")
          .doc(target.uid);


      const existing =
        await memberRef.get();


      await memberRef.set(
        {
          uid:
            target.uid,

          email:
            target.email || "",

          role:
            safeRole,

          status:
            safeStatus,

          updatedAt:
            FieldValue.serverTimestamp(),

          updatedBy:
            admin.uid,

          ...(
            existing.exists
              ? {}
              : {
                  joinedAt:
                    FieldValue
                      .serverTimestamp()
                }
          )
        },
        {
          merge: true
        }
      );


      return res.status(200).json({
        ok: true,

        action: "member",

        teamId:
          normalizedTeamId,

        member: {
          uid:
            target.uid,

          email:
            target.email || "",

          role:
            safeRole,

          status:
            safeStatus
        }
      });
    }


    return res.status(400).json({
      error: "Invalid action"
    });

  } catch (error) {
    console.error(
      "FUELAI TEAM ADMIN ERROR:",
      error
    );


    return res
      .status(
        error.statusCode || 500
      )
      .json({
        error:
          error.message ||
          "Team admin operation failed"
      });
  }
}
