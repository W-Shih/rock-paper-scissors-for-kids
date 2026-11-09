# Development baseline — M0-01

This is the provisional single-package Vite `vanilla-ts` baseline from
[Technical Design §2.4](technical-design.md#24-工具鏈與版本策略).
The page now includes the M0-05 bilingual Learn and M0-06 Together flow spikes; formal gameplay
presentation and M0-GATE remain pending.

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
and Home invalidation. Media failure and a stalled phase watchdog enter an
explicit static reveal of the already-decided result, awaiting the renderer's
completion acknowledgement rather than treating failure as successful display;
old round/phase callbacks are ignored. Learn hints,
three-attempt teaching flow and mastery accounting remain M0-05 scope.

`src/round-controller.test.ts` uses injected fake clock and media notifications
to verify one confirmation/result, illegal events, the Together handoff, replay
state clearing, stale callback/timer invalidation, watchdog fallback without
recalculation, and random gesture mapping. PR delivery regressions additionally
cover synchronous subscriber Home/disposal, synchronous media completion,
media start/cancellation exceptions, replay callbacks, and direct reducer
round/phase-token rejection.

Validation used Node 24.22.1 and npm 10.9.2 via the runtime paths documented in
the M0-01 section. The system npm shim still points to a missing installation;
the supported runtime invocation succeeded:

| Command | Result |
| --- | --- |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0; zero warnings |
| `npm test` | Exit 0; 4 files, 27 tests passed |
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

## M0-04 validation evidence (2026-11-09)

`src/progress-store.ts` provides a version-1 JSON storage adapter for the three
mastery counts. It derives the three collectible IDs from counts on load and
save, performs a single `setItem` per save, retains the greatest observed count
to prevent accidental regression, and switches to in-memory state with a
bilingual warning after unavailable/corrupt storage or a write failure. A
newer schema remains untouched and cannot be overwritten. The adapter accepts
absolute counts; Learn eligibility and stale-callback deduplication remain the
responsibility of M0-05. Speech/audio preferences and reset UI are outside this
minimal M0-04 adapter and remain for later settings work.

`src/progress-store.test.ts` covers reload, boundary normalization and trusted
unlock derivation, corrupt JSON, unavailable storage, write failure, newer
schema protection, one-record writes, idempotent absolute-count retries, and
non-regression. Invalid or inconsistent stored values retain valid sibling
counts, are normalized conservatively, and surface the storage warning until a
successful save repairs the record.

Validation used Node 24.22.1 / npm 10.9.2 from the runtime paths recorded in
M0-01. A first full-suite attempt with the system Node 22.13.1 failed to start a
Vitest worker due to an `undici` `bind` error; rerunning on the supported Node
24 runtime succeeded:

| Command | Result |
| --- | --- |
| `npm test` | Exit 0; 5 files, 34 tests passed |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0; zero warnings |
| `npm run build` | Exit 0; production bundle built |

Focused storage tests passed (7/7). No UI, real-device, or child/parent trial
was part of this adapter task; this does not pass M0-GATE or establish the full
NFR-AC-07.1 settings/reload acceptance.

## M0-05 validation evidence (2026-11-09)

The production entry now mounts a minimal bilingual Learn spike. The existing
round reducer/controller owns provisional selection, confirmation, two gentle
non-answer hints, a third-wrong forced correct demonstration, voluntary
demonstration, and the first-unhinted-correct progress transaction. Wrong
confirmation clears selection, so duplicate confirmation cannot consume another
attempt. Any started demonstration blocks Home and next-question actions until
its explanation has been shown and acknowledged; Home remains available before
a demonstration starts. No wrong answer becomes a
competitive loss.

`learn-domain.ts` supplies fixed scissors/paper/rock opponents until all three
mastery counts reach 3, then uses injected random mixed questions. The controller
commits the absolute count and derived unlock synchronously before notifying
subscribers or starting media. Counts cap at 3; repeated confirmation, media
notifications, and stale round callbacks do not reaward progress. The existing
version-1 storage format is unchanged. `MasteryRuleId`, its exhaustive ordered
ID list, and `MasteryCounts` live in the pure RPS domain module. The storage
adapter re-exports these symbols for compatibility, while Learn domain depends
directly on the pure domain module.

`learn-ui.ts` uses one delegated click listener and one state-driven renderer.
Selecting a card updates pressed state and retains focus; there is no separate
DOM-owned game state. Progress labels are neutral rule numbers, so neither
visible progress nor ARIA reveals the answer before confirmation. The spike has
no animation/audio assets: its media adapter immediately enters the existing
static-fallback boundary. That screen presents both correct gestures, the
bilingual winning rule and causal explanation, plus the friendly restored
ending. An explicit "Demonstration finished" button acknowledges this content
before completion. Stalled/failing injected media uses the same fallback.

Tests use the authorized controller and DOM public seams with injected
time/media/random/storage boundaries. They are proportional behavior tests;
this evidence does not claim a formal red-green TDD cycle. Existing tests were
preserved. The original placeholder factory test still verifies its default
baseline; an optional status supports the Learn entry. The E2E baseline test
was updated because the production page now exposes the authorized spike,
while retaining bilingual-heading and runtime-error checks.

Review follow-up moved mastery definitions to the pure domain module and
closed the voluntary-demonstration Home path: delayed media cannot return Home
before the complete static causal explanation is acknowledged. The controller
rejects Home for every in-progress demonstration, and the UI only offers it
before a demonstration starts or after completion.

Validation used the supported Node 24.22.1 / npm 10.9.2 runtime documented above:

| Command | Result |
| --- | --- |
| `npm run typecheck` | Exit 0 after controller and UI slices; build also includes typecheck |
| `npm test -- src/learn-controller.test.ts src/round-controller.test.ts` | Exit 0; 2 files, 19 tests passed |
| `npm test -- src/learn-ui.test.ts` | Exit 0; 1 file, 7 tests passed |
| `npm test` | Exit 0; 7 files, 49 tests passed |
| `npm run lint` | Exit 0; zero warnings |
| `npm run build` | Exit 0; 12 modules; CSS 0.61 kB, JS 13.37 kB |
| `npm run test:e2e` | Exit 0; 6/6 passed across Chromium and WebKit |

Controller/DOM coverage includes second-/third-attempt success, all three
correct rules, voluntary/forced demonstrations, non-answer hints, no fourth
attempt, failure fallback waiting for acknowledgement, stale notifications,
duplicate events, synchronous 2→3 unlock/reload, capped counts, and the 3/3/3
mixed gate. A delayed voluntary demonstration verifies that Home remains
unavailable through static fallback and becomes available after explicit
acknowledgement. Browser tests verify the production entry, repeated reload before
demonstration completion with one capped unlock, and the forced static
demonstration before Home/next become available.

No real iPhone/iPad Safari, Android touch, parent/child trial, formal animation,
speech/audio, final Garage UI or release acceptance was performed. These
results complete the M0-05 spike only; M0-06 onward and M0-GATE remain pending.

## M0-06 validation evidence (2026-11-09)

The minimal launcher (`prototype-app.ts`) opens the existing Learn spike or the
Together spike. This is a technical-spike entry rather than the full M1-01
product navigation. Together reuses the M0-03 round controller and pure rule
engine. Its renderer removes P1 controls and pressed-state markup at handoff,
places focus on a neutral heading, and starts P2 with no selected card. Handoff
is explicitly acknowledged by P2; the controller no longer schedules a media
watchdog for this human-paced boundary. Other phase watchdogs are unchanged.

After both confirmations, the media adapter shows 3, 2, 1, then moves two
identical anonymous SVG vehicles using WAAPI. No gesture or character is passed
to the pre-reveal adapter. Both actual choices are rendered together in the
central reveal, with the bilingual rule and a simplified causal/restored-ending
explanation reused from Learn. This spike does not implement formal character
art, three full causal animations, emotional animation, audio or FR-13 controls.
Animated reveal completes after a short display; a media failure instead shows
the complete static result and waits for explicit "Finished watching" before
completion. Neither path changes the locked outcome or saves mastery.

The adapter owns cancellable timers and animations. Completion/rejection
handlers are attached immediately to every started animation, including when a
later animation setup throws. The existing controller token invalidates stale
notifications. The launcher disposes and blanks its current view on every
pagehide, including bfcache; pageshow and popstate reopen a fresh home. Disposing
a view removes its delegated click listener and controller subscription. No
secret selection is persisted.

Tests use the agreed public controller/media protocol, rendered DOM/ARIA and
Playwright seams; browser time, storage and WAAPI are controlled at boundaries.
Red-green evidence includes missing Together UI, the 30-second handoff timeout
regression, countdown-to-static fallback, lifecycle mounting, and a partial-WAAPI
setup test that first reproduced an unhandled rejection and then passed after
immediate rejection handling. Existing tests and their assertions were retained.

Validation used Windows x64, Node 24.22.1 and the runtime invocation documented
above. Commands below directly invoke the installed tools after prepending the
supported Node runtime to PATH; they correspond to the package scripts.

| Command | Result |
| --- | --- |
| `node node_modules/typescript/bin/tsc --noEmit` | Exit 0 after implementation slices and final changes |
| `node node_modules/vitest/vitest.mjs run src/together-ui.test.ts src/prototype-app.test.ts src/round-controller.test.ts` | Exit 0; 3 files, 31 tests passed |
| `node node_modules/vitest/vitest.mjs run` | Exit 0; 9 files, 68 tests passed |
| `node node_modules/eslint/bin/eslint.js . --max-warnings 0` | Exit 0; zero warnings |
| `node node_modules/vite/bin/vite.js build` | Exit 0; 15 modules, CSS 0.75 kB, JS 19.17 kB |
| `node node_modules/@playwright/test/cli.js test e2e/together.spec.ts` | Exit 0; 6/6 passed across Chromium and WebKit |
| `node node_modules/@playwright/test/cli.js test` | Exit 0; 12/12 passed across Chromium and WebKit, including unchanged Learn flows |

DOM coverage exercises all nine actual pairs, P1 DOM/ARIA/focus erasure,
unselected P2, rapid confirmations, detached controls, replay and stale
notifications, missing/rejected/stalled/partially-started WAAPI, cancellation
by Home/disposal, timer cleanup and unchanged mastery/no save. Browser coverage
checks private handoff/countdown/neutral SVG approach, simultaneous actual-pair
reveal and replay, cancel/reload/back, static failure completion and no page
runtime errors. Browser runs require the actual-user execution context with its
installed browser binaries: the first sandbox launch attempts failed immediately
and the runner was cancelled; rerunning in that context passed. This did not
require dependency, source or Playwright configuration changes.

No real iPhone/iPad Safari, Android touch, child/parent trial, formal media,
performance threshold or release acceptance was performed. M0-07 evidence
assessment, M0-GATE and all later product tasks remain pending.
