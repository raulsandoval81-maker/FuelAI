(function (root, factory) {
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (root) root.TrainingWiseCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SOURCE = [
    ["air-squat", "Air Squats", "lower-body", "beginner"],
    ["push-up", "Push-Ups", "upper-body", "beginner"],
    ["reverse-lunge", "Reverse Lunges", "lower-body", "beginner"],
    ["mountain-climber", "Mountain Climbers", "conditioning", "intermediate"],
    ["plank", "Plank", "core", "beginner"],
    ["glute-bridge", "Glute Bridge", "lower-body", "beginner"],
    ["jumping-jack", "Jumping Jacks", "conditioning", "beginner"],
    ["high-knees", "High Knees", "conditioning", "beginner"],
    ["burpee", "Burpees", "conditioning", "intermediate"],
    ["skater", "Skaters", "conditioning", "intermediate"],
    ["bear-crawl", "Bear Crawl", "conditioning", "intermediate"],
    ["inchworm", "Inchworm", "full-body", "beginner"],
    ["squat-jump", "Squat Jumps", "lower-body", "intermediate"],
    ["lateral-lunge", "Lateral Lunges", "lower-body", "beginner"],
    ["forward-lunge", "Forward Lunges", "lower-body", "beginner"],
    ["split-squat", "Split Squat", "lower-body", "intermediate"],
    ["calf-raise", "Calf Raises", "lower-body", "beginner"],
    ["wall-sit", "Wall Sit", "lower-body", "beginner"],
    ["dead-bug", "Dead Bug", "core", "beginner"],
    ["bird-dog", "Bird Dog", "core", "beginner"],
    ["side-plank", "Side Plank", "core", "intermediate"],
    ["bicycle-crunch", "Bicycle Crunch", "core", "beginner"],
    ["hollow-hold", "Hollow Hold", "core", "intermediate"],
    ["superman", "Superman", "posterior-chain", "beginner"],
    ["pike-push-up", "Pike Push-Up", "upper-body", "intermediate"],
    ["incline-push-up", "Incline Push-Up", "upper-body", "beginner"],
    ["scapular-push-up", "Scapular Push-Up", "upper-body", "beginner"],
    ["bench-dip", "Bench Dips", "upper-body", "intermediate", ["bench"]],
    ["dumbbell-row", "Dumbbell Row", "upper-body", "beginner", ["dumbbells"]],
    ["goblet-squat", "Goblet Squat", "lower-body", "beginner", ["dumbbell"]],
    ["romanian-deadlift", "Romanian Deadlift", "posterior-chain", "intermediate", ["dumbbells"]],
    ["dumbbell-floor-press", "Dumbbell Floor Press", "upper-body", "beginner", ["dumbbells"]],
    ["dumbbell-overhead-press", "Dumbbell Overhead Press", "upper-body", "intermediate", ["dumbbells"]],
    ["farmer-carry", "Farmer Carry", "full-body", "beginner", ["dumbbells"]],
    ["kettlebell-swing", "Kettlebell Swing", "conditioning", "intermediate", ["kettlebell"]],
    ["step-up", "Step-Ups", "lower-body", "beginner", ["box"]],
    ["box-jump", "Box Jumps", "lower-body", "advanced", ["box"]],
    ["jump-rope", "Jump Rope", "conditioning", "beginner", ["jump-rope"]],
    ["band-pull-apart", "Band Pull-Apart", "upper-body", "beginner", ["resistance-band"]],
    ["band-row", "Band Row", "upper-body", "beginner", ["resistance-band"]],
    ["pull-up", "Pull-Ups", "upper-body", "advanced", ["pull-up-bar"]],
    ["assisted-pull-up", "Assisted Pull-Ups", "upper-body", "beginner", ["pull-up-bar", "resistance-band"]],
    ["dumbbell-curl", "Dumbbell Curls", "upper-body", "beginner", ["dumbbells"]],
    ["triceps-extension", "Triceps Extension", "upper-body", "beginner", ["dumbbell"]],
    ["lateral-raise", "Lateral Raise", "upper-body", "beginner", ["dumbbells"]],
    ["front-rack-squat", "Front Rack Squat", "lower-body", "intermediate", ["dumbbells"]],
    ["single-leg-rdl", "Single-Leg Romanian Deadlift", "posterior-chain", "intermediate", ["dumbbell"]],
    ["hip-thrust", "Hip Thrust", "lower-body", "intermediate", ["bench"]],
    ["lateral-step-up", "Lateral Step-Up", "lower-body", "intermediate", ["box"]],
    ["walking-lunge", "Walking Lunges", "lower-body", "intermediate"],
    ["plank-shoulder-tap", "Plank Shoulder Taps", "core", "beginner"],
    ["standing-knee-drive", "Standing Knee Drives", "conditioning", "beginner"],
    ["fast-feet", "Fast Feet", "conditioning", "beginner"],
    ["lateral-shuffle", "Lateral Shuffle", "conditioning", "beginner"],
    ["seal-jack", "Seal Jacks", "conditioning", "beginner"],
    ["power-skip", "Power Skips", "conditioning", "intermediate"],
    ["crawl-to-plank", "Crawl to Plank", "full-body", "intermediate"],
    ["half-kneeling-press", "Half-Kneeling Press", "upper-body", "intermediate", ["dumbbell"]],
    ["suitcase-carry", "Suitcase Carry", "core", "beginner", ["dumbbell"]],
    ["turkish-get-up", "Turkish Get-Up", "full-body", "advanced", ["kettlebell"]],
    ["easy-walk-march", "Easy Walk / March", "recovery", "beginner"],
    ["arm-circle", "Arm Circles", "recovery", "beginner"],
    ["hip-circle", "Hip Circles", "recovery", "beginner"],
    ["cat-cow", "Cat-Cow", "recovery", "beginner"],
    ["easy-breathing", "Easy Breathing", "recovery", "beginner"],
    ["shoulder-roll", "Shoulder Rolls", "recovery", "beginner"],
    ["wall-slide", "Wall Slides", "recovery", "beginner", ["wall"]],
    ["thoracic-rotation", "Thoracic Rotation", "recovery", "beginner"],
    ["squat-to-stand", "Squat-to-Stand", "recovery", "beginner"],
    ["reverse-lunge-reach", "Reverse Lunge Reach", "recovery", "beginner"],
    ["ankle-rock", "Ankle Rocks", "recovery", "beginner"],
    ["adductor-rock-back", "Adductor Rock Back", "recovery", "beginner"],
    ["pelvic-tilt", "Pelvic Tilt", "recovery", "beginner"],
    ["hip-flexor-mobility", "Hip Flexor Mobility", "recovery", "beginner"],
    ["calf-ankle-mobility", "Calf / Ankle Mobility", "recovery", "beginner"],
    ["worlds-greatest-stretch", "World's Greatest Stretch", "recovery", "intermediate"],
    ["childs-pose", "Child's Pose", "recovery", "beginner"],
    ["figure-four-stretch", "Figure-Four Stretch", "recovery", "beginner"],
    ["hamstring-sweep", "Hamstring Sweep", "recovery", "beginner"],
    ["open-book", "Open Book Rotation", "recovery", "beginner"]
  ];

  const movementLibrary = SOURCE.map(([id, name, category, difficulty, equipment = []]) => ({
    id, name, category, difficulty, equipment,
    primaryMuscles: [], secondaryMuscles: [],
    standardVersion: name, modifiedVersion: null,
    standardDemoAsset: null, modifiedDemoAsset: null
  }));
  const movementByName = new Map(movementLibrary.map((item) => [item.name.toLowerCase(), item]));
  const aliases = new Map([
    ["bodyweight squat", "air-squat"], ["bodyweight squats", "air-squat"],
    ["alternating lunges", "reverse-lunge"], ["wall push-ups", "incline-push-up"],
    ["close-grip push-ups", "push-up"], ["forearm plank", "plank"],
    ["single-leg glute bridge", "glute-bridge"], ["bodyweight squat flow", "air-squat"],
    ["shoulder mobility", "shoulder-roll"], ["chest / shoulder mobility", "wall-slide"],
    ["upper back rotation", "thoracic-rotation"], ["calf mobility", "calf-ankle-mobility"],
    ["easy arm swing", "arm-circle"]
  ]);
  const movementById = new Map(movementLibrary.map((item) => [item.id, item]));

  function normalizeMovement(value) {
    if (typeof value === "string") {
      const name = value.trim();
      const baseName = name.replace(/\s+—\s+.*$/, "");
      const aliasId = aliases.get(baseName.toLowerCase());
      const known = movementByName.get(baseName.toLowerCase()) || movementById.get(aliasId);
      return { ...(known ? { ...known, name } : {
        id: null, name, category: null, difficulty: null, equipment: [],
        primaryMuscles: [], secondaryMuscles: [], standardVersion: name,
        modifiedVersion: null, standardDemoAsset: null, modifiedDemoAsset: null
      }) };
    }
    if (!value || typeof value !== "object") return normalizeMovement("");
    const fallback = normalizeMovement(value.name || "");
    return { ...fallback, ...value, name: String(value.name || fallback.name).trim() };
  }

  function getMovementName(value) {
    return normalizeMovement(value).name;
  }

  function getMovementCoachModel(value, phase) {
    const movement = normalizeMovement(value);
    const asset = (key) => {
      const path = typeof movement[key] === "string" ? movement[key].trim() : "";
      return path.startsWith("/assets/images/trainingwise/") ? path : null;
    };
    const standard = asset("standardDemoAsset");
    const modified = asset("modifiedDemoAsset");
    if (!movement.name || (!standard && !modified)) return null;
    return {
      phase: phase === "next" ? "next" : "current",
      name: movement.name,
      primaryMuscles: Array.isArray(movement.primaryMuscles) ? movement.primaryMuscles : [],
      standard: standard ? { label: "Standard", src: standard, alt: `${movement.name} standard movement demonstration` } : null,
      modified: modified ? { label: "Modified", src: modified, alt: `${movement.name} modified movement demonstration` } : null
    };
  }

  function scaleMovementDurations(moves, totalSeconds) {
    const list = Array.isArray(moves) ? moves.map((move) => ({ ...move })) : [];
    const target = Math.max(0, Math.round(Number(totalSeconds) || 0));
    const sourceTotal = list.reduce((sum, move) => sum + Math.max(0, Number(move.seconds) || 0), 0);
    if (!list.length || !target || !sourceTotal) return list;
    let assigned = 0;
    return list.map((move, index) => {
      const seconds = index === list.length - 1
        ? target - assigned
        : Math.max(1, Math.round((Number(move.seconds) || 0) * target / sourceTotal));
      assigned += seconds;
      return { ...move, seconds };
    });
  }

  function shouldRunOpeningCountdown(state) {
    return Boolean(state && !state.hasStarted);
  }

  function createCountdownLifecycle(clock = globalThis) {
    const timeouts = new Set();
    const intervals = new Set();
    let active = false;
    return {
      begin() { if (active) return false; active = true; return true; },
      timeout(callback, delay) {
        const id = clock.setTimeout(() => { timeouts.delete(id); callback(); }, delay);
        timeouts.add(id); return id;
      },
      interval(callback, delay) { const id = clock.setInterval(callback, delay); intervals.add(id); return id; },
      clearInterval(id) { clock.clearInterval(id); intervals.delete(id); },
      finish() { active = false; },
      cancel() {
        timeouts.forEach((id) => clock.clearTimeout(id));
        intervals.forEach((id) => clock.clearInterval(id));
        timeouts.clear(); intervals.clear(); active = false;
      },
      isActive() { return active; }
    };
  }

  return {
    movementLibrary, normalizeMovement, getMovementName, getMovementCoachModel,
    scaleMovementDurations, shouldRunOpeningCountdown, createCountdownLifecycle
  };
});
