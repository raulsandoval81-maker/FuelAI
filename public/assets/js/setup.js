const saveSetupBtn = document.getElementById("saveSetupBtn");

if (saveSetupBtn) {
  saveSetupBtn.addEventListener("click", () => {
    const setup = {
      height: document.getElementById("heightInput").value,
      weight: document.getElementById("weightInput").value,
      targetWeight: document.getElementById("targetWeightInput").value,
      ageRange: document.getElementById("ageRange").value,
      gender: document.getElementById("genderType").value,
      goal: document.getElementById("goalSelect").value
    };

    localStorage.setItem("fuelai-setup", JSON.stringify(setup));

    window.location.href = "/app.html";
  });
}