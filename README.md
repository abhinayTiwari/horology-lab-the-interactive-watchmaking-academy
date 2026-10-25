# Horology Lab

A static, account-free interactive watchmaking academy built with React, TypeScript, Vite, React Three Fiber, Drei, Zustand, Radix Tabs, Motion, React Router and Tailwind CSS 4. Original procedural 3D geometry is rendered in the browser; no external model download, paid API or key is required.

## Run locally

Use **Node.js 22.12 or newer** (Node 22 LTS recommended) and npm.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/`. A browser with WebGL2 and hardware acceleration is recommended. The component list, lessons and experiments are available even when a 3D context cannot initialize.

```sh
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
npm run preview
```

`npm run check` runs lint, unit/component tests and the production build. Playwright starts its own local server on port 4173. Screenshots are written to `artifacts/`; failures retain traces and screenshots. `npm run preview` serves the production output. Do not open `dist/index.html` with a file URL.

## What works

- Three generic movement assemblies: hand-wound, automatic and analog quartz, with independently selectable parts and grouped subassemblies.
- Continuous, reversible explosion of actual mesh transforms. Mouse/touch orbit, zoom and pan; top/side views; list selection; hide, isolate, X-ray, labels, main-plate cutaway and overlays.
- Deterministic domain simulation with play/pause, explicit single-event stepping, speed controls, reset, winding, stored energy and a bidirectional rotor slider that rotates the model and winds the spring.
- Twelve complete lessons across six levels. Every lesson includes an objective, explanation, reasoning, real example, misconception, experiment, knowledge check and summary.
- Wrong-answer explanations, retries and local progress. Beginner/Engineering explanations; persistent theme, contrast, motion and performance settings.
- A six-part prepared train workbench with preparation, tools, blockers, tray, undo/redo and dependency-checked reassembly.
- Gear-ratio, quartz-divider and accuracy experiments; frequency-to-beat-rate calculator and direct links to interactive escapement/rotor demonstrations.
- Responsive navigation and alternative keyboard/list controls for every core 3D interaction.

## GitHub Pages

This checkout contains deployment configuration but is **not proof of publication**. No authorized GitHub repository or GitHub CLI connection was available during initial implementation. Create an empty repository in your account, then run from this directory (replace `YOUR_ACCOUNT`):

```sh
git init
git branch -M main
git add .
git commit -m "Build Horology Lab interactive academy"
git remote add origin https://github.com/YOUR_ACCOUNT/horology-lab.git
git push -u origin main
```

In **Repository → Settings → Pages → Build and deployment**, select **GitHub Actions**. The workflow validates lint, unit tests and browser tests, builds and publishes on pushes to `main`. Pull requests validate without publishing. If Pages was enabled after the first run, rerun the workflow from Actions. The deployment job reports the actual URL, normally `https://YOUR_ACCOUNT.github.io/horology-lab/`.

### Base paths and routes

Vite defaults to relative assets (`./`). The workflow sets `VITE_BASE_PATH` to `/<repository-name>/`. HashRouter keeps lesson/workbench URLs working on static hosting without server rewrite rules, for example `/#/academy/gears`.

For an account-root repository (`YOUR_ACCOUNT.github.io`) or custom domain, change the workflow's `VITE_BASE_PATH` to `/`. For a custom prefix, set it explicitly at build time. PowerShell example:

```powershell
$env:VITE_BASE_PATH = '/horology-lab/'
npm run build
```

Secondary deployment: import the repository into Vercel, choose Vite, build with `npm run build`, output directory `dist`, and keep `VITE_BASE_PATH` unset or `/`. No server functions or environment secrets are needed.

## Architecture

```text
src/app/                 App shell, hash routing, lazy feature loading
src/components/          Shared controls and throttled readouts
src/content/             Typed movement definitions and complete lessons
src/domain/types.ts      Movement, component, gear and lesson contracts
src/domain/kinematics.ts  Pure simulation, ratios, division and transforms
src/domain/assembly.ts   Prepared train dependency graph
src/state/               Zustand UI, simulation and persisted preferences
src/features/explorer/   Procedural geometry, scene, selection and inspector
src/features/academy/    Curriculum, lessons, quizzes and progress
src/features/workbench/  Rules, tools, history and part inventory
src/features/experiments/ Parameterized educational experiments
src/tests/               Math, rules, persistence and component tests
e2e/                     Real-browser workflow and mesh-transform checks
```

Rendering reads deterministic mechanism angles from the simulation clock. Frame time is capped at 100 ms so returning from a suspended tab does not jump the movement. Consequently the simulation is an interactive clock, not a wall-clock timekeeper. Speed multiplies simulated elapsed time; explicit stepping advances exactly one mechanical beat or quartz pulse. Reduced motion suppresses automatic progression, while explicit step/play controls remain available.

