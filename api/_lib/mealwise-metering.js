import {
  authenticateAiRequest,
  finalizeAiScan,
  finalizeSuccessfulAiScan,
  getAiGlobalDailyCap,
  getAiUsageResponse,
  normalizeAiPlan,
  reserveAiScan,
  resolveAiLimit
} from "./ai-metering.js";


const MEALWISE_LIMITS = {
  free: 2,
  standard: 5,
  plus: 8
};


export function normalizeMealWisePlan(value) {
  return normalizeAiPlan(value);
}


export function resolveMealWiseLimit(user) {
  return resolveAiLimit(user, {
    limits: MEALWISE_LIMITS,
    customLimitField: "customMealLimit"
  });
}


export function getMealWiseGlobalDailyCap(
  controls
) {
  return getAiGlobalDailyCap(controls);
}


export function authenticateMealWise(
  req,
  options = {}
) {
  return authenticateAiRequest(req, {
    toolLabel: "MealWise",
    ...options
  });
}


export function reserveMealWiseScan({
  uid,
  requestId,
  db
}) {
  return reserveAiScan({
    uid,
    requestId,
    tool: "meal",
    toolLabel: "MealWise",
    usageKey: "meal",
    limits: MEALWISE_LIMITS,
    customLimitField: "customMealLimit",
    ...(db ? { db } : {})
  });
}


export function finalizeMealWiseScan(options) {
  return finalizeAiScan(options);
}


export function finalizeSuccessfulMealWiseScan({
  reservation,
  providerUsage = null,
  finalize = finalizeMealWiseScan,
  logger = console
}) {
  return finalizeSuccessfulAiScan({
    reservation,
    providerUsage,
    finalize,
    logger
  });
}


export function getMealWiseUsageResponse(
  reservation
) {
  return getAiUsageResponse(reservation);
}
