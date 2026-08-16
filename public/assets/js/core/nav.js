(() => {
  "use strict";


  function getAccess() {
    return (
      window.FuelAIPlan
        ?.getFuelAIAccess?.() ||
      {
        tools: {}
      }
    );
  }


  function getSetup() {
    try {
      return JSON.parse(
        localStorage.getItem(
          "fuelai-setup"
        ) || "{}"
      );
    } catch {
      return {};
    }
  }


  function getProfile() {
    const setup =
      getSetup();

    return (
      setup.lifestyleType ||
      "general-health"
    );
  }


  function getCurrentPath() {
    return (
      window.location.pathname ||
      "/"
    );
  }


  function isCurrentPath(
    href
  ) {
    const current =
      getCurrentPath();

    if (
      href === "/hub/"
    ) {
      return (
        current === "/hub/" ||
        current === "/hub/index.html"
      );
    }

    if (
      href.endsWith("/")
    ) {
      return current.startsWith(
        href
      );
    }

    return (
      current === href
    );
  }


  function navLink(
    href,
    label
  ) {
    const current =
      isCurrentPath(
        href
      );

    return `
      <a
        class="fuelai-nav-link${
          current
            ? " current"
            : ""
        }"
        href="${href}"
        ${
          current
            ? 'aria-current="page"'
            : ""
        }
      >
        ${label}
      </a>
    `;
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

    const profile =
      getProfile();


    const isFitnessProfile =
      profile ===
        "fitness-enthusiast" ||
      profile ===
        "combat-athlete";


    const isCombatProfile =
      profile ===
      "combat-athlete";


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
        aria-expanded="false"
        aria-controls="fuelaiNavDrawer"
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


    drawer.id =
      "fuelaiNavDrawer";


    drawer.className =
      "fuelai-nav-drawer";


    drawer.setAttribute(
      "aria-hidden",
      "true"
    );


    const toolLinks =
      [];


    /*
     * CORE TOOLS
     */

    if (
      access.tools
        ?.trackwise
    ) {
      toolLinks.push(
navLink(
  "/tools/trackwise/dashboard.html",
  "📈 TrackWise"
)
    );
    }


    if (
      access.tools
        ?.mealwise
    ) {
      toolLinks.push(
        navLink(
          "/tools/mealwise/app.html",
          "🥗 MealWise"
        )
      );
    }


    if (
      access.tools
        ?.fridgewise
    ) {
      toolLinks.push(
        navLink(
          "/tools/fridgewise/fridgewise.html",
          "🧊 FridgeWise"
        )
      );
    }


    /*
     * GUIDANCE
     */

    toolLinks.push(
      navLink(
        "/wise/wise.html",
        "🧠 Coach Wise"
      )
    );


    /*
     * FITNESS + COMBAT
     */

    if (
      isFitnessProfile &&
      access.tools
        ?.trainingwise
    ) {
      toolLinks.push(
        navLink(
          "/tools/trainingwise/",
          "💪 TrainingWise"
        )
      );
    }


    /*
     * COMBAT ATHLETE
     */

    if (
      isCombatProfile &&
      access.tools
        ?.combatAthlete
    ) {
      toolLinks.push(
        navLink(
          "/tools/combat-athlete/",
          "🥊 Combat Athlete"
        )
      );
    }



    const teamMemberships =
      window.FuelAIIdentity
        ?.getFuelAITeamMemberships?.() ||
      [];


    const activeTeam =
      teamMemberships.find(
        membership =>
          membership.status ===
          "active"
      );


    const canManageTeam =
      activeTeam &&
      (
        activeTeam.role ===
          "coach" ||
        activeTeam.role ===
          "admin"
      );


    const teamSection =
      activeTeam
        ? `
      <div class="fuelai-nav-section">

        <p class="fuelai-nav-label">
          Team
        </p>

        ${navLink(
          "/team/",
          canManageTeam
            ? "👥 Team Logistics"
            : "👥 My Team"
        )}

      </div>
    `
        : "";


    const accountLinks =
      [];


    accountLinks.push(
      navLink(
        "/account/profile.html",
        "👤 Profile"
      )
    );


    /*
     * Don't show Edit Setup while
     * already on the Setup page.
     */

    if (
      !isCurrentPath(
        "/account/setup.html"
      )
    ) {
      accountLinks.push(
        navLink(
          "/account/setup.html",
          "⚙️ Edit Setup"
        )
      );
    }


    accountLinks.push(
      navLink(
        "/account/logs.html",
        "📋 FuelAI Log"
      )
    );


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

        ${navLink(
          "/hub/",
          "🏠 Hub"
        )}

      </div>


      <div class="fuelai-nav-section">

        <p class="fuelai-nav-label">
          Tools
        </p>

        ${toolLinks.join("")}

      </div>


      ${teamSection}


      <div class="fuelai-nav-section">

        <p class="fuelai-nav-label">
          Account
        </p>

        ${accountLinks.join("")}

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


      openBtn?.setAttribute(
        "aria-expanded",
        "true"
      );


      document.body
        .classList
        .add(
          "fuelai-nav-open"
        );


      closeBtn?.focus();
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


      openBtn?.setAttribute(
        "aria-expanded",
        "false"
      );


      document.body
        .classList
        .remove(
          "fuelai-nav-open"
        );
    }


    openBtn
      ?.addEventListener(
        "click",
        openNav
      );


    closeBtn
      ?.addEventListener(
        "click",
        closeNav
      );


    backdrop
      ?.addEventListener(
        "click",
        closeNav
      );


    document.addEventListener(
      "keydown",
      (event) => {
        if (
          event.key ===
          "Escape"
        ) {
          closeNav();
        }
      }
    );


    drawer
      .querySelectorAll(
        "a.fuelai-nav-link"
      )
      .forEach(
        (link) => {
          link.addEventListener(
            "click",
            closeNav
          );
        }
      );


    logoutBtn
      ?.addEventListener(
        "click",
        async () => {

          await window.FuelAIAuth
            ?.softLogout?.();


          window.location.href =
            "/account/login.html?logout=1";

        }
      );
  }


  function refreshNav() {

    document
      .querySelector(
        ".fuelai-topbar"
      )
      ?.remove();


    document
      .querySelector(
        ".fuelai-nav-backdrop"
      )
      ?.remove();


    document
      .querySelector(
        ".fuelai-nav-drawer"
      )
      ?.remove();


    buildNav();

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


  window.addEventListener(
    "fuelai:team-memberships-ready",
    refreshNav
  );


  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      {
        once: true
      }
    );
  } else {
    init();
  }

})();