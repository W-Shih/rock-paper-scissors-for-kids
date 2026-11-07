# MVP Implementation Plan — Construction Site RPS Adventure

> Status: Proposed, not started
> Date: 2026-11-06
> Product scope: [PRD](../PRD.md)
> Normative functional and acceptance SSOT: [Spec](../spec.md)
> Engineering candidates: [Technical Design](technical-design.md)
> 核心問題：**How will we deliver and verify it?**（Tasks / Execution / Verification）
> 核心職責：**將核准的需求與技術方案拆解為執行階段、任務、依賴關係、驗證活動、完成條件及進度／證據追蹤；不自行核准產品範圍、改寫需求或降低驗收標準。**

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

- Implement Learn per the **resolved and revised** Spec OQ-01/OQ-02/OQ-05: opponent shown first; only confirm submits an answer; **first and second wrong answers each give a gentle non-answer hint; the third wrong answer reveals the correct answer, disallows further submissions and automatically requires a correct-rule demonstration before the question can finish** (maximum three attempts; fallback to complete static/simplified teaching content if animation fails); parent-triggered demonstration remains a separate early-exit path with short encouragement, never independently correct credit (FR-03 / US-07).
- Track **first-try, unprompted correct** answers by the three distinct winning rules (0–3 each, capped), at most once per qualified Learn question. After all three counts reach 3, switch from fixed rotation to mixed questions; no consecutive-correct streak required. Incorrect then correct, demonstration, ordinary competition, replay, and stale callbacks must not increase counts. Verify normal reload persistence and safe degradation.
- Implement fair independent computer choice and hidden reveal (FR-04).
- Implement same-screen two-player handoff and secret selection (FR-05).
- Complete all three win relations and tie result; validate both left/right placements.

**Exit evidence:** Spec US-07–US-09 acceptance and negative-path tests, including non-revealing hints on wrong attempts 1 and 2, revealing only on wrong attempt 3, mandatory correct-rule demonstration before completion (including animation-failure fallback and FR-13 skip restrictions), no fourth answer, correct answers on attempts 2/3 not earning mastery credit, 2/3 vs 3/3 per-rule counts, 3/3/3 mixed-mode transition, no counting after hints/demo/replay, and same-screen secret selection.

## Phase M3 — Audio, collectibles and release quality

- Implement **all-screen Traditional Chinese + English text** regardless of speech mode, and only three speech choices: default bilingual (Chinese then English), Chinese-only, English-only. Support replay/mute and Safari autoplay degradation (FR-09; resolved OQ-03).
- Integrate owned/licensed encouragement audio; when the child wins in Computer or Together, use the approved complete applause cue (FR-08 / US-05).
- Implement three initially available core vehicles plus **three additional collectible vehicles, one per winning rule**. Unlock each only when that rule reaches its third qualified first-try unprompted Learn answer; ordinary competition, corrected attempts and parent demo never unlock, but retain their short positive feedback (FR-11; resolved OQ-04/OQ-05).
- Persist the three capped per-rule counts, unlock IDs and speech/audio preferences resiliently; ensure exactly-once credit/unlock across callbacks, replay and reload, with reset confirmation.
- Run Spec FR/NFR acceptance checks on real Safari devices, plus Android and desktop smoke tests.
- Determine and validate NFR-03 performance thresholds using actual measurements and child/parent trial feedback.
- Evaluate optional FR-13 (P1) separately without silently upgrading it into an MVP blocker.

**Exit evidence:** Evidence log per AC and NFR-AC, plus documented open failures; verify all-screen bilingual copy, three distinct speech modes, 0/3→3/3 learning and collectible progress, no collectible unlocks from battle/demo/retry (while still providing short encouragement), and no duplicate unlocks.

## Traceability and review

For each task/PR link relevant FR, US, AC, NFR and NFR-AC IDs from Spec. For product changes, reconcile PRD first. Changes to existing tests require investigation; do not edit tests only to make a failing implementation pass.
