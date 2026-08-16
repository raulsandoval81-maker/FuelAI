import {
  FieldValue,
  getAdminAuth,
  getAdminDb
} from "./firebase-admin.js";

import {
  MealWiseApiError,
  validateRequestId
} from "./mealwise-security.js";


const PLAN_LIMITS = {
  free: 2,
  standard: 5,
  plus: 8
};

const DEFAULT_GLOBAL_DAILY_CAP = 100;


function getBearerToken(req) {
  const header =
    String(
      req.headers?.authorization ||
      ""
    );

  if (!header.startsWith("Bearer ")) {
    return "";
  }

  return header.slice(7).trim();
}


function getUtcDateKey() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}


function getNextUtcReset() {
  const reset = new Date();

  reset.setUTCDate(
    reset.getUTCDate() + 1
  );

  reset.setUTCHours(0, 0, 0, 0);

  return reset.toISOString();
}


export function normalizeMealWisePlan(value) {
  const plan =
    String(value || "")
      .trim()
      .toLowerCase();

  if (plan === "basic") {
    return "standard";
  }

  return Object.hasOwn(
    PLAN_LIMITS,
    plan
  )
    ? plan
    : "free";
}


function isActiveBeta(beta) {
  if (
    !beta ||
    beta.enabled !== true
  ) {
    return false;
  }

  if (!beta.expiresAt) {
    return true;
  }

  const expiration =
    typeof beta.expiresAt?.toDate ===
      "function"
      ? beta.expiresAt.toDate()
      : new Date(beta.expiresAt);

  return (
    Number.isFinite(
      expiration.getTime()
    ) &&
    expiration.getTime() > Date.now()
  );
}


export function resolveMealWiseLimit(user) {
  const purchasedPlan =
    normalizeMealWisePlan(user.plan);

  const effectivePlan =
    isActiveBeta(user.beta)
      ? normalizeMealWisePlan(
          user.beta.accessLevel
        )
      : purchasedPlan;

  const rawCustomLimit =
    user.aiAccess
      ?.customMealLimit;

  const customLimit =
    rawCustomLimit === null ||
    rawCustomLimit === undefined ||
    rawCustomLimit === ""
      ? Number.NaN
      : Number(rawCustomLimit);

  const limit =
    Number.isInteger(customLimit) &&
    customLimit >= 0 &&
    customLimit <= 100
      ? customLimit
      : PLAN_LIMITS[effectivePlan];

  return {
    purchasedPlan,
    effectivePlan,
    limit
  };
}


export function getMealWiseGlobalDailyCap(controls) {
  const rawConfigured =
    controls.dailyRequestCap;

  const configured =
    rawConfigured === null ||
    rawConfigured === undefined ||
    rawConfigured === ""
      ? Number.NaN
      : Number(rawConfigured);

  if (
    Number.isInteger(configured) &&
    configured >= 0
  ) {
    return configured;
  }

  const environmentCap =
    Number(
      process.env
        .FUELAI_AI_DAILY_REQUEST_CAP
    );

  if (
    Number.isInteger(environmentCap) &&
    environmentCap >= 0
  ) {
    return environmentCap;
  }

  return DEFAULT_GLOBAL_DAILY_CAP;
}


export async function authenticateMealWise(
  req,
  {
    auth = getAdminAuth()
  } = {}
) {
  const token =
    getBearerToken(req);

  if (!token) {
    throw new MealWiseApiError(
      401,
      "AUTH_REQUIRED",
      "Sign in to use MealWise."
    );
  }

  try {
    return await auth
      .verifyIdToken(token);
  } catch {
    throw new MealWiseApiError(
      401,
      "AUTH_REQUIRED",
      "Your session expired. Sign in again."
    );
  }
}


