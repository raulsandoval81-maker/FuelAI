import {
  requireTeamCoach
} from "./_auth.js";

import { requireTeamSharing } from "../_lib/consent.js";
import { getAdminDb } from "../_lib/firebase-admin.js";


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
      teamId
    } = req.body || {};


    const context =
      await requireTeamCoach(
        req,
        teamId
      );


    const snapshot =
      await context
        .teamRef
        .collection("members")
        .get();


    const db = getAdminDb();
    await Promise.all(
      snapshot.docs
        .map(memberDoc => memberDoc.data() || {})
        .filter(member => member.role === "athlete")
        .map(member => requireTeamSharing(
          member.uid,
          context.teamId,
          db
        ))
    );


    const members =
      snapshot.docs
        .map(doc => {

          const data =
            doc.data();


          return {
            uid:
              data.uid ||
              doc.id,

            email:
              data.email ||
              "",

            role:
              data.role ||
              "athlete",

            status:
              data.status ||
              "inactive",

            joinedAt:
              data.joinedAt
                ?.toDate?.()
                ?.toISOString?.() ||
              null
          };
        })
        .sort(
          (a, b) =>
            String(a.email)
              .localeCompare(
                String(b.email)
              )
        );


    const summary = {
      total:
        members.length,

      athletes:
        members.filter(
          member =>
            member.role ===
            "athlete"
        ).length,

      coaches:
        members.filter(
          member =>
            member.role ===
            "coach" ||
            member.role ===
            "admin"
        ).length,

      active:
        members.filter(
          member =>
            member.status ===
            "active"
        ).length
    };


    return res.status(200).json({
      ok: true,

      team: {
        teamId:
          context.teamId,

        name:
          context.team.name ||
          context.teamId,

        sport:
          context.team.sport ||
          "",

        status:
          context.team.status ||
          "active"
      },

      summary,

      members
    });

  } catch (error) {
    console.error(
      "FUELAI TEAM ROSTER ERROR:",
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
          "Roster request failed"
      });
  }
}
