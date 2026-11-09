# M0-07 — Prototype Evidence and Architecture Decision

> **Status:** Done — 2026-11-09  
> **Scope:** Engineering evidence for TD-02 / TD-04 / TD-07 and M0-GATE. This is not product acceptance, Safari device validation, or approval of additional product scope.

## Evidence sources

The two representative spikes and their validation records are:

| Spike | Commit | Main files |
|---|---|---|
| M0-05 Learn Flow | [`fabcdfb`](https://github.com/W-Shih/rock-paper-scissors-for-kids/commit/fabcdfb) | `src/learn-domain.ts`, `src/learn-ui.ts`, `src/learn-controller.test.ts`, `src/learn-ui.test.ts`, `src/round-controller.ts`, `src/progress-store.ts`, `e2e/placeholder.spec.ts` |
| M0-06 Together + Animation | [`565cd4d`](https://github.com/W-Shih/rock-paper-scissors-for-kids/commit/565cd4d) | `src/together-ui.ts`, `src/together-media.ts`, `src/prototype-app.ts`, `src/together-ui.test.ts`, `src/prototype-app.test.ts`, `e2e/together.spec.ts`, `src/round-controller.ts` |

Detailed commands, runtime versions, test counts and device-validation limits are recorded in [development.md](development.md#m0-05-validation-evidence-2026-11-09) and [development.md](development.md#m0-06-validation-evidence-2026-11-09). The changes retained existing tests; both records identify implementation defects reproduced during development and their fixes. The relevant examples are the delayed voluntary Learn demonstration allowing Home too early, an accidental timed Together handoff that could advance without P2, and a partially started WAAPI animation whose cancellation could produce an unhandled rejection. Regression coverage was added for these cases.

Coordinator verification of the current tree: `npm run check` completed typecheck, lint, unit/DOM tests (9 files / 68 tests), and production build successfully, then the sandbox blocked the preview server with `EACCES`; this command therefore did not complete its E2E stage. Running the E2E command with the supported browser execution permissions completed the production build and passed **12/12** tests (6 Chromium, 6 WebKit). The host used Node 24.22.2 / npm 11.13.0, outside the repository's declared npm 10.9.2 range; the committed spike evidence separately records Node 24.22.1 / npm 10.9.2. A historical WebKit process instability was investigated but its cause was not established; the successful current browser run is evidence of this run only, not proof that the earlier instability is fixed.

## Responsibilities and lifecycle boundaries

- `rps-domain.ts` owns gesture/rule data and pure outcome calculation. `learn-domain.ts` owns Learn question sequencing/content. Neither renderer decides outcomes.
- `round-controller.ts` owns legal round phases, confirmed selections, transition tokens, result calculation, progress transaction timing, and cancellation/stale-event rejection. Clock, random, media and storage are injected at boundaries.
- `learn-ui.ts` and `together-ui.ts` render controller state, translate delegated clicks into controller events, and subscribe once to controller updates. They do not keep a second game-state model. Learn's renderer exposes the full bilingual static causal explanation and an explicit acknowledgement before forced-demo completion.
- `together-media.ts` owns only countdown/approach/reveal presentation. Before reveal it receives no gesture or character content; the two SVG vehicles are identical and anonymous. It owns its timers and WAAPI handles, immediately observes each `finished` promise, and exposes cancellation. The controller token rejects any notification arriving after cancellation or a newer phase.
- `prototype-app.ts` owns spike-level navigation and browser lifecycle. Leaving a screen disposes its listener, controller subscription and effects, removes its DOM, and starts a fresh safe home. `pagehide` clears state even for bfcache; `pageshow`/`popstate` reopen it. Secret choices are not stored.

## TD §12.3 criterion assessment

| Criterion | Observed evidence | Assessment |
|---|---|---|
| UI state consistency | Learn and Together each render from one controller snapshot. Learn attempt, reveal and progress state remain controller/domain-owned; Together handoff removes P1's selection controls and selected markup before P2 can act. The nine result pairs are computed by the shared pure rule domain. | **Vanilla condition met.** No competing UI-owned game state or contradictory screen state was found in these representative flows. |
| DOM and event lifecycle | Both screens use one delegated listener and one controller subscription. `dispose()` removes both and disposes the controller; Together also clears its DOM. Effects are cancelled on phase change/Home/disposal, including timers and active animations. The launcher handles page lifecycle explicitly. | **Vanilla condition met.** Cleanup boundaries are explicit; no repeated per-render listeners or custom reactive framework were observed. |
| Testability | Learn evidence covers attempts, hints, demonstration/acknowledgement, mastery, reload and fallback. Together covers all nine pairs, handoff DOM/ARIA/focus privacy, replay, stale events, cancellation, unavailable/rejected/stalled/partially started WAAPI, lifecycle and static fallback. Public controller/media/DOM seams use injected time, storage, random and animation boundaries. Both Playwright browser projects passed in the recorded supported runtime. | **Vanilla condition met for M0.** Evidence is repeatable without waiting on real animation duration for controller/DOM behavior. Browser evidence is still only Chromium/WebKit automation. |
| Animation and secrecy | The pre-reveal media boundary receives no gesture; both vehicles are neutral. Handoff renderer drops P1 controls. Cancellation, returning home, reload/back, delayed notifications and animation rejection are covered. | **Vanilla condition met for the spike.** No re-render or navigation leak was found by DOM/ARIA/focus and browser checks. This does not prove real-device Safari behavior. |
| Actual maintenance cost | Commit diffs show M0-05 changed 14 files (631 insertions / 21 deletions), including the 128-line Learn screen, 32-line Learn domain and a 52-line controller extension; M0-06 changed 12 files (527 insertions / 12 deletions), including an 81-line Together screen, 68-line media adapter, 30-line launcher, and only 3 controller lines. Most remaining additions are focused tests and evidence. No broad controller rewrite or UI binding framework was needed. | **No React trigger found.** The observed maintenance cost stayed local to the shared controller/domain and screen/media adapters; development fixes were covered by regression tests. Full product UI complexity is not yet represented, so reassess if M1/M2 shows repeated cross-screen synchronization cost. |

## Failures, fragility and known limits

- **Resolved implementation failures:** the M0-05/M0-06 records document the failed behavior probes and regression fixes noted above. They are not outstanding defects and are not treated as successful test results before the fixes.
- **Recorded red probes (not outstanding failures):** M0-06 identifies the missing Together UI, an erroneous 30-second handoff timeout, and the unhandled rejection from cancelling a partially started WAAPI effect; it does not provide numeric red-run totals or raw stderr for these individual probes. M0-05 explicitly says the evidence does not claim a formal red-green TDD cycle. The claim here is limited to reproduced failure cases, implemented fixes and passing regression coverage.
- **Environment failure:** the M0-06 Playwright browser launch initially failed in a restricted sandbox; rerunning with the repository's supported installed-browser context passed. This indicates E2E execution depends on browser binaries/runtime permissions, not a known application failure. Do not count the failed launch as a pass.
- **Current check output:** `npm run check` stopped at E2E preview startup with `EACCES` after the typecheck, lint, 68 unit/DOM tests and build all passed. The separate supported-permission E2E run passed 12/12. Thus the combined evidence covers every package check, but the single `npm run check` invocation itself did not exit successfully.
- **Test fragility:** these are deliberately small representative flows and don't measure maintenance over a large screen inventory. E2E relies on installed Chromium/WebKit and currently has no real Safari/iOS coverage. A prior WebKit process instability remains unexplained. The media adapter uses WAAPI promises and browser timers, so keep cancellation/fallback boundary tests when it changes. DOM tests use accessible output and public event seams, but do not test child comprehension or visual polish.
- **Not established:** full Learn/Together product acceptance, formal animation/audio/assets, Safari/iPhone/iPad or Android touch behavior, performance thresholds, child/parent usability, and release acceptance remain open under their planned milestones.

## Decision

The evidence meets the M0 prototype criteria for selecting Vanilla TypeScript strict + Vite, the pure Domain / framework-independent Reducer-Controller / Screen Renderer split, and Vitest + DOM Testing Library + Playwright automation. Set **TD-02 = Confirmed Vanilla**, **TD-04 = Confirmed Vanilla**, and **TD-07 = Confirmed for M0/MVP automation**. No concrete unresolved UI-architecture failure requires a React comparison, so **M0-08 is Not needed**. M0-GATE is passed for the technology decision and permits M1 to begin.

This decision is bounded to the architecture question. WebKit automation is not Safari device acceptance; do not infer full Learn/Together completion, M1 Exit, or MVP acceptance from this gate. Reopen the relevant decision only on a concrete, reproducible architecture cost (such as repeated manual state synchronization or lifecycle code that cannot be kept local with simple changes), after ruling out an ordinary defect.
