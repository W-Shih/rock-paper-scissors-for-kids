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

The host's current default shell uses Node **24.22.2** and npm/npx **11.13.0**.
Ordinary commands now work in the Codex sandbox without a PATH override or a
direct npm CLI path; see the sandbox repair record below. This host verification
does not change `.nvmrc`, `engines` or `packageManager`: Node 24.22.2 satisfies
the recorded Node engine, but npm 11.13.0 is outside the project's npm 10 range.
Use the declared toolchain when reproducing the CI baseline.

```sh
npm ci
npx playwright install chromium webkit
npm run check
```

`npm run dev` starts development. `npm run preview` serves the built `dist/`.
`npm run check` runs typecheck, lint, unit/DOM tests and `test:e2e` in order,
stopping on the first failure. `test:e2e` always builds before invoking
Playwright, including when called on its own. Playwright starts its production preview on
`127.0.0.1:4173` with a strict port and does not reuse an existing server.
If browser downloads are restricted, rerun the install command in an allowed
environment and then `npm run test:e2e`; do not count missing browsers as a pass.

Vitest runs `src/**/*.test.ts`: the pure bilingual formatter uses Node and the
placeholder DOM test opts into jsdom with DOM Testing Library. Playwright runs
only `e2e/`, once in Chromium and once in WebKit. TypeScript strict and ESLint
cover source, tests and TypeScript configuration. No framework choice is
confirmed by these smoke tests; nine-pair rule validation belongs to M0-02.

## npm/npx sandbox repair (2026-11-09)

**Current status:** fixed on this Windows host. New sandbox shell invocations
resolve the default `npm` and `npx` normally, without temporary environment
changes or execution outside the sandbox. The dated validation sections below
retain the commands and versions actually used at the time; their direct-CLI /
PATH workarounds are historical evidence, not current setup instructions.

### Diagnosis and repair scope

The default PowerShell launchers in `D:/_apps/Program Files/nodejs` selected
`C:/Users/a3459/AppData/Roaming/npm/node_modules/npm` through npm's configured
global prefix. PowerShell `Test-Path` reported the CLI as present, but sandboxed
Node returned `EPERM` from native `stat`, `readFileSync` and `realpath` calls;
launching the CLI then surfaced as `MODULE_NOT_FOUND`. The same global npm
worked in the actual-user context. Directly launching the Node installation's
bundled CLI and using the `.cmd` launchers also worked. These probes established
an access mismatch, rather than a missing global npm package.

The repair added only these Allow entries for the local `CodexSandboxUsers`
group. Paths are specific to this host; they are not repository prerequisites.

| Path under `C:/Users/a3459/AppData/Roaming/npm` | Added rights | Inheritance |
| --- | --- | --- |
| npm root itself | Traverse, ReadAttributes, ReadPermissions, Synchronize | None; this directory only |
| `node_modules` | Traverse, ReadAttributes, ReadPermissions, Synchronize | None; this directory only |
| `node_modules/npm` | ReadAndExecute, Synchronize | ContainerInherit + ObjectInherit; npm package and its descendants |

Existing permissions were retained. No permission was added to the user profile
root, other global packages, or other user directories; no write permission was
granted. Native probes after repair confirmed npm's `package.json` was readable,
while listing the parent `node_modules` and opening that file for read/write
still returned `EPERM` in the sandbox.

Original ACLs for the three directories were saved before modification to
`C:/Users/a3459/AppData/Local/Temp/codex-npm-acl-5fbaf0736bc84776944702f26739e3c4.json`.
This is a local recovery artifact, not a committed file or durable backup;
preserve it elsewhere before clearing temporary files if rollback is needed.
The successful repair used `.NET FileSystemAclExtensions.GetAccessControl`
with `AccessControlSections.Access`, `FileSystemAccessRule` / `AddAccessRule`,
and `FileSystemAclExtensions.SetAccessControl` to modify only the DACL.
An earlier `Set-Acl` attempt failed with `SeSecurityPrivilege`; npm/npx still
failed afterward, so the repair proceeded through the DACL-only API. No
audit-policy change or privilege grant was made.

