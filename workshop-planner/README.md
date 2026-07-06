# Bioinformatics Training Feedback Coach (GitHub Pages App)

Interactive web app for expert bioinformaticians who need **feedback-only coaching** while designing short, online, coding-heavy life sciences training.

## What this app does

- Embeds and exports the strict feedback-coach prompt.
- Collects draft outcomes/objectives/exercises.
- Guides workflow triage:
  - Core live / Demo-only / Optional / Post-course
  - justification checks for every Core live step
  - explicit cut-point prompts
- Enforces UDL + inclusion checks per module/exercise:
  - engagement routes
  - multiple representations
  - run/explain/interpret expression modes
  - accessibility + low-bandwidth fallback
- Generates structured feedback with mandatory sections:
  - A) What's working
  - B) Top risks (prioritized)
  - C) Questions next (max 5)
  - D) Suggested revisions as instructions
  - E) 6-hour feasibility verdict
- Enforces anti-outsourcing behavior when users request full deliverables.

## Run locally

```bash
cd workshop-planner
npm install
npm run dev
```

## Validate

```bash
npm run lint
npm test
npm run build
```

## Files of interest

- `src/App.jsx` — feedback coach UI
- `src/lib/coach.js` — deterministic coaching rules and prompt text
- `src/lib/coach.test.js` — unit tests for structure and boundary enforcement

## GitHub Pages

This project is static and uses `base: './'` in `vite.config.js`, so the generated `dist/` artifact is GitHub Pages compatible.