Only progress and preferences persist under `horology-lab-v1`. Mechanical state and workbench history reset between sessions. `ProgressSync` defines an optional future synchronization boundary without requiring authentication now.

## Add a movement

1. Extend `MovementId` in `src/domain/types.ts` and add its definition in `src/content/movements.ts`.
2. Give every part a unique ID, semantic category, original position, explosion vector, shape, dimensions, material, functional metadata and connection IDs. The `parent` field records a semantic assembly relationship.
3. Define the energy path and signed gear/pinion ratios. Validate all IDs and ratios with domain tests. Add motion to the `mechanism` function and scene angle mapping where the architecture needs it.
4. Preserve `provenance`, license and reference URLs. `assetUrl` is a reserved metadata hook; an imported-model loader is **not implemented**. Add a Suspense/error-boundary-backed glTF loader and asset/license tests before using this hook.
5. Add UI selection, lesson links and workflow tests for the new architecture.

Do not relabel generic geometry as an NH35, 8215, 9015, ST36, ETA 2824-2 or SW200-1. Verified geometry, architecture, specifications and appropriate asset licensing are required first.

## Add a lesson

Add a typed `Lesson` object in `src/content/lessons.ts` with a stable ID and all ten teaching elements. Its movement/part references connect to the workshop. Set the correct answer index and an explanation that reasons from the mechanism. Completion is earned only by a correct submitted answer. Keep lesson IDs stable for saved progress; introduce a persistence migration if renaming them.

## Simulation model and limitations

This is a working **educational subset**, not a manufacturer-validated engineering simulator or the complete seven-level school described in the long-term brief.

- Mechanical: ideal 3 Hz balance (21,600 beats/hour), 15-tooth escape wheel, half-tooth release per beat. Declared barrel→center, center→third, third→fourth, fourth→escape ratios are −8, −7.5, −8 and −12. These yield one center-wheel turn/hour and one fourth-wheel turn/minute. Display hands use appropriate display-side directions. Geometry illustrates wheel/pinion groups; rendered tooth counts, tooth profiles, contact and center distances are not precision CAD.
- Energy: normalized linear 48-hour reserve, no friction/torque/amplitude solver. Winding increments and automatic efficiency are illustrative. No contact force, lubrication, collision, shock, positional-rate or tolerance solver is present.
- Quartz: 32,768 Hz divided by 2^15 gives 1 Hz. Each event gives a 180° motor step and an ideal 30:1 compound reduction to the seconds indication. Crystal vibration is never falsely depicted as slow visible motion.
- Explosion: deterministic smoothstep interpolation. All components separate along explicit vectors; there is no collision solver. Label overlap and perspective occlusion can occur in dense views. Use isolate, X-ray, camera controls or the list. Section mode removes a sector from the main plate only.
- Component grouping: keyless works, pallet stones/fork, rotor bearing, stepper stator/coil and some transmission assemblies are grouped. Small fasteners, individual pivots, complete winding train, arbor and setting lever geometry are not exhaustive. The automatic rotor is operated through an accessible drag slider; direct on-mesh rotor dragging is not implemented.
- The workbench is a six-part, preconditioned **train exercise**, not a complete physical movement service. Real balance/escapement removal, safe spring let-down and lubrication procedures must follow specific technical documentation. Completion does not establish repair competence or water resistance.
- Advanced chronographs, calendars, GMT, shock protection, full diagnostic instrumentation, drag/drop matching, standalone identification scoring, authenticated caliber library and full course breadth remain future work. Existing lessons include meaningful prediction/calculation/diagnosis assessments.
- No external CAD assets are used, so missing model-network requests cannot occur. A rendering boundary and Canvas fallback handle unavailable rendering. Imported-asset failure testing belongs with a future importer.
- No FPS guarantee is claimed. Performance mode lowers pixel density and environment resolution. Mesh transforms animate without full React component rerenders; on-screen telemetry is sampled at roughly 7 Hz.
- Browser storage can be cleared by the user or unavailable in restricted browsing. Progress does not sync across devices.

## Educational references

The lesson prose and geometry are original. These references support the core principles; they are not licenses or validation for caliber-exact CAD:

- [Fondation de la Haute Horlogerie: How does a mechanical watch work?](https://www.hautehorlogerie.org/en/watches-and-culture/library/how-does-a-mechanical-watch-work) — mainspring, going train, escapement and balance.
- [Seiko: quartz timing and binary division](https://www.seiko.co.jp/csr/toki-iku/tokiq-nazotoki/) — common 32,768 Hz frequency and fifteen divide-by-two stages.
- [Seiko Museum: the birth of the quartz timepiece](https://museum.seiko.co.jp/en/knowledge/Quartz01/) — historical context.

MIT license applies to original project code, lesson prose and procedural geometry. Dependencies retain their respective licenses.