For rollback, in the actual-user context, load each saved path/SDDL, apply its
Access section to that directory's ACL, and persist it with the same DACL-only
API. Preserve owner, group and audit entries, and do not recursively reset the
profile's ACLs. Reverting repository files does not revert this host setting.
After reinstalling or relocating global npm, recheck the actual paths and
native access before considering any new narrowly scoped repair.

An attempted PowerShell launcher edit was denied by the Node installation's
Windows ACL; the launcher remained unchanged (verified against its backup).
The final repair changed no launcher, PATH, PowerShell profile, Node/npm
package contents, project dependency or lockfile.

### Verification in fresh sandbox shells

No PATH overrides or direct CLI paths were used for these checks. Windows x64;
Node 24.22.2; npm/npx 11.13.0. This is host-repair evidence, distinct from the
project's declared Node 24.22.1 / npm 10.9.2 baseline.

| Command / probe | Result |
| --- | --- |
| `node --version` | Exit 0; v24.22.2 |
| `npm --version` / `npx --version` | Exit 0; both 11.13.0; repeated in a separate sandbox shell |
| `npx --no-install tsc --version` | Exit 0; Version 6.0.2; no package download requested |
| `npm run typecheck` | Exit 0 |
| `npm run lint` | Exit 0; zero warnings |
| `npm test` | Exit 0; 9 files, 68 tests passed |
| `npm run build` | Exit 0; 15 modules built |
| Native npm-package read / write and parent-listing probes | Read succeeded; write and parent listing remained denied |
| Actual-user `npm --version` / `npx --version` | Exit 0; both remained 11.13.0 |

No clean install, package download or browser E2E was rerun as part of this
sandbox repair. Browser-process sandbox restrictions, real Safari acceptance
and parent/child trials are separate from npm startup and are not established
by these results.

## Validation evidence (2026-11-08)

Windows x64; Node 24.22.1; npm 10.9.2. Exact package versions are recorded in
`package.json` / `package-lock.json` (Vite 8.3.6, TypeScript 6.0.2,
Vitest 5.1.0, Playwright 1.65.0, ESLint 10.14.0).

At the time, the host's default npm launcher reported a missing CLI, so validation
invoked the installed npm CLI with the selected Node on PATH. This historical
environment workaround was not a repository dependency and is no longer needed
on the repaired host described above. Initial installation ran
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
For that historical launcher workaround, each `npm` command above was executed as
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
the M0-01 section. At that time, the system npm shim still reported a missing CLI;
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

## CI validation evidence (2026-11-09)

Added [CI workflow](../.github/workflows/ci.yml) for all pull requests, pushes to
`main`, and manual dispatch. One Ubuntu 24.04 job reads Node from `.nvmrc` and
installs the npm version from `packageManager`, uses `npm ci`, then runs the
existing quality scripts and Chromium/WebKit E2E against the production build.
Browser installation includes Linux system dependencies. The E2E command enables
line/HTML reporters and a 10-minute global timeout; the job has a 20-minute cap.
Failed browser steps upload `playwright-report/` and `test-results/` for 7 days;
the existing `retain-on-failure` trace policy remains unchanged.

