# Development baseline — M0-01

This is the provisional single-package Vite `vanilla-ts` baseline from
[Technical Design §2.4](technical-design.md#24-工具鏈與版本策略).
The page is a bilingual placeholder; gameplay and M0-GATE remain pending.

## Reproduce

Use Node **24.22.1** (`.nvmrc`; supported engine: 24.x from 24.22.1) and
npm **10.9.2**. All direct development dependencies use exact versions and
`package-lock.json` fixes the dependency tree. Node 24 is an LTS release line;
the [Node release schedule](https://github.com/nodejs/Release) and
[Vite](https://vite.dev/guide/) / [Vitest](https://vitest.dev/guide/) requirements
were checked when selecting this baseline.

```sh
npm ci
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium webkit
npm run test:e2e
```

`npm run dev` starts development. `npm run preview` serves the built `dist/`.
Build before E2E: Playwright starts its own production preview on
`127.0.0.1:4173` with a strict port and does not reuse an existing server.
If browser downloads are restricted, rerun the install command in an allowed
environment and then `npm run test:e2e`; do not count missing browsers as a pass.

Vitest runs `src/**/*.test.ts`: the pure bilingual formatter uses Node and the
placeholder DOM test opts into jsdom with DOM Testing Library. Playwright runs
only `e2e/`, once in Chromium and once in WebKit. TypeScript strict and ESLint
cover source, tests and TypeScript configuration. No framework choice is
confirmed by these smoke tests; nine-pair rule validation belongs to M0-02.

## Validation evidence (2026-11-08)

Windows x64; Node 24.22.1; npm 10.9.2. Exact package versions are recorded in
`package.json` / `package-lock.json` (Vite 8.3.6, TypeScript 6.0.2,
Vitest 5.1.0, Playwright 1.65.0, ESLint 10.14.0).

The host's default npm launcher points to a missing installation, so validation
invokes the installed npm CLI with the selected Node on PATH. This is an
environment workaround, not a repository dependency. Initial installation ran
out of host memory; a subsequent clean `npm ci` replaced incomplete binaries.
The retry used `NODE_OPTIONS="--max-old-space-size=512 --max-semi-space-size=1"`
and npm `--no-audit --no-fund --maxsockets=1` to bound installation resources.

| Command | Result |
| --- | --- |
| `npm ci --no-audit --no-fund --maxsockets=1` | Exit 0; 174 packages installed from lockfile |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0; zero warnings |
| `npm test` | Exit 0; 2 files, 2 tests passed (pure function + DOM) |
| `npm run build` | Exit 0; 7 modules; HTML 0.44 kB, CSS 0.21 kB, JS 1.13 kB |
| `npx playwright install chromium webkit` | Exit 0; Chromium 158.0.8127.18 (v1254), WebKit 27.2 (v2388) |
| `npm run test:e2e` | Exit 0; Chromium + WebKit, 2/2 passed; no page runtime errors |

The four quality commands were run together again after clean installation.
For the launcher workaround, each `npm` command above was executed as
`node "D:/_apps/Program Files/nodejs/node_modules/npm/bin/npm-cli.js"`,
with `C:/Users/a3459/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`
prepended to PATH; browser installation used
`node node_modules/@playwright/test/cli.js install chromium webkit`.

These checks concern
the engineering baseline for NFR-08 only; they do not establish NFR-AC-08.1–08.3,
real iPhone/iPad Safari acceptance, child/parent trials or MVP release readiness.

## M0-03 validation evidence (2026-11-08)

`src/round-controller.ts` separates the pure round reducer from the controller's
clock and media effects. The controller covers provisional selection and
confirmation, Learn's known-opponent setup, an independently injected Computer
gesture, Together's handoff, countdown/approach/reveal/complete phases, replay
and Home invalidation. Media failure and a stalled phase watchdog advance the
already-decided result; old round/phase callbacks are ignored. Learn hints,
three-attempt teaching flow and mastery accounting remain M0-05 scope.

`src/round-controller.test.ts` uses injected fake clock and media notifications
to verify one confirmation/result, illegal events, the Together handoff, replay
state clearing, stale callback/timer invalidation, watchdog fallback without
recalculation, and random gesture mapping.

Validation used Node 24.22.1 and npm 10.9.2 via the runtime paths documented in
the M0-01 section. The system npm shim still points to a missing installation;
the supported runtime invocation succeeded:

| Command | Result |
| --- | --- |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0; zero warnings |
| `npm test` | Exit 0; 4 files, 21 tests passed |
| `npm run build` | Exit 0; production bundle built |
| `npm run test:e2e` | Not run; this controller-only task adds no DOM/UI behavior |

No real Safari device or child/parent trial was used. This evidence is limited to
the M0-03 controller behavior and does not pass M0-GATE or claim full game-flow
acceptance.

## M0-02 validation evidence (2026-11-08)

The M0-02 domain implementation keeps gesture evaluation independent from the
fixed playable-character content. `src/rps-domain.test.ts` covers all nine
gesture pairs, both players' perspectives, all three winning-gesture queries,
and the three fixed character mappings.

Validation used the Node 24.22.1 runtime and npm 10.9.2 CLI noted above:

| Command | Result |
| --- | --- |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0; zero warnings |
| `npm test` | Exit 0; 3 files, 15 tests passed |
| `npm run build` | Exit 0; production bundle built |

The default shell's Node 22 / npm launcher did not meet the recorded toolchain;
the checks were rerun successfully with the documented runtime paths. Browser
E2E was not rerun because this domain-only change adds no UI behavior. This
evidence does not establish real-device, child/parent trial, or release
acceptance.
