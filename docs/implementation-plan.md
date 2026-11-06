# MVP Implementation Plan — Construction Site RPS Adventure

> Status: Proposed, not started
> Date: 2026-11-06
> Product scope: [PRD](../PRD.md)
> Normative functional and acceptance SSOT: [Spec](../spec.md)
> Engineering candidates: [Technical Design](technical-design.md)

This is an execution plan, not an authority to change requirements. The PRD §5.3 IDEA list is excluded until explicitly approved.

## Phase M0 — Rules and round skeleton

- Set up the proposed Web App toolchain only after confirming technical choices.
- Implement three fixed gestures, deterministic result function and nine matchup tests (FR-01 / FR-02; NFR-08).
- Implement the single-round state transitions and replay/reset. Prevent duplicate settlements (FR-10; NFR-04).
- Use placeholders for original vehicle art; verify the basic flow on the target touch devices.

**Exit evidence:** Reproducible nine-combination tests and manual single-round smoke test.

## Phase M1 — First playable vertical slice

- Build three recognizable selectable vehicles, one construction site, countdown and approach animation.
- Complete one cause-and-effect rule animation and one loser-comfort/recovery outcome.
- Keep RPS rule determination independent from vehicle animation and speed.
- Run an iPhone/iPad Safari prototype trial; capture initial NFR-03 performance baselines without inventing numeric thresholds.

**Exit evidence:** A child-playable end-to-end round and recorded observations.

## Phase M2 — All learning and competition modes

- Implement Learn with prompts, non-punitive incorrect attempts and retry (FR-03).
- Implement fair independent computer choice and hidden reveal (FR-04).
- Implement same-screen two-player handoff and secret selection (FR-05).
- Complete all three win relations and tie result; validate both left/right placements.

**Exit evidence:** Spec US-07–US-09 acceptance and negative-path tests.

## Phase M3 — Audio, collectibles and release quality

- Integrate bilingual prompts, settings, mute, owned/licensed encouragement audio, browser autoplay degradation (FR-09).
- Add basic collectibles and resilient local progress storage, with reset confirmation (FR-11).
- Run Spec FR/NFR acceptance checks on real Safari devices, plus Android and desktop smoke tests.
- Determine and validate NFR-03 performance thresholds using actual measurements and child/parent trial feedback.
- Evaluate optional FR-13 (P1) separately without silently upgrading it into an MVP blocker.

**Exit evidence:** Evidence log per AC and NFR-AC, plus documented open failures.

## Traceability and review

For each task/PR link relevant FR, US, AC, NFR and NFR-AC IDs from Spec. For product changes, reconcile PRD first. Changes to existing tests require investigation; do not edit tests only to make a failing implementation pass.
