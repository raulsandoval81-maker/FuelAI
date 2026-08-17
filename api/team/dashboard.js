import {
  getAdminDb
} from "../_lib/firebase-admin.js";

import {
  requireTeamCoach
} from "./_auth.js";

import { requireTeamSharing } from "../_lib/consent.js";


const VALID_RANGES =
  new Set([
    7,
    21,
    42
  ]);


function getDateKey(
  date
) {

  return date
    .toISOString()
    .slice(
      0,
      10
    );

}


function getCutoffKey(
  rangeDays
) {

  const date =
    new Date();


  date.setHours(
    0,
    0,
    0,
    0
  );


  /*
   * Inclusive window:
   * today + previous N - 1 days.
   */
  date.setDate(
    date.getDate() -
    (
      rangeDays -
      1
    )
  );


  return getDateKey(
    date
  );

}


function cleanMetricDay(
  data,
  fallbackDate
) {

  return {

    date:
      String(
        data?.date ||
        fallbackDate ||
        ""
      ),

    weight:
      Number.isFinite(
        Number(
          data?.weight
        )
      )
        ? Number(
            data.weight
          )
        : null,

    sleepHours:
      Number.isFinite(
        Number(
          data?.sleepHours
        )
      )
        ? Number(
            data.sleepHours
          )
        : null,

    hydrationOz:
      Number.isFinite(
        Number(
          data?.hydrationOz
        )
      )
        ? Number(
            data.hydrationOz
          )
        : null,

    calories:
      Number.isFinite(
        Number(
          data?.calories
        )
      )
        ? Number(
            data.calories
          )
        : null,

    caloriesTarget:
      Number.isFinite(
        Number(
          data?.caloriesTarget
        )
      )
        ? Number(
            data.caloriesTarget
          )
        : null,

    trainingToday:
      Boolean(
        data?.trainingToday
      )

  };

}


export default async function handler(
  req,
  res
) {

  if (
    req.method !==
    "POST"
  ) {

    return res.status(405).json({
      error:
        "Method not allowed"
    });

  }


  try {

    const {
      teamId,
      rangeDays = 7
    } =
      req.body ||
      {};


    const safeRange =
      Number(
        rangeDays
      );


    if (
      !VALID_RANGES.has(
        safeRange
      )
    ) {

      return res.status(400).json({
        error:
          "rangeDays must be 7, 21, or 42"
      });

    }


    const context =
      await requireTeamCoach(
        req,
        teamId
      );


    const cutoffKey =
      getCutoffKey(
        safeRange
      );


    const membersSnapshot =
      await context
        .teamRef
        .collection(
          "members"
        )
        .get();


    /*
     * Mid is athlete assessment.
     * Coaches/admins are not rows in
     * the performance dashboard.
     */
    const athletes =
      membersSnapshot.docs
        .map(
          memberDoc => {

            const data =
              memberDoc.data();


            return {

              uid:
                data.uid ||
                memberDoc.id,

              email:
                data.email ||
                "",

              role:
                data.role ||
                "athlete",

              status:
                data.status ||
                "inactive"

            };

          }
        )
        .filter(
          member =>
            member.role ===
              "athlete" &&
            member.status ===
              "active"
        )
        .sort(
          (a, b) =>
            String(
              a.email
            )
              .localeCompare(
                String(
                  b.email
                )
              )
        );


    const db =
      getAdminDb();


    const athleteRows =
      await Promise.all(
        athletes.map(
          async athlete => {

            await requireTeamSharing(
              athlete.uid,
              context.teamId,
              db
            );

            const metricsSnapshot =
              await db
                .collection(
                  "users"
                )
                .doc(
                  athlete.uid
                )
                .collection(
                  "teamMetrics"
                )
                .where(
                  "date",
                  ">=",
                  cutoffKey
                )
                .get();


            const days =
              metricsSnapshot.docs
                .map(
                  metricDoc =>
                    cleanMetricDay(
                      metricDoc.data(),
                      metricDoc.id
                    )
                )
                .sort(
                  (a, b) =>
                    a.date.localeCompare(
                      b.date
                    )
                );


            return {

              uid:
                athlete.uid,

              email:
                athlete.email,

              status:
                athlete.status,

              days

            };

          }
        )
      );


    return res.status(200).json({

      ok: true,

      rangeDays:
        safeRange,

      cutoff:
        cutoffKey,

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

      summary: {

        athletes:
          athleteRows.length,

        reporting:
          athleteRows.filter(
            athlete =>
              athlete.days.length >
              0
          ).length,

        missing:
          athleteRows.filter(
            athlete =>
              athlete.days.length ===
              0
          ).length

      },

      athletes:
        athleteRows

    });

  } catch (error) {

    console.error(
      "FUELAI TEAM DASHBOARD ERROR:",
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
          "Team dashboard request failed"
      });

  }

}
