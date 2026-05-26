const recoveryInput =
  document.getElementById("recoveryInput");

const recoveryBtn =
  document.getElementById("recoveryBtn");

const recoveryOutput =
  document.getElementById("recoveryOutput");

const recoveryResponse =
  document.getElementById("recoveryResponse");

function getRecoveryGuidance(text) {
  const input =
    String(text || "").toLowerCase();

  if (
    input.includes("hydration") ||
    input.includes("dehydrated") ||
    input.includes("thirst") ||
    input.includes("sweat") ||
    input.includes("cramp")
  ) {
    return "Start with water. If you trained hard or sweated a lot, add electrolytes. Coconut water can help with fluid and potassium, but pair it with real food after practice.";
  }

  if (
    input.includes("sore") ||
    input.includes("soreness") ||
    input.includes("aches") ||
    input.includes("legs")
  ) {
    return "Soreness needs basics: protein, fluids, sleep, and light movement. Good move: water plus eggs, Greek yogurt, berries, or a simple protein meal.";
  }

  if (
    input.includes("low energy") ||
    input.includes("tired") ||
    input.includes("flat") ||
    input.includes("exhausted")
  ) {
    return "You probably need fuel, not punishment. Try water, electrolytes if needed, and simple carbs with protein. Example: banana + Greek yogurt, rice + eggs, or potatoes + chicken.";
  }

  if (
    input.includes("sleep") ||
    input.includes("slept") ||
    input.includes("poor sleep")
  ) {
    return "Poor sleep changes the day. Keep food simple, hydrate early, avoid overcorrecting, and aim for a calmer reset tonight.";
  }

  if (
    input.includes("practice") ||
    input.includes("workout") ||
    input.includes("training") ||
    input.includes("lift")
  ) {
    return "Post-training recovery: water first, then protein plus carbs. Simple plate: chicken or eggs, rice or potatoes, fruit, and electrolytes if you sweated hard.";
  }

  if (
    input.includes("cut") ||
    input.includes("weight") ||
    input.includes("weigh")
  ) {
    return "Do not panic cut. Stabilize first: water, sodium balance, simple protein, and controlled carbs. Big swings usually create worse decisions.";
  }

  return "Start simple: water first, then protein, then carbs if you trained hard. Pick one grounded next move.";
}

recoveryBtn?.addEventListener("click", () => {
  const text =
    recoveryInput?.value.trim() || "";

  recoveryOutput?.classList.remove("hidden");

  recoveryResponse.textContent =
    getRecoveryGuidance(text);
});