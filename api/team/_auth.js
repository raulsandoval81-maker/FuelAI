import {
  getAdminAuth,
  getAdminDb
} from "../_lib/firebase-admin.js";


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


export function normalizeTeamId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


export async function requireSignedInUser(req) {
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


  return getAdminAuth()
    .verifyIdToken(token);
}


export async function requireTeamCoach(
  req,
  teamId
) {
  const user =
    await requireSignedInUser(req);


  const normalizedTeamId =
    normalizeTeamId(teamId);


  if (!normalizedTeamId) {
    const error =
      new Error(
        "teamId is required"
      );

    error.statusCode = 400;

    throw error;
  }


  const db =
    getAdminDb();


  const teamRef =
    db
      .collection("teams")
      .doc(normalizedTeamId);


  const teamSnapshot =
    await teamRef.get();


  if (!teamSnapshot.exists) {
    const error =
      new Error(
        "Team not found"
      );

    error.statusCode = 404;

    throw error;
  }


  const memberRef =
    teamRef
      .collection("members")
      .doc(user.uid);


  const memberSnapshot =
    await memberRef.get();


  if (!memberSnapshot.exists) {
    const error =
      new Error(
        "Team membership required"
      );

    error.statusCode = 403;

    throw error;
  }


  const membership =
    memberSnapshot.data();


  const allowedRole =
    membership.role === "coach" ||
    membership.role === "admin";


  if (
    membership.status !== "active" ||
    !allowedRole
  ) {
    const error =
      new Error(
        "Active coach access required"
      );

    error.statusCode = 403;

    throw error;
  }


  return {
    user,
    teamId:
      normalizedTeamId,
    teamRef,
    team:
      teamSnapshot.data(),
    membership
  };
}
