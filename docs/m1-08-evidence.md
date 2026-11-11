# M1-08 — Computer integration and initial browser baseline

**Status: Blocked.** Automated integration evidence is recorded below. No physical
iPhone/iPad Safari, Android device, or parent/child play observation was available
for the original automated run. A subsequent user report confirms the basic iPad
portrait/landscape Computer flow, replay, layout and qualitative responsiveness
on iPad Air (5th generation), iPadOS 17.6.1, Safari (separate version not supplied).
See the [physical-device record](m1-08-device-record.md)
for the exact scope and evidence source. M1-08 is not Done, M1 Exit remains closed, and NFR-03 has no accepted
performance threshold or final pass claim.

## Scope and requirements

- Computer end-to-end flow, image/animation failure fallback, acknowledgement,
  and replay: AC-06.x, AC-12.3, NFR-AC-03.3, NFR-AC-04.1–04.3.
- Initial diagnostic browser timing sample: NFR-AC-03.1 only. Values are
  observations from desktop Playwright browsers; they are not device results,
  frame-rate/drop measurements, thresholds, or NFR-03 acceptance.
- Real-device and family observations remain required by M1-08 and Spec
  NFR-AC-02.1–02.3, 03.1, AC-12.1–12.2.

## Reproduction environment

- Date: 2026-11-10.
- OS reported by host: Windows 10 Education, 23H2, build 22631.6936.
- Node.js v24.22.2; npm 11.13.0 (project engine requests Node ^24.22.1 and
  npm ^10.9.2, so the local npm version differs from the requested range).
- Playwright 1.65.0; project `npm run test:e2e` builds with Vite 8.3.6.
- Browser projects: Playwright Chromium and WebKit, headless, local production
  preview at `http://127.0.0.1:4173`; viewport 390×844 CSS px.
- Commands: `npm run test:e2e -- e2e/computer.spec.ts --grep "animation failure|timing sample"`
  for the focused run; `npm run check` for the repository suite.

## Automated results

The focused M1-08 cases passed in Chromium and WebKit (4/4): simulated first
approach-animation failure produced the complete static result, required explicit
acknowledgement, and replay cleared the previous result; the timing case completed
the normal Computer flow. The timing case reports a single local sample per
browser in test output. Record final values from the full check below.

`npm run check` passed on the second full run: typecheck, lint, 111/111 unit/DOM
tests in 11 files, production build, and 30/30 Chromium/WebKit E2E cases. An
earlier full run had 29/30 pass; the unchanged WebKit gesture-selection test
failed before page creation with `browserContext.newPage: Target page, context or
browser has been closed`. The successful rerun used unchanged tests and no retry
or browser exclusions. This is an intermittent runner issue, not evidence of a
product failure or a proven fix. Browser automation is not physical Safari and
does not establish toolbar/safe-area or real-touch behavior.

## Timing sample (diagnostic only)

| Observation | Chromium | WebKit |
|---|---:|---:|
| Navigation DOM interactive | 10 ms | 12 ms |
| Navigation load event end | 15.9 ms | 35 ms |
| First Play control visible after navigation | 57.7 ms | 87 ms |
| Gesture DOM click to selected state | 15.4 ms | 21 ms |
| Confirm DOM click to countdown visible | 16.5 ms | 18 ms |
| Confirm DOM click to round-complete visible | 5,934.1 ms | 6,044 ms |

Each value is one observation, not a distribution. DOM event-to-state timings
include Playwright polling/protocol overhead as well as app work; round completion
also includes application timers/animation. Navigation and first-control values
are browser automation observations, not real-device first usable time. No
dropped-frame/FPS measurement was taken.

## Remaining evidence

HTTPS trial preparation (2026-11-10): see [deployment record](test-deployment.md)
and the ready-to-fill [physical Safari record](m1-08-device-record.md).
Deployment alone does not satisfy physical-device or family observations. The
subsequent iPad user report is recorded separately from deployment and automation.

- **Partial / Blocked:** the user reports passing basic iPad portrait/landscape
  Computer flow, replay, layout and qualitative responsiveness on iPad Air
  (5th generation), iPadOS 17.6.1, Safari. Explicit toolbar-state checks and quantitative device measurements
  remain pending; iPhone Safari portrait is still unverified. See the linked
  physical-device record for observations that were and were not reported.
- **Blocked:** parent/child observation of gesture understanding, mistaken speed
  cues, accidental touches, response to a loss, replay, and off-screen gesture
  demonstration. Do not record child identity or personal data.
- **Open:** establish an NFR-03 threshold from device measurements and trial
  observations, then confirm it as a product decision and repeat the measurement
  per Spec NFR-AC-03.2. Until then performance is not accepted.
- These gaps also keep the M1 Exit Gate closed; browser simulation does not
  substitute for the required observations.
