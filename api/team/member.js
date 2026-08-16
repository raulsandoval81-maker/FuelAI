import {
  getAdminAuth,
  FieldValue
} from "../_lib/firebase-admin.js";

import {
  requireTeamCoach
} from "./_auth.js";


const VALID_STATUSES =
  new Set([
    "active",
    "invited",
    "inactive"
  ]);


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
    const {
      teamId,
      targetUid = "",
      targetEmail = "",
      status = "active"
    } = req.body || {};


    const context =
      await requireTeamCoach(
        req,
        teamId
      );


    const safeStatus =
      String(status || "")
        .trim()
        .toLowerCase();


    if (
      !VALID_STATUSES.has(
        safeStatus
      )
    ) {
      return res.status(400).json({
        error:
          "Invalid membership status"
      });
    }


    let target;


    if (
      String(targetUid || "")
        .trim()
    ) {
      target =
        await getAdminAuth()
          .getUser(
            String(targetUid)
              .trim()
          );

    } else if (
      String(targetEmail || "")
        .trim()
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
      context
        .teamRef
        .collection("members")
        .doc(target.uid);


    const existing =
      await memberRef.get();


    let membershipAction =
      "added";


    if (existing.exists) {

      const existingData =
        existing.data();


      if (
        existingData.role &&
        existingData.role !==
          "athlete"
      ) {
        return res.status(403).json({
          error:
            "Coach and admin memberships cannot be changed here"
        });
      }


      const existingStatus =
        String(
          existingData.status ||
          ""
        )
          .trim()
          .toLowerCase();


      /*
       * Adding an athlete who is already
       * active should be a no-op.
       */
      if (
        existingStatus === "active" &&
        safeStatus === "active"
      ) {
        return res.status(200).json({
          ok: true,

          action:
            "already_active",

          teamId:
            context.teamId,

          member: {
            uid:
              target.uid,

            email:
              target.email ||
              "",

            role:
              "athlete",

            status:
              "active"
          }
        });
      }


      membershipAction =
        existingStatus === "inactive" &&
        safeStatus === "active"
          ? "reactivated"
          : "updated";

    }


    /*
     * Team coaches can manage athletes.
     *
     * They cannot use this endpoint to
     * promote somebody to coach/admin.
     */
    await memberRef.set(
      {
        uid:
          target.uid,

        email:
          target.email ||
          "",

        role:
          "athlete",

        status:
          safeStatus,

        updatedAt:
          FieldValue
            .serverTimestamp(),

        updatedBy:
          context.user.uid,

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

      action:
        membershipAction,

      teamId:
        context.teamId,

      member: {
        uid:
          target.uid,

        email:
          target.email ||
          "",

        role:
          "athlete",

        status:
          safeStatus
      }
    });

  } catch (error) {
    console.error(
      "FUELAI TEAM MEMBER ERROR:",
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
          "Team member update failed"
      });
  }
}
