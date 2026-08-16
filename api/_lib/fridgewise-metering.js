import {
  authenticateAiRequest,
  finalizeAiScan,
  finalizeSuccessfulAiScan,
  getAiUsageResponse,
  reserveAiScan,
  resolveAiLimit
} from "./ai-metering.js";


const FRIDGEWISE_LIMITS = {
  free: 1,
  standard: 2,
  plus: 4
};


export function authenticateFridgeWise(
  req,
  options = {}
) {
  return authenticateAiRequest(req, {
    toolLabel: "FridgeWise",
    ...options
  });
}


export function resolveFridgeWiseLimit(user) {
  return resolveAiLimit(user, {
    limits: FRIDGEWISE_LIMITS,
    customLimitField: "customFridgeLimit"
  });
}


export function reserveFridgeWiseScan({
  uid,
  requestId,
  db
}) {
  return reserveAiScan({
    uid,
    requestId,
    tool: "fridge",
    toolLabel: "FridgeWise",
    usageKey: "fridge",
    limits: FRIDGEWISE_LIMITS,
    customLimitField: "customFridgeLimit",
    toolEnabledField: "fridgeEnabled",
    ...(db ? { db } : {})
  });
}


export function finalizeFridgeWiseScan(options) {
  return finalizeAiScan(options);
}


export function finalizeSuccessfulFridgeWiseScan({
  reservation,
  providerUsage = null,
  finalize = finalizeFridgeWiseScan,
  logger = console
}) {
  return finalizeSuccessfulAiScan({
    reservation,
    providerUsage,
    finalize,
    logger
  });
}


export function getFridgeWiseUsageResponse(
  reservation
) {
  return getAiUsageResponse(reservation);
}
