# WeightWise (Beta)

## Purpose

WeightWise is a lightweight weight-management tool designed for athletes, parents, and coaches.

This is NOT a calorie tracker.

This is NOT a social platform.

This is NOT a gamified XP system.

WeightWise answers one question:

> Am I on track to make weight?

---

## V1 Goals

Inputs:

- Current Weight
- Target Weight
- Weight Class
- Competition Date

Outputs:

- Weight Remaining
- Days Remaining
- Weekly Pace Required
- Status (Ahead / On Track / Behind)

---

## Build Order

### Phase 1 — Dashboard

`index.html`

Collect:

- Current Weight
- Target Weight
- Weight Class
- Competition Date

Display:

- Weight Remaining
- Days Remaining
- Weekly Pace Required
- Status

---

### Phase 2 — Core Logic

`weightwise.js`

Calculations:

- Weight Remaining
- Days Remaining
- Weekly Pace
- Status

---

### Phase 3 — Weight History

`weight-history.html`

Track:

- Date
- Weight

Future:

- Trend Graph
- Weekly Trend

---

### Phase 4 — Descent Planner

`descent-schedule.html`

Generate milestone weights between today and competition day.

Example:

Today      152.4

Week 1     150.8

Week 2     149.2

Week 3     147.6

Competition 145.0

---

### Phase 5 — Competition Mode

`competition-mode.html`

Display:

- Competition Name
- Competition Date
- Days Remaining
- Current Weight
- Target Weight

---

## Future Considerations

- Certified Weight
- Weekly Trend Graph
- Competition Schedule
- Descent Schedule Automation
- Parent View
- Coach View
- Competition Mode Enhancements

---

## Not Planned

WeightWise is intentionally separate from progression systems.

Not planned:

- XP
- Ranks
- Leaderboards
- Social Feed

Those belong elsewhere.

---

## Core Philosophy

Current Weight

↓

Target Weight

↓

Competition Date

↓

Make Weight

---

## Folder Structure

```text
weightwise/
├── README.md
├── index.html
├── weightwise.css
├── weightwise.js
├── competition-mode.html
├── descent-schedule.html
└── weight-history.html
```

---

## Status

Beta

Initial rollout will be a small athlete test group before wider release.