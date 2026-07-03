# Bioinformatics Workshop Designer (GitHub Pages App)

A static single-page wizard for designing high-quality, inclusive bioinformatics workshop training plans.

## What it enforces

- Constructive alignment: every measurable objective must map to activity + assessment evidence.
- UDL minimums before export:
  - >=1 engagement choice
  - >=2 representations
  - >=2 expression options
- Scope and feasibility checks:
  - 60–70% of time in must-know + guided practice
  - max 7 new core concepts per 60 minutes
  - worked example before independent practice
- Hands-on activity template completeness.
- Jargon definition on first use.

## Features

- 9-step wizard
- Actionable validation errors + warnings
- Feasibility verdict: Feasible / At Risk / Not Feasible
- Scope surgery suggestions: Keep now / Defer / Remove
- Local draft persistence with `localStorage`
- Live final-plan preview
- Export to `plan.md` and `plan.json`
- Prefilled sample 2-hour bioinformatics workshop

## Project structure

- `src/App.jsx` — wizard UI and state
- `src/lib/validation.js` — validation engine
- `src/lib/exporters.js` — markdown/json export
- `src/data/samplePlan.js` — sample prefilled workshop
- `src/lib/validation.test.js` — unit tests for validation rules

## Setup

```bash
cd workshop-planner
npm install
npm run dev
```

## Tests

```bash
npm test
```

## Build

```bash
npm run build
```

## GitHub Pages deploy

This app is static and uses relative asset paths (`base: './'` in `vite.config.js`), so the build output can be hosted on GitHub Pages.

1. Build with `npm run build`
2. Publish the `workshop-planner/dist/` directory using your preferred Pages workflow (artifact deploy or branch publish).

## Accessibility and responsive UI

- Semantic structure (`header`, `nav`, `main`, `section`, `fieldset`)
- Keyboard-navigable controls
- Visible focus states
- Desktop/tablet responsive step layout
