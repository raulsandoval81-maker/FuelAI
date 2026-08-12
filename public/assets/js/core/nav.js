(() => {
  "use strict";

  function getAccess() {
    return (
      window.FuelAIPlan?.getFuelAIAccess?.() ||
      {
        tools: {}
      }
    );
  }

  function buildNav() {
    if (
      document.querySelector(
        ".fuelai-topbar"
      )
    ) {
      return;
    }

    const access =
      getAccess();

    const topbar =
      document.createElement(
        "header"
      );

    topbar.className =
      "fuelai-topbar";

    topbar.innerHTML = `
      <div class="fuelai-topbar-brand">
        Fuel<span>AI</span>™
      </div>

      <button
        class="fuelai-menu-btn"
        type="button"
        aria-label="Open navigation"
      >
        ☰
      </button>
    `;


    const backdrop =
      document.createElement(
        "div"
      );

    backdrop.className =
      "fuelai-nav-backdrop";


    const drawer =
      document.createElement(
        "aside"
      );

    drawer.className =
      "fuelai-nav-drawer";

    drawer.setAttribute(
      "aria-hidden",
      "true"
    );


    const toolLinks = [];

    if (
      access.tools?.trackwise
    ) {
      toolLinks.push(`
        <a
          class="fuelai-nav-link"
          href="/tools/trackwise/"
        >
          📈 TrackWise
        </a>
      `);
    }

    if (
      access.tools?.mealwise
    ) {
      toolLinks.push(`
        <a
          class="fuelai-nav-link"
          href="/tools/mealwise/app.html"
        >
          🥗 MealWise
        </a>
      `);
    }

    if (
      access.tools?.fridgewise
    ) {
      toolLinks.push(`
        <a
          class="fuelai-nav-link"
          href="/tools/fridgewise/fridgewise.html"
        >
          🧊 FridgeWise
        </a>
      `);
    }

    if (
      access.tools?.trainingwise
    ) {
      toolLinks.push(`
        <a
          class="fuelai-nav-link"
          href="/tools/trainingwise/"
        >
          💪 TrainingWise
        </a>
      `);
    }

    if (
      access.tools?.combatAthlete
    ) {
      toolLinks.push(`
        <a
          class="fuelai-nav-link"
          href="/tools/combat-athlete/"
        >
          🥊 Combat Athlete
        </a>
      `);
    }


    drawer.innerHTML = `
      <div class="fuelai-nav-head">

        <h2 class="fuelai-nav-title">
          FuelAI
        </h2>

        <button
          class="fuelai-nav-close"
          type="button"
          aria-label="Close navigation"
        >
          ✕
        </button>

      </div>


      <div class="fuelai-nav-section">

        <p class="fuelai-nav-label">
          Home
        </p>

        <a
          class="fuelai-nav-link"
          href="/hub/"
        >
          🏠 Hub
        </a>

      </div>


      <div class="fuelai-nav-section">

        <p class="fuelai-nav-label">
          Tools
        </p>

        ${toolLinks.join("")}

      </div>


      <div class="fuelai-nav-section">

        <p class="fuelai-nav-label">
          Account
        </p>

        <a
          class="fuelai-nav-link"
          href="/account/profile.html"
        >
          👤 Profile
        </a>

        <a
          class="fuelai-nav-link"
          href="/account/setup.html"
        >
          ⚙️ Edit Setup
        </a>

        <button
          class="fuelai-nav-link danger"
          id="fuelaiLogoutBtn"
          type="button"
          style="width:100%;"
        >
          ↪ Sign Out
        </button>

      </div>
    `;


    document.body.prepend(
      topbar
    );

    document.body.appendChild(
      backdrop
    );

    document.body.appendChild(
      drawer
    );


    const openBtn =
      topbar.querySelector(
        ".fuelai-menu-btn"
      );

    const closeBtn =
      drawer.querySelector(
        ".fuelai-nav-close"
      );

    const logoutBtn =
      drawer.querySelector(
        "#fuelaiLogoutBtn"
      );


    function openNav() {
      drawer.classList.add(
        "open"
      );

      backdrop.classList.add(
        "open"
      );

      drawer.setAttribute(
        "aria-hidden",
        "false"
      );
    }


    function closeNav() {
      drawer.classList.remove(
        "open"
      );

      backdrop.classList.remove(
        "open"
      );

      drawer.setAttribute(
        "aria-hidden",
        "true"
      );
    }


    openBtn?.addEventListener(
      "click",
      openNav
    );

    closeBtn?.addEventListener(
      "click",
      closeNav
    );

    backdrop?.addEventListener(
      "click",
      closeNav
    );


    logoutBtn?.addEventListener(
      "click",
      () => {

        window.FuelAIAuth
          ?.softLogout?.();

        window.location.href =
          "/account/login.html";
      }
    );
  }


  function init() {
    if (
      !window.FuelAIAuth
        ?.isSoftLoggedIn?.()
    ) {
      return;
    }

    buildNav();
  }


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }

})();