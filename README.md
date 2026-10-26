# Horology Lab

[**Open Horology Lab →**](https://abhinaytiwari.github.io/horology-lab-the-interactive-watchmaking-academy/)

An interactive watchmaking academy: explore 3D movements, separate their components, follow the energy, and test your understanding. No account, API key, or paid service required.

## Explore

- **Three movements:** hand-wound mechanical, automatic, and analog quartz.
- **Interactive 3D:** selectable parts, reversible exploded views, isolation, X-ray, labels, and a main-plate cutaway.
- **Simulation:** play/pause, single-step, speed controls, winding, energy reserve, and an interactive automatic rotor.
- **Academy:** 12 lessons across six levels, quizzes with feedback, and locally saved progress.
- **Workbench:** a six-part disassembly/reassembly exercise with tool checks, dependencies, and undo/redo.
- **Experiments:** gear ratios, quartz division, escapement beat rates, automatic winding, and timekeeping drift.

Responsive layouts include keyboard controls, Beginner/Engineering explanations, themes, reduced motion, and performance settings.

## Run locally

Requires **Node.js 22.12+** and npm. Use a WebGL2-capable browser for 3D.

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173/`.

## Test and build

```sh
npm run check                   # Lint, unit/component tests, production build
npx playwright install chromium
npm run test:e2e                 # Browser workflows; starts its own server
npm run preview                 # Serve the production build
```

Run `npm run build` for a standalone production build in `dist/`. Browser tests cover mesh transforms, selection, lessons, persistence, reassembly, accessibility, and renderer fallback.

## Deploy to GitHub Pages

In **Settings → Pages → Build and deployment**, select **GitHub Actions**, then push to `main`:

```sh
git push origin main
```

The [Pages workflow](.github/workflows/pages.yml) runs checks, builds, and deploys. Pull requests validate without publishing.

The workflow sets `VITE_BASE_PATH` to `/<repository-name>/`; hash routing keeps deep links working on static hosting. For an account-root site or custom domain, use `/`. Local builds default to relative assets (`./`).

**Vercel alternative:** use the Vite preset, build command `npm run build`, output `dist`, and leave `VITE_BASE_PATH` unset or set to `/`.

## Architecture and extension

**Stack:** React, TypeScript, Vite, Three.js/React Three Fiber, Drei, Zustand, Radix Tabs, Motion, React Router, and Tailwind CSS 4.

| Location | Purpose |
| --- | --- |
| `src/app/`, `src/components/` | Routing, layout, shared controls |
| `src/content/` | Typed movements and lessons |
| `src/domain/` | Component schemas, gear alignment, kinematics, assembly rules |
| `src/features/` | Explorer, academy, workbench, experiments |
| `src/state/` | Simulation state and persistent preferences |
| `src/tests/`, `e2e/` | Unit, component, and browser tests |

**Add a movement:** extend `MovementId` in `src/domain/types.ts`, define parts and provenance in `src/content/movements.ts`, and add motion relationships, rendering, and tests. Each part needs a unique ID, assembly/explosion transforms, geometry, and educational metadata.

**Add a lesson:** add a complete `Lesson` in `src/content/lessons.ts`, including its movement/part references, experiment, question, correct answer, and feedback. Keep IDs stable to preserve saved progress.

Progress and preferences use browser storage; simulation and workbench state reset between sessions. `ProgressSync` provides a boundary for future account synchronization.

## Model boundaries

- Models are **generic educational assemblies**, not manufacturer CAD or validated engineering simulations. Some subcomponents are grouped.
- Going-train and winding meshes use matching tooth counts, pitch-circle spacing, coplanar gear faces, and synchronized tooth phases. Compound pinions, bridge seats, and bearing centers share the same layout data. Tooth profiles remain illustrative rather than manufacturing geometry.
- Mechanical timing uses an ideal 3 Hz balance and a simplified 48-hour energy reserve. Quartz uses 32,768 Hz divided to 1 Hz. Geometry, torque, winding efficiency, and contact behavior are illustrative.
- Explosion has no collision solver; cutaway affects only the main plate. The rotor uses an accessible slider rather than direct mesh dragging.
- The workbench teaches dependencies, not a complete physical service procedure. Real repairs require movement-specific instructions and safe handling of stored energy and delicate parts.
- Advanced complications, authenticated caliber models, imported-CAD loading, and the full advanced curriculum remain future work.
- Progress stays in this browser. Rendering performance depends on hardware; lessons and component descriptions remain available without WebGL.

## References and license

Educational background: [FHH — mechanical movements](https://www.hautehorlogerie.org/en/watches-and-culture/library/how-does-a-mechanical-watch-work), [Seiko — quartz timing](https://www.seiko.co.jp/csr/toki-iku/tokiq-nazotoki/), and [Seiko Museum — quartz history](https://museum.seiko.co.jp/en/knowledge/Quartz01/).

Original code, lessons, and procedural geometry are [MIT licensed](LICENSE). Dependencies retain their own licenses.