export async function reserveMealWiseScan({
  uid,
  requestId,
  db = getAdminDb()
}) {
  const safeRequestId =
    validateRequestId(requestId);

  const dateKey =
    getUtcDateKey();

  const userRef =
    db.collection("users").doc(uid);

  const usageRef =
    userRef
      .collection("aiUsage")
      .doc(dateKey);

  const requestRef =
    db
      .collection("aiRequests")
      .doc(`${uid}_${safeRequestId}`);

  const controlsRef =
    db
      .collection("system")
      .doc("aiControls");

  const globalUsageRef =
    db
      .collection("aiSystemUsage")
      .doc(dateKey);

  return db.runTransaction(
    async transaction => {
      const [
        userSnapshot,
        usageSnapshot,
        requestSnapshot,
        controlsSnapshot,
        globalUsageSnapshot
      ] = await Promise.all([
        transaction.get(userRef),
        transaction.get(usageRef),
        transaction.get(requestRef),
        transaction.get(controlsRef),
        transaction.get(globalUsageRef)
      ]);

      if (!userSnapshot.exists) {
        throw new MealWiseApiError(
          403,
          "AI_ACCESS_DENIED",
          "Complete FuelAI setup before using MealWise."
        );
      }

      if (requestSnapshot.exists) {
        throw new MealWiseApiError(
          409,
          "REQUEST_ALREADY_USED",
          "This MealWise request was already submitted."
        );
      }

      const user =
        userSnapshot.data() || {};

      if (
        user.aiAccess
          ?.enabled === false
      ) {
        throw new MealWiseApiError(
          403,
          "AI_ACCESS_DENIED",
          "MealWise access is not enabled for this account."
        );
      }

      const controls =
        controlsSnapshot.exists
          ? controlsSnapshot.data() || {}
          : {};

      if (
        controls.enabled === false ||
        process.env.FUELAI_AI_ENABLED ===
          "false"
      ) {
        throw new MealWiseApiError(
          503,
          "AI_TEMPORARILY_DISABLED",
          controls.emergencyMessage ||
            "MealWise is temporarily unavailable."
        );
      }

      const {
        purchasedPlan,
        effectivePlan,
        limit
      } = resolveMealWiseLimit(user);

      const usage =
        usageSnapshot.exists
          ? usageSnapshot.data() || {}
          : {};

      const reserved =
        Number(usage.meal?.reserved) ||
        0;

      if (reserved >= limit) {
        throw new MealWiseApiError(
          429,
          "SCAN_LIMIT_REACHED",
          "You’ve used today’s MealWise scans.",
          {
            usage: {
              used: reserved,
              limit,
              remaining: 0,
              resetsAt:
                getNextUtcReset()
            }
          }
        );
      }

      const globalUsage =
        globalUsageSnapshot.exists
          ? globalUsageSnapshot.data() || {}
          : {};

      const globalReserved =
        Number(
          globalUsage.reserved
        ) || 0;

      const globalCap =
        getMealWiseGlobalDailyCap(controls);

      if (
        globalCap === 0 ||
        globalReserved >= globalCap
      ) {
        throw new MealWiseApiError(
          503,
          "AI_TEMPORARILY_DISABLED",
          controls.emergencyMessage ||
            "MealWise has reached today’s beta capacity."
        );
      }

      transaction.set(
        usageRef,
        {
          date: dateKey,
          meal: {
            reserved:
              reserved + 1,
            succeeded:
              Number(
                usage.meal?.succeeded
              ) || 0,
            failed:
              Number(
                usage.meal?.failed
              ) || 0
          },
          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );

      transaction.set(
        globalUsageRef,
        {
          date: dateKey,
          reserved:
            globalReserved + 1,
          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );

      transaction.create(
        requestRef,
        {
          uid,
          tool: "meal",
          status: "reserved",
          date: dateKey,
          purchasedPlan,
          effectivePlan,
          createdAt:
            FieldValue.serverTimestamp(),
          completedAt: null
        }
      );

      return {
        dateKey,
        limit,
        used: reserved + 1,
        remaining:
          Math.max(
            0,
            limit - reserved - 1
          ),
        resetsAt:
          getNextUtcReset(),
        requestRef,
        usageRef
      };
    }
  );
}


export async function finalizeMealWiseScan({
  reservation,
  succeeded,
  providerUsage = null,
  failureCode = null,
  db = getAdminDb()
}) {
  if (!reservation) {
    return;
  }

  const inputTokens =
    Number(
      providerUsage?.prompt_tokens ??
      providerUsage?.input_tokens
    ) || 0;

  const outputTokens =
    Number(
      providerUsage?.completion_tokens ??
      providerUsage?.output_tokens
    ) || 0;

  await db.runTransaction(
    async transaction => {
      const [
        usageSnapshot,
        requestSnapshot
      ] = await Promise.all([
        transaction.get(
          reservation.usageRef
        ),
        transaction.get(
          reservation.requestRef
        )
      ]);

      if (
        !requestSnapshot.exists ||
        requestSnapshot.data()
          ?.status !== "reserved"
      ) {
        return;
      }

      const usage =
        usageSnapshot.exists
          ? usageSnapshot.data() || {}
          : {};

      transaction.set(
        reservation.usageRef,
        {
          meal: {
            reserved:
              Number(
                usage.meal?.reserved
              ) || 1,
            succeeded:
              (
                Number(
                  usage.meal?.succeeded
                ) || 0
              ) + (succeeded ? 1 : 0),
            failed:
              (
                Number(
                  usage.meal?.failed
                ) || 0
              ) + (succeeded ? 0 : 1)
          },
          inputTokens:
            (
              Number(
                usage.inputTokens
              ) || 0
            ) + inputTokens,
          outputTokens:
            (
              Number(
                usage.outputTokens
              ) || 0
            ) + outputTokens,
          updatedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );

      transaction.set(
        reservation.requestRef,
        {
          status:
            succeeded
              ? "succeeded"
              : "failed",
          usage: {
            inputTokens,
            outputTokens
          },
          failureCode:
            failureCode || null,
          completedAt:
            FieldValue.serverTimestamp()
        },
        {
          merge: true
        }
      );
    }
  );
}


export async function finalizeSuccessfulMealWiseScan({
  reservation,
  providerUsage = null,
  finalize = finalizeMealWiseScan,
  logger = console
}) {
  try {
    await finalize({
      reservation,
      succeeded: true,
      providerUsage
    });

    return true;
  } catch (meteringError) {
    logger.error(
      "MEALWISE METERING ERROR:",
      meteringError
    );

    return false;
  }
}


export function getMealWiseUsageResponse(
  reservation
) {
  return {
    used: reservation.used,
    limit: reservation.limit,
    remaining:
      reservation.remaining,
    resetsAt:
      reservation.resetsAt
  };
}
