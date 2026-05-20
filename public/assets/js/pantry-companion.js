const saveBtn = document.getElementById("savePantryBtn");
const saveMessage = document.getElementById("saveMessage");

saveBtn.addEventListener("click", () => {

  const checked = [
    ...document.querySelectorAll("input[type='checkbox']:checked")
  ].map(el => el.value);

  localStorage.setItem(
    "fuelwise_pantry_basics",
    JSON.stringify(checked)
  );

  saveMessage.classList.remove("hidden");

  setTimeout(() => {
    saveMessage.classList.add("hidden");
  }, 2000);

});