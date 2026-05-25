function getSoftUser() {
  return JSON.parse(
    localStorage.getItem("fuelai-user") || "{}"
  );
}

function isSoftLoggedIn() {
  const user = getSoftUser();

  return Boolean(
    user.email &&
    user.active
  );
}

function softLogin(email) {
  localStorage.setItem(
    "fuelai-user",
    JSON.stringify({
      email,
      active: true,
      createdAt: new Date().toISOString()
    })
  );
}

function softLogout() {
  localStorage.removeItem("fuelai-user");
}

function requireSoftLogin() {
  if (!isSoftLoggedIn()) {
    window.location.href = "/public/account/login.html";
  }
}

window.FuelAIAuth = {
  getSoftUser,
  isSoftLoggedIn,
  softLogin,
  softLogout,
  requireSoftLogin
};