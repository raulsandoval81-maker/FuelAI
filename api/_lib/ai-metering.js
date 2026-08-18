import {
  FieldValue,
  getAdminAuth,
  getAdminDb
} from "./firebase-admin.js";

import {
  AiApiError,
  validateAiRequestId
} from "./ai-security.js";

import {
  consentRef,
  getConsentState
} from "./consent.js";


const DEFAULT_GLOBAL_DAILY_CAP = 100;


function getBearerToken(req) {
  const header =
    String(
      req.headers?.authorization || ""
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
  reset.setUTCDate(reset.getUTCDate() + 1);
  reset.setUTCHours(0, 0, 0, 0);
  return reset.toISOString();
}


export function normalizeAiPlan(value) {
  const plan =
    String(value || "")
      .trim()
      .toLowerCase();

  if (plan === "basic") {
    return "standard";
  }

  return ["free", "standard", "plus"]
    .includes(plan)
      ? plan
      : "free";
}


function isActiveBeta(beta) {
  if (!beta || beta.enabled !== true) {
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
    Number.isFinite(expiration.getTime()) &&
    expiration.getTime() > Date.now()
  );
}


export function resolveAiLimit(
  user,
  {
    limits,
    customLimitField
  }
) {
  const purchasedPlan =
    normalizeAiPlan(user.plan);

  const effectivePlan =
    isActiveBeta(user.beta)
      ? normalizeAiPlan(
          user.beta.accessLevel
        )
      : purchasedPlan;

  const rawCustomLimit =
    user.aiAccess?.[customLimitField];

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
      : limits[effectivePlan];

  return {
    purchasedPlan,
    effectivePlan,
    limit
  };
}


export function getAiGlobalDailyCap(
  controls
) {
  const configured =
    Number(controls.dailyRequestCap);

  if (
    controls.dailyRequestCap !== "" &&
    controls.dailyRequestCap !== null &&
    controls.dailyRequestCap !== undefined &&
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


export async function authenticateAiRequest(
  req,
  {
    toolLabel,
    auth = getAdminAuth()
  }
) {
  const token = getBearerToken(req);

  if (!token) {
    throw new AiApiError(
      401,
      "AUTH_REQUIRED",
      `Sign in to use ${toolLabel}.`
    );
  }

  try {
    return await auth.verifyIdToken(token);
  } catch {
    throw new AiApiError(
      401,
      "AUTH_REQUIRED",
      "Your session expired. Sign in again."
    );
  }
}


export async function reserveAiScan({
  uid,
  requestId,
  tool,
  toolLabel,
  usageKey,
  limits,
  customLimitField,
  toolEnabledField,
  db = getAdminDb()
}) {
  const safeRequestId =
    validateAiRequestId(requestId);
  const dateKey = getUtcDateKey();
  const userRef =
    db.collection("users").doc(uid);
  const usageRef =
    userRef.collection("aiUsage").doc(dateKey);
  const requestRef =
    db.collection("aiRequests")
      .doc(`${uid}_${safeRequestId}`);
  const controlsRef =
    db.collection("system").doc("aiControls");
  const globalUsageRef =
    db.collection("aiSystemUsage").doc(dateKey);
  const privacyRef = consentRef(db, uid);

  return db.runTransaction(
    async transaction => {
      const [
        userSnapshot,
        usageSnapshot,
        requestSnapshot,
        controlsSnapshot,
        globalUsageSnapshot,
        consentSnapshot
      ] = await Promise.all([
        transaction.get(userRef),
        transaction.get(usageRef),
        transaction.get(requestRef),
        transaction.get(controlsRef),
        transaction.get(globalUsageRef),
        transaction.get(privacyRef)
      ]);

      if (!userSnapshot.exists) {
        throw new AiApiError(
          403,
          "AI_ACCESS_DENIED",
          `Complete FuelAI setup before using ${toolLabel}.`
        );
      }

      const consentRecord = consentSnapshot.exists
        ? consentSnapshot.data() || null
        : null;
      const consentState = getConsentState(consentRecord);

      if (!consentState.active || consentRecord?.uid !== uid) {
        throw new AiApiError(
          403,
          consentState.reason === "under_13"
            ? "AGE_NOT_SUPPORTED"
            : "CONSENT_REQUIRED",
          consentState.reason === "under_13"
            ? "FuelAI is not available for users under 13."
            : "Accept the current FuelAI Privacy Notice and Terms to use AI tools."
        );
      }

      if (requestSnapshot.exists) {
        throw new AiApiError(
          409,
          "REQUEST_ALREADY_USED",
          `This ${toolLabel} request was already submitted.`
        );
      }

      const user = userSnapshot.data() || {};

      if (
        user.aiAccess?.enabled === false ||
        (
          toolEnabledField &&
          user.aiAccess?.[toolEnabledField] === false
        )
      ) {
        throw new AiApiError(
          403,
          "AI_ACCESS_DENIED",
          `${toolLabel} access is not enabled for this account.`
        );
      }

      const controls =
        controlsSnapshot.exists
          ? controlsSnapshot.data() || {}
          : {};

      if (
        controls.enabled === false ||
        process.env.FUELAI_AI_ENABLED === "false"
      ) {
        throw new AiApiError(
          503,
          "AI_TEMPORARILY_DISABLED",
          controls.emergencyMessage ||
            `${toolLabel} is temporarily unavailable.`
        );
      }

      const access = resolveAiLimit(user, {
        limits,
        customLimitField
      });
      const usage =
        usageSnapshot.exists
          ? usageSnapshot.data() || {}
          : {};
      const toolUsage = usage[usageKey] || {};
      const reserved =
        Number(toolUsage.reserved) || 0;

      if (reserved >= access.limit) {
        throw new AiApiError(
          429,
          "SCAN_LIMIT_REACHED",
          `You’ve used today’s ${toolLabel} scans.`,
          {
            usage: {
              used: reserved,
              limit: access.limit,
              remaining: 0,
              resetsAt: getNextUtcReset()
            }
          }
        );
      }

      const globalUsage =
        globalUsageSnapshot.exists
          ? globalUsageSnapshot.data() || {}
          : {};
      const globalReserved =
        Number(globalUsage.reserved) || 0;
      const globalCap =
        getAiGlobalDailyCap(controls);

      if (
        globalCap === 0 ||
        globalReserved >= globalCap
      ) {
        throw new AiApiError(
          503,
          "AI_TEMPORARILY_DISABLED",
          controls.emergencyMessage ||
            `${toolLabel} has reached today’s beta capacity.`
        );
      }

      transaction.set(
        usageRef,
        {
          date: dateKey,
          [usageKey]: {
            reserved: reserved + 1,
            succeeded:
              Number(toolUsage.succeeded) || 0,
            failed:
              Number(toolUsage.failed) || 0
          },
          updatedAt:
            FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      transaction.set(
        globalUsageRef,
        {
          date: dateKey,
          reserved: globalReserved + 1,
          updatedAt:
            FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      transaction.create(
        requestRef,
        {
          uid,
          tool,
          status: "reserved",
          date: dateKey,
          purchasedPlan:
            access.purchasedPlan,
          effectivePlan:
            access.effectivePlan,
          createdAt:
            FieldValue.serverTimestamp(),
          completedAt: null
        }
      );

      return {
        dateKey,
        limit: access.limit,
        used: reserved + 1,
        remaining: Math.max(
          0,
          access.limit - reserved - 1
        ),
        resetsAt: getNextUtcReset(),
        requestRef,
        usageRef,
        usageKey
      };
    }
  );
}


export async function finalizeAiScan({
  reservation,
  succeeded,
  providerUsage = null,
  failureCode = null,
  db = getAdminDb()
}) {
  if (!reservation) {
    return;
  }

  const inputTokens = Number(
    providerUsage?.prompt_tokens ??
    providerUsage?.input_tokens
  ) || 0;
  const outputTokens = Number(
    providerUsage?.completion_tokens ??
    providerUsage?.output_tokens
  ) || 0;

  await db.runTransaction(
    async transaction => {
      const [usageSnapshot, requestSnapshot] =
        await Promise.all([
          transaction.get(reservation.usageRef),
          transaction.get(reservation.requestRef)
        ]);

      if (
        !requestSnapshot.exists ||
        requestSnapshot.data()?.status !==
          "reserved"
      ) {
        return;
      }

      const usage =
        usageSnapshot.exists
          ? usageSnapshot.data() || {}
          : {};
      const toolUsage =
        usage[reservation.usageKey] || {};

      transaction.set(
        reservation.usageRef,
        {
          [reservation.usageKey]: {
            reserved:
              Number(toolUsage.reserved) || 1,
            succeeded:
              (Number(toolUsage.succeeded) || 0) +
              (succeeded ? 1 : 0),
            failed:
              (Number(toolUsage.failed) || 0) +
              (succeeded ? 0 : 1)
          },
          inputTokens:
            (Number(usage.inputTokens) || 0) +
            inputTokens,
          outputTokens:
            (Number(usage.outputTokens) || 0) +
            outputTokens,
          updatedAt:
            FieldValue.serverTimestamp()
        },
        { merge: true }
      );

      transaction.set(
        reservation.requestRef,
        {
          status:
            succeeded ? "succeeded" : "failed",
          usage: {
            inputTokens,
            outputTokens
          },
          failureCode: failureCode || null,
          completedAt:
            FieldValue.serverTimestamp()
        },
        { merge: true }
      );
    }
  );
}


export async function finalizeSuccessfulAiScan({
  reservation,
  providerUsage = null,
  finalize = finalizeAiScan,
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
      "AI METERING ERROR:",
      meteringError
    );
    return false;
  }
}


export function getAiUsageResponse(reservation) {
  return {
    used: reservation.used,
    limit: reservation.limit,
    remaining: reservation.remaining,
    resetsAt: reservation.resetsAt
  };
}
