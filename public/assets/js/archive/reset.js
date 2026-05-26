const resetBtn =
  document.getElementById("resetBtn");

const resetOutput =
  document.getElementById("resetOutput");

const resetResponse =
  document.getElementById("resetResponse");

const loadingCard =
  document.getElementById("loadingCard");

const resetInput =
  document.getElementById("resetInput");

const resetType =
  document.getElementById("resetType");

const BREATHING_PATTERNS = {
  quick: {
    label: "Quick Reset",
    steps: [
      "Inhale 3 seconds.",
      "Exhale 3 seconds.",
      "Repeat 3 times."
    ]
  },

  steady: {
    label: "Steady Reset",
    steps: [
      "Inhale 5 seconds.",
      "Exhale 5 seconds.",
      "Repeat 3 times."
    ]
  },

  deep: {
    label: "Deep Reset",
    steps: [
      "Inhale 4 seconds.",
      "Hold 2 seconds.",
      "Exhale 6 seconds.",
      "Repeat 3 times."
    ]
  },

  balance: {
    label: "Balance Reset",
    steps: [
      "Inhale 5 seconds.",
      "Hold 5 seconds.",
      "Exhale 5 seconds.",
      "Repeat 3 times."
    ]
  }
};

function pickBreathingPattern(type, lower) {
  if (
    type === "food" ||
    lower.includes("food") ||
    lower.includes("diet") ||
    lower.includes("weight")
  ) {
    return BREATHING_PATTERNS.quick;
  }

  if (
    type === "sleep" ||
    lower.includes("sleep") ||
    lower.includes("tired")
  ) {
    return BREATHING_PATTERNS.steady;
  }

  if (
    type === "stress" ||
    lower.includes("stress") ||
    lower.includes("overwhelmed")
  ) {
    return BREATHING_PATTERNS.deep;
  }

  if (
    lower.includes("panic") ||
    lower.includes("anxious") ||
    lower.includes("anxiety")
  ) {
    return BREATHING_PATTERNS.balance;
  }

  return BREATHING_PATTERNS.steady;
}

function pickResetMessage(type, lower) {
  if (
    type === "food" ||
    lower.includes("food") ||
    lower.includes("diet") ||
    lower.includes("weight")
  ) {
    return "Do not fix the whole week. Fix the next meal.";
  }

  if (
    type === "money" ||
    lower.includes("money") ||
    lower.includes("bills")
  ) {
    return "Stabilize first. One bill. One call. One move.";
  }

  if (
    type === "stress" ||
    lower.includes("stress") ||
    lower.includes("overwhelmed")
  ) {
    return "Your brain is stacking everything equally. Pick the smallest useful move.";
  }

  if (
    type === "sleep" ||
    lower.includes("sleep")
  ) {
    return "Tonight matters more than tomorrow’s perfect plan.";
  }

  return "Pause the spiral. Pick one grounded next step and move.";
}

function renderResetResponse(message, pattern) {
  resetResponse.innerHTML = `
    <div class="meal-plan">

      <p class="meal-label">
        ${pattern.label}
      </p>

      <ul class="meal-list">
        ${pattern.steps.map(step => `
          <li>${step}</li>
        `).join("")}
      </ul>

      <div class="meal-divider"></div>

      <p class="meal-label">
        Next Move
      </p>

      <p class="meal-line">
        ${message}
      </p>

    </div>
  `;
}

resetBtn?.addEventListener("click", async () => {
  const value =
    resetInput?.value.trim() || "";

  const type =
    resetType?.value || "general";

  if (!value && type === "general") {
    return;
  }

  loadingCard?.classList.remove("hidden");
  resetOutput?.classList.add("hidden");

  resetBtn.disabled = true;

  await new Promise(resolve =>
    setTimeout(resolve, 700)
  );

  const lower =
    value.toLowerCase();

  const pattern =
    pickBreathingPattern(type, lower);

  const message =
    pickResetMessage(type, lower);

  renderResetResponse(
    message,
    pattern
  );

  loadingCard?.classList.add("hidden");
  resetOutput?.classList.remove("hidden");

  resetBtn.disabled = false;
});