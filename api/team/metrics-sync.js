import {
  getAdminDb,
  FieldValue
} from "../_lib/firebase-admin.js";

import {
  normalizeTeamId,
  requireSignedInUser
} from "./_auth.js";

import { requireTeamSharing } from "../_lib/consent.js";


const MAX_TEAM_METRIC_DAYS =
  42;


function cleanNumber(
  value
) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }


  const number =
    Number(value);


  return Number.isFinite(number)
    ? number
    : null;

}


function isDateKey(
  value
) {

  return /^\d{4}-\d{2}-\d{2}$/
    .test(
      String(value || "")
    );

}


function getCutoffKey() {

  const date =
    new Date();


  date.setHours(
    0,
    0,
    0,
    0
  );


  /*
   * Inclusive 42-day window:
   * today + previous 41 days.
   */
  date.setDate(
    date.getDate() -
    (
      MAX_TEAM_METRIC_DAYS -
      1
    )
  );


  return date
    .toISOString()
    .slice(
      0,
      10
    );

}


function sanitizeDay(
  input
) {

  const date =
    String(
      input?.date ||
      ""
    ).trim();


  if (!isDateKey(date)) {
    return null;
  }


  return {

    date,

    weight:
      cleanNumber(
        input.weight
      ),

    sleepHours:
      cleanNumber(
        input.sleepHours
      ),

    hydrationOz:
      cleanNumber(
        input.hydrationOz
      ),

    calories:
      cleanNumber(
        input.calories
      ),

    caloriesTarget:
      cleanNumber(
        input.caloriesTarget
      ),

    trainingToday:
      Boolean(
        input.trainingToday
      )

  };

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

    /*
     * UID comes from the verified Firebase
     * token — never from request.body.
     */
    const user =
      await requireSignedInUser(
        req
      );

    const teamId = normalizeTeamId(req.body?.teamId);
    if (!teamId) {
      return res.status(403).json({
        error: "Team sharing approval is required."
      });
    }

    const db = getAdminDb();
    const memberSnapshot = await db
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(user.uid)
      .get();
    const membership = memberSnapshot.exists
      ? memberSnapshot.data() || {}
      : {};
    if (
      membership.status !== "active" ||
      membership.role !== "athlete"
    ) {
      return res.status(403).json({
        error: "Active athlete membership is required."
      });
    }
    await requireTeamSharing(user.uid, teamId, db);


    const rawDays =
      Array.isArray(
        req.body?.days
      )
        ? req.body.days
        : [];


    if (
      rawDays.length >
      MAX_TEAM_METRIC_DAYS
    ) {

      return res.status(400).json({
        error:
          "Team metrics sync is limited to 42 days."
      });

    }


    const cutoffKey =
      getCutoffKey();


    const days =
      rawDays
        .map(
          sanitizeDay
        )
        .filter(
          Boolean
        )
        .filter(
          day =>
            day.date >=
            cutoffKey
        );


    /*
     * Prevent duplicate date writes within
     * one request.
     */
    const uniqueDays =
      new Map();


    days.forEach(
      day => {

        uniqueDays.set(
          day.date,
          day
        );

      }
    );


    const metricsRef =
      db
        .collection("users")
        .doc(user.uid)
        .collection(
          "teamMetrics"
        );


    /*
     * Keep Team Mid intentionally short:
     * remove anything older than 42 days.
     */
    const existing =
      await metricsRef.get();


    const batch =
      db.batch();


    existing.docs.forEach(
      doc => {

        if (
          doc.id <
          cutoffKey
        ) {

          batch.delete(
            doc.ref
          );

        }

      }
    );


    for (
      const [
        date,
        day
      ]
      of uniqueDays
    ) {

      const ref =
        metricsRef.doc(
          date
        );


      batch.set(
        ref,
        {
          ...day,

          uid:
            user.uid,

          updatedAt:
            FieldValue
              .serverTimestamp()
        },
        {
          merge: true
        }
      );

    }


    await batch.commit();


    return res.status(200).json({

      ok: true,

      uid:
        user.uid,

      cutoff:
        cutoffKey,

      synced:
        uniqueDays.size

    });

  } catch (error) {

    console.error(
      "FUELAI TEAM METRICS SYNC ERROR:",
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
          "Unable to sync team metrics"
      });

  }

}
