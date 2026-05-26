const recoveryInput =
  document.getElementById("recoveryInput");

const recoveryBtn =
  document.getElementById("recoveryBtn");

const recoveryOutput =
  document.getElementById("recoveryOutput");

const recoveryResponse =
  document.getElementById("recoveryResponse");

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
    return {
      pattern: BREATHING_PATTERNS.steady,
      message:
        "Start with water. If you trained hard or sweated a lot, add electrolytes. Coconut water can help with fluid and potassium, but pair it with real food after practice.",
      next:
        "Water first. Then simple food."
    };
  }

  if (
    input.includes("sore") ||
    input.includes("soreness") ||
    input.includes("aches") ||
    input.includes("legs")
  ) {
    return {
      pattern: BREATHING_PATTERNS.deep,
      message:
        "Soreness needs basics: protein, fluids, sleep, and light movement.",
      next:
        "Water plus eggs, Greek yogurt, berries, or a simple protein meal."
    };
  }

  if (
    input.includes("low energy") ||
    input.includes("tired") ||
    input.includes("flat") ||
    input.includes("exhausted")
  ) {
    return {
      pattern: BREATHING_PATTERNS.steady,
      message:
        "You probably need fuel, not punishment. Try water, electrolytes if needed, and simple carbs with protein.",
      next:
        "Banana + Greek yogurt, rice + eggs, or potatoes + chicken."
    };
  }

  if (
    input.includes("sleep") ||
    input.includes("slept") ||
    input.includes("poor sleep")
  ) {
    return {
      pattern: BREATHING_PATTERNS.balance,
      message:
        "Poor sleep changes the day. Keep food simple, hydrate early, and avoid overcorrecting.",
      next:
        "Protect tonight. No perfect plan needed."
    };
  }

  if (
    input.includes("practice") ||
    input.includes("workout") ||
    input.includes("training") ||
    input.includes("lift")
  ) {
    return {
      pattern: BREATHING_PATTERNS.quick,
      message:
        "Post-training recovery: water first, then protein plus carbs.",
      next:
        "Chicken or eggs, rice or potatoes, fruit, and electrolytes if you sweated hard."
    };
  }

  if (
    input.includes("cut") ||
    input.includes("weight") ||
    input.includes("weigh")
  ) {
    return {
      pattern: BREATHING_PATTERNS.deep,
      message:
        "Do not panic cut. Stabilize first with water, sodium balance, simple protein, and controlled carbs.",
      next:
        "No big swings. One controlled meal."
    };
  }

  if (
    input.includes("stress") ||
    input.includes("overwhelmed") ||
    input.includes("panic") ||
    input.includes("anxious")
  ) {
    return {
      pattern: BREATHING_PATTERNS.deep,
      message:
        "Your brain is stacking everything equally. It is not all equal.",
      next:
        "Pick the smallest useful move."
    };
  }

  return {
    pattern: BREATHING_PATTERNS.steady,
    message:
      "Start simple: water first, then protein, then carbs if you trained hard.",
    next:
      "Pick one grounded next move."
  };
}

function renderRecoveryResponse(result) {
  recoveryResponse.innerHTML = `
    <div class="meal-plan">

      <p class="meal-label">
        ${result.pattern.label}
      </p>

      <ul class="meal-list">
        ${result.pattern.steps.map(step => `
          <li>${step}</li>
        `).join("")}
      </ul>

      <div class="meal-divider"></div>

      <p class="meal-label">
        Recovery Read
      </p>

      <p class="meal-line">
        ${result.message}
      </p>

      <div class="meal-divider"></div>

      <p class="meal-label">
        Next Move
      </p>

      <p class="meal-line">
        ${result.next}
      </p>

    </div>
  `;
}

recoveryBtn?.addEventListener("click", () => {
  const text =
    recoveryInput?.value.trim() || "";

  const result =
    getRecoveryGuidance(text);

  recoveryOutput?.classList.remove("hidden");

  renderRecoveryResponse(result);
});