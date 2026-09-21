const status = document.getElementById("checkout-status");
const buttons = [...document.querySelectorAll("[data-checkout-plan]")];

async function checkout(plan, button) {
  const user = window.FuelAIFirebase?.auth?.currentUser;
  if (!user) {
    status.textContent = "Sign in before continuing to checkout.";
    return;
  }
  button.disabled = true;
  status.textContent = "Preparing secure checkout…";
  try {
    const token = await user.getIdToken();
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });
    const result = await response.json();
    if (!response.ok || !result.checkoutUrl) {
      throw new Error(result.error || "Checkout is unavailable.");
    }
    window.location.assign(result.checkoutUrl);
  } catch (error) {
    status.textContent = error.message || "Checkout is unavailable.";
    button.disabled = false;
  }
}

for (const button of buttons) {
  button.addEventListener("click", () =>
    checkout(button.dataset.checkoutPlan, button)
  );
}
