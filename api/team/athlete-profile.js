import {
  getAdminDb
} from "../_lib/firebase-admin.js";

import {
  requireTeamCoach
} from "./_auth.js";


function safeString(
  value
) {
  return String(
    value || ""
  ).trim();
}


export default async function handler(
  req,
  res
) {

  if (req.method !== "POST") {

    return res.status(405).json({
      error:
        "Method not allowed"
    });

  }


  try {

    const {
      teamId,
      targetUid
    } = req.body || {};


    const safeTeamId =
      safeString(
        teamId
      );


    const safeTargetUid =
      safeString(
        targetUid
      );


    if (!safeTeamId) {

      return res.status(400).json({
        error:
          "teamId is required"
      });

    }


    if (!safeTargetUid) {

      return res.status(400).json({
        error:
          "targetUid is required"
      });

    }


    /*
     * Verify the caller is an active
     * coach/admin for this team.
     */

    const context =
      await requireTeamCoach(
        req,
        safeTeamId
      );


    const db =
      getAdminDb();


    /*
     * Verify the requested athlete
     * actually belongs to this team.
     */

    const memberRef =
      context
        .teamRef
        .collection("members")
        .doc(safeTargetUid);


    const memberSnapshot =
      await memberRef.get();


    if (!memberSnapshot.exists) {

      return res.status(404).json({
        error:
          "Team member not found"
      });

    }


    const member =
      memberSnapshot.data() ||
      {};


    if (
      member.role !== "athlete"
    ) {

      return res.status(400).json({
        error:
          "Requested member is not an athlete"
      });

    }


    /*
     * Read the athlete's FuelAI account.
     * Do NOT return the whole document.
     */

    const userSnapshot =
      await db
        .collection("users")
        .doc(safeTargetUid)
        .get();


    const user =
      userSnapshot.exists
        ? userSnapshot.data()
        : {};


    const setup =
      user.setup &&
      typeof user.setup === "object"
        ? user.setup
        : {};


    return res.status(200).json({

      ok: true,

      athlete: {

        uid:
          safeTargetUid,

        email:
          safeString(
            member.email ||
            user.email
          ),

        role:
          "athlete",

        status:
          safeString(
            member.status
          ) ||
          "active",

        profile: {

          nickname:
            safeString(
              setup.nickname
            ),

          lifestyleType:
            safeString(
              setup.lifestyleType
            ),

          goal:
            safeString(
              setup.goal
            ),

          activityLevel:
            safeString(
              setup.activityLevel
            ),

          weight:
            setup.weight ??
            null,

          targetWeight:
            setup.targetWeight ??
            null,

          combatStyle:
            safeString(
              setup.combatStyle
            )

        }

      }

    });

  } catch (error) {

    console.error(
      "FUELAI ATHLETE PROFILE ERROR:",
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
          "Unable to load athlete profile"
      });

  }

}