The workflow uses repository-read permissions, disables persisted checkout
credentials, and cancels superseded runs for the same PR/ref. No deployment,
secrets, new dependencies, coverage threshold, or product behavior was added.
This follows the [Playwright CI guide](https://playwright.dev/docs/ci-intro)
and [setup-node usage](https://github.com/actions/setup-node#usage).

Local verification used Windows x64, Node 24.22.1 and npm 10.9.2 through the
runtime paths above. Dependencies were already installed; no fresh install was
performed for this workflow-only change. Commands directly invoked the installed
tools with the supported Node prepended to PATH, matching the package scripts.

| Check | Result |
| --- | --- |
| TypeScript `tsc --noEmit` | Exit 0 |
| ESLint `. --max-warnings 0` | Exit 0 |
| Vitest `run` | Exit 0; 9 files, 68 tests passed |
| TypeScript + Vite production build | Exit 0; 15 modules |
| Playwright `test --reporter=line,html --global-timeout=600000` | Exit 0; 12/12 passed across Chromium and WebKit; HTML report generated |
| `git diff --check` | Exit 0 |

Browser tests used the actual-user context with installed browser binaries.
Manual workflow review checked event filters, least permissions, command order,
version sources, timeout and failure-artifact conditions. A standalone YAML
parser was unavailable locally. GitHub-hosted execution, Linux browser/system
dependency installation, clean CI install, and failed-run artifact upload have
not been executed; they must be confirmed after pushing the workflow. No GitHub
branch-protection settings were changed. Safari real-device, parent/child and
release acceptance remain unverified; M0-GATE status is unchanged.

## First-layer quality gate (2026-11-09)

Engineering-only follow-up; no product requirements, game behavior, storage
format or existing test assertions changed. The earlier audit described a
pre-CI baseline; by this follow-up, PR #14 had added CI and GitHub had successful
hosted runs. This change extends that workflow rather than adding another one.

Local and CI validation now share `npm run check`. It runs typecheck, lint,
unit/DOM tests, then `test:e2e`; the latter always builds before Playwright so a
standalone E2E invocation cannot silently serve an older bundle. The existing
20-minute CI job cap and 10-minute browser cap remain, as do Chromium/WebKit,
single-worker execution, no retries, and failure traces. CI selects line/HTML
reporters in Playwright config; failure reports are uploaded for seven days.

ESLint project service enables only two additional type-aware rules:
`@typescript-eslint/no-floating-promises` and
`@typescript-eslint/no-misused-promises`. An in-memory negative probe using the
real ESLint config and `src/main.ts` path confirmed that an unhandled
`Promise.resolve()` and an async DOM event callback are rejected by the intended
rules; an explicitly caught Promise is accepted. No fixture was left in source.

Validation used Windows x64, Node 24.22.1 and npm 10.9.2. The supported Node was
prepended to PATH and npm was invoked through the documented CLI path; nested
package scripts resolved correctly. Browser execution used the actual-user
context because sandbox launches previously failed with `spawn EPERM`.

| Check | Result |
| --- | --- |
| Clean `npm ci --no-fund` | Exit 0; 174 packages installed from unchanged lockfile |
| `npm run check` | Exit 0; typecheck, zero-warning lint, 68/68 unit/DOM tests, production build and 12/12 E2E passed |
| New lint negative/positive probes | Both invalid cases rejected; handled Promise accepted |
| Original WebKit reload test, `--repeat-each=3` then `--repeat-each=10` | 13/13 passed before the full quality run |

**WebKit investigation:** the earlier audit observed `Target page, context or
browser has been closed` and `page.reload: Page crashed`; a concurrent shell also
reported `System.OutOfMemoryException`. This follow-up could not reproduce the
crash with the unchanged original test in 13 repetitions or the complete suite.
At the follow-up snapshot the host had about 42.8 GiB available physical memory;
no causal memory-pressure correlation was established. Resource pressure,
Windows WebKit instability, and application lifecycle behavior were considered,
but none was proven. Root cause remains unresolved; the passing runs are new
evidence, not proof that the earlier failure is fixed. No speculative gameplay
patch, assertion relaxation, browser exclusion or automatic retry was added.
Future failures retain traces/reports for diagnosis on both local and CI hosts.

**GitHub merge gate:** the API initially reported unprotected `main` and no
rulesets. Branch protection now requires the actual GitHub Actions check
`Quality and browser tests` (app ID 15368), requires an up-to-date branch and a
PR, and applies to administrators. Required human approval count is zero.
Existing successful main check runs established the exact check name before
activation. Repository settings are external state; changing this commit alone
does not remove protection. An administrator can roll back the protection through
repository settings; changes should preserve the CI job name or migrate the
required check in the same rollout.

**Open dependency finding:** `npm audit` reports ten moderate findings in the
development lint dependency chain, rooted in the minimatch advisory
[GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249), with zero
high/critical findings. Dependencies and lockfile were not changed; remediation
requires separate compatibility evaluation rather than `npm audit fix --force`.
This gate does not claim a clean dependency-security audit, Safari real-device
acceptance, parent/child trials, M0-GATE completion or release readiness.

## M1-01 navigation shell validation (2026-11-09)

Runtime: Node v24.22.1 and npm 11.19.1. This local npm version is outside the
repository's declared npm ^10.9.2 range; CI uses the pinned npm 10.9.2 and must
pass independently before merge. The supported Node executable was
selected by prepending
`C:/Users/a3459/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin`
to `PATH`; npm was invoked with
`node "D:/_apps/Program Files/nodejs/node_modules/npm/bin/npm-cli.js"`.

Command: `node "D:/_apps/Program Files/nodejs/node_modules/npm/bin/npm-cli.js" run check`
(with the PATH above). Result: exit 0; typecheck and lint passed, Vitest passed
9 files / 72 tests, production build passed, and Playwright passed all 12 cases
across Chromium and WebKit. The browser run required local preview-server
binding outside the sandbox. The first E2E attempt had 6 failures because old
tests assumed the app launched directly in Learn/Together; navigation was
updated to traverse the new home/mode screens and Learn's own start screen.
The final complete run passed.

The parent inspected home and Play screenshots at a 390×844 browser viewport
and reported no clipping. This was a desktop browser viewport inspection, not
iPhone/iPad Safari hardware acceptance. No parent-child playtesting was done.

## M1-03 Computer play validation (2026-11-09)

The Computer route now mounts a playable one-round prototype using the shared
gesture selection cards and round controller. The controller samples its
injected uniform random source only when the player confirms; repeat or stale
confirmations do not resample. The Computer presentation uses the existing
prototype countdown and neutral vehicle approach, then shows the controller's
locked player/computer gestures, rule explanation and outcome at central reveal.
Its media failure path retains the already-determined result as a static reveal.
No formal character art, animation pack, sound, celebration media, or finished
loss-repair behavior was introduced; those remain in their planned later tasks.

Tests cover all nine known player/computer pairs with forced RNG bucket values,
all three RNG outputs, independence from the provisional player selection,
single confirmation, replay sampling a new value, and Home/dispose during a
locked countdown. DOM assertions inspect the rendered pre-reveal HTML and the
actual revealed result. Playwright sets `Math.random` before application start,
then checks countdown and approach for opponent gesture/vehicle/ARIA clues and
checks that the revealed pair and explanation match the locked result.

Runtime: Windows x64, Node v24.22.1 and local npm 11.19.1. The supported Node
executable was prepended to `PATH`; npm was invoked through
`node "D:/_apps/Program Files/nodejs/node_modules/npm/bin/npm-cli.js"`.
The first full `npm run check` attempt passed typecheck, lint, all 88 unit/DOM
tests and production build, but Playwright's preview server could not bind
`127.0.0.1:4173` inside the sandbox (`EACCES`). The same full command was rerun
in the actual-user execution context and passed:

| Check | Result |
| --- | --- |
| `npm run check` | Exit 0; typecheck, lint, 88/88 unit/DOM tests, production build, and 20/20 Playwright cases passed (10 Chromium, 10 WebKit) |
| Focused typecheck after final exit/replay coverage | Exit 0 |
| Focused Vitest: `src/computer-ui.test.ts src/round-controller.test.ts src/prototype-app.test.ts` | Exit 0; 3 files, 30 tests passed |

The final supplemental checks were limited to added tests; implementation code
was unchanged after the successful full check. Browser E2E used Playwright
Chromium/WebKit, not physical Safari. Real iPhone/iPad testing and child/parent
observation remain unverified; this evidence completes M1-03 automated work only
and does not pass the M1 exit gate or claim finished animation, emotional repair,
or release acceptance.

## M1-04 character and scene validation (2026-11-10)

Three project-authored layered SVG characters and one warm construction scene
are mapped by gesture in `src/character-assets.ts`. Shared selection cards retain
the large hand symbols and bilingual labels; Computer inserts the actual pair
of character images only after controller reveal. Asset sources and use are
recorded in [the asset record](asset-rights.md). No rule, progress, storage,
animation timing, or dependency change was made.

Validation used Windows, Node v24.22.2 and npm 11.13.0. Node satisfies the declared
range; local npm is outside the project's npm ^10.9.2 range. GitHub CI uses the
pinned npm 10.9.2 and must pass separately before merge.

| Check | Observed result |
| --- | --- |
| TDD red: `npm test -- --run src/computer-ui.test.ts` before implementation | New artwork-key assertion failed with three undefined keys |
| Final `npm run check`, after final scene SVG revision | Exit 0: typecheck, lint, 91/91 unit/DOM tests (11 files), production build, 22/22 Chromium/WebKit E2E |
| Focused character-scene browser checks | 320×740 artwork loading, geometry and secrecy passed in Chromium and WebKit |
| Independent Standards / Spec review | Frozen `M1-04 review-v1`, based on `9c8edb87ec7e4ea3e46b85f9be13b2be4813c0b7`: zero findings on both axes |

The sandbox blocked the preview-server/browser startup; the full command passed
in the actual-user context. One intermediate run there failed with WebKit
`browserContext.newPage: Target page, context or browser has been closed`.
The focused browser run and final full run passed without changing assertions,
excluding browsers, or adding automatic retries. The cause remains unproven;
passing runs do not establish a fix for the previously recorded Windows WebKit
instability.

Generated screenshots are in the ignored directory `test-results/m1-04/`:
`{chromium,webkit}-320-{selection,reveal}.png`; the E2E test regenerates them.
The coordinating agent visually inspected narrow selection and reveal views,
including the final selection with the shallow excavation. Hand symbols remain
prominent and text/buttons do not overlap. Screenshots are local evidence,
not published artifacts. No physical iPhone/iPad Safari, child/parent trial,
formal animation, or release acceptance was performed. M1-05 is next; M1 Exit
and the later real-device/parent acceptance gates remain open.

Implementation used Luna / high; independent Standards and Spec reviewers used
Sol / medium with separate fresh contexts. No model fallback was required.

## M1-06 review follow-up (2026-11-10)

- Source: `M1-06 review-v1 (PR pending)`; axis: Standards; priority: P3;
  status: resolved in the bounded M1-06 repair; review-v2 found zero remaining
  Standards findings.
- Locations: `src/computer-ui.ts:57–60` and `:160–161` in the frozen snapshot.
  Both independently map `ruleId` to the winning gesture and then to the
  winner's screen position. These implement the same placement decision for
  the same locked result, so a change must remain synchronized; drift could
  make the character storyboard and causal arrow disagree. This is a
  maintainability judgment (confirmed semantic duplication / Duplicated Code),
  not a hard-rule violation or a demonstrated wrong result.
- Completion criterion: derive winner placement once from the locked
  `RoundResult` / `outcome` and reuse it in both presentations, without another
  rule-to-winner mapping or speculative abstraction. Retain the existing
  nine-pair/direction and both-position checks; validate the repaired snapshot.
- Repair: Computer rendering now derives `winnerPosition` once from the locked
  outcome (`win` → left, `lose` → right, `tie` → none) and passes that same
  value to the causal diagram and storyboard. The short bilingual rule now
  precedes the tall storyboard; detailed gesture labels and causal explanation
  remain afterward. The diagram's SVG title now names both gestures bilingually.
- Validation on the repaired snapshot: `npm run check` exited 0—typecheck,
  lint, 106/106 tests across 11 Vitest files, production build, and 24/24
  Chromium/WebKit E2E cases. The Computer E2E verifies both hand positions
  against the diagram, and verifies the large gestures and short rule fully fit
  the initial 390×844 viewport. Focused Computer DOM tests passed 17/17; a
  focused Computer browser run passed 4/4 before the final caption-before-hands
  order adjustment. The complete final-snapshot check above includes that
  ordering and passed all 24 browser cases. The first viewport assertion run
  exposed that its general reveal case used Playwright's default viewport; the
  test was corrected to explicitly use 390×844, then passed without relaxing
  the viewport assertion. Parent visual inspection of refreshed narrow views
  found the hands and rule readable before the storyboard without clipping.
- Screenshots: ignored local artifacts in `test-results/m1-06/`, regenerated by
  the browser tests. Browser automation is not physical Safari or child/parent
  acceptance; M1-08/M3-05 remain outstanding.
- Environment: Windows, Node v24.22.2, npm 11.13.0 and Playwright 1.65.0.
  The local npm version differs from the project's pinned npm 10.9.2; required
  GitHub CI uses the pinned version and must pass before merge.
- An initial full run had one existing WebKit placeholder test fail before
  opening a page (`browserContext.newPage: Target page, context or browser has
  been closed`). The unchanged case and later full suites passed. The cause
  remains unproven; no assertions, browsers or automatic retries were relaxed.
- Model routing: implementation/repair Luna high; Standards review Sol medium;
  Spec review Sol high. Both independent review-v2 axes found zero remaining
  findings; no model fallback was needed. The parent inspected refreshed narrow
  left/right and image-failure views and confirmed the corrections.
