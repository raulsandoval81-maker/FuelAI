const logsContainer =
  document.getElementById("logsContainer");

function renderLogs() {

  const dailyLogs =
    window.FuelAILog.getDailyLogs();

  const days =
    Object.values(dailyLogs)
      .sort((a, b) =>
        new Date(b.date) - new Date(a.date)
      );

  if (!days.length) {

    logsContainer.innerHTML = `
      <div class="range-card">
        No logs yet.
      </div>
    `;

    return;
  }

  logsContainer.innerHTML =
    days.map((day) => {

      return `
        <section class="range-card">

<p class="range-output">

  Plan:
  ${day.goal || "fuelwise"}

  <br><br>

  🔥 Calories:
  ${day.calories || 0}

  br><br>

🥩 Protein:
${day.protein || 0}g

<br><br>

🎯 Targets:
${day.caloriesTarget || "—"} cal /
${day.proteinTarget || "—"}g protein


  <br><br>

  💧 Water:
  ${day.water || 0} oz



  <br><br>

   🏋️ Workout:
  ${day.trainingToday ? "Logged" : "Not Logged"}

   <br><br>

  Weight:
  ${
    day.latestWeight
      ? `${day.latestWeight} lbs`
      : "—"
  }

  <br><br>

  🍽️ Meal Scans:
  ${day.scanCount || 0}

</p>
        </section>
      `;

    }).join("");
}

renderLogs();