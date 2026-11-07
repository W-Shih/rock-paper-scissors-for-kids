# MVP Implementation Plan — Construction Site RPS Adventure

> Status: Proposed, not started
> Date: 2026-11-06
> Product scope: [PRD](../PRD.md)
> Normative functional and acceptance SSOT: [Spec](../spec.md)
> Engineering candidates: [Technical Design](technical-design.md)
> 核心問題：**How will we deliver and verify it?**（Tasks / Execution / Verification）
> 核心職責：**將核准的需求與技術方案拆解為執行階段、任務、依賴關係、驗證活動、完成條件及進度／證據追蹤；不自行核准產品範圍、改寫需求或降低驗收標準。**

This is an execution plan, not an authority to change requirements. The PRD §5.3 IDEA list is excluded until explicitly approved.

## Phase M0 — Technical Spike and Architecture Decision Gate

**Baseline**: 暫採 **Vanilla TypeScript (strict) + Vite**；React + TypeScript + Vite 是備選，**尚未正式選型**。此 M0 Spike 屬工程風險驗證，不是正式實作整個 Learn / Together 模式，也不代表 Spec 已驗收。詳細決策標準見 [Technical Design §12.3](technical-design.md)。

**M0-S0 — Prototype setup and invariant domain（前置）**

- 使用 Vite `vanilla-ts`、TypeScript strict、Vitest 與 DOM Testing Library 建立最小可重現的測試與開發環境，保留 npm lockfile；不導入 React／自製 UI framework。
- 實作可單元測試的三手勢、9 組結果與單回合純 reducer／controller，注入可控制的亂數、動畫完成／失敗事件與暫存服務。
- 只建立足以驗證流程的 Screen Renderer、事件監聽與 placeholder SVG；避免正式音訊與插畫製作阻礙選型驗證。

**M0-S1 — Learn Flow Spike（UI + correctness + persistence）**

- 最小教學畫面：先展示指定對手、選卡與確認、首兩次錯誤不揭曉答案的提示、第三次錯答封鎖第四次提交，並以簡化但完整的正確規則示範完成本題。
- 驗證首次確認即正確時單次合格計數、對應解鎖推導及 localStorage reload；錯答補答／主動示範／強制示範／重播不重複發獎；存檔失敗可繼續遊玩並提示。
- 以 Vitest + DOM Testing Library 測試狀態及 DOM，記錄是否出現重複 DOM 同步、listener 清理問題、測試過度依賴內部畫面結構。

**M0-S2 — Together + Animation Spike（DOM lifecycle + secrets）**

- 最小雙人流程：Player 1 確認、保密交接、Player 2 確認、簡單倒數、SVG/WAAPI 前進與中央共同揭曉；無須正式美術。
- 測試返回／取消／重新載入、快速連點、動畫取消或失敗、舊回合 callback、重玩；揭曉前不洩漏上一位玩家的手勢，媒體故障不影響唯一結果。
- 驗證畫面更新時動畫元素是否保持穩定、是否出現重複事件註冊或為了同步多個畫面開始自建 reactive framework。

**M0-S3 — Architecture Decision Gate（M1 的前置關卡）**

- 收集：Prototype commit/檔案、Unit／DOM／必要 E2E 測試輸出、失敗案例、UI／DOM 事件與狀態責任的觀察、已知風險。可先使用 desktop browser 自動化；Safari 實機與最終效能定標仍按 M1／NFR 執行，**不得宣稱 M0 通過等於實機驗收完成**。
- 若 Vanilla 的 Renderer／Controller 清楚、測試穩定、事件清理與動畫取消可控，正式確認 **Vanilla TypeScript + Vite**，在 Technical Design 更新 TD-02／TD-04／TD-07 的狀態與證據。
- 若出現大量手動 DOM 狀態同步、反覆事件生命週期問題、脆弱 UI 測試或需要自製 UI framework，**先查明是否一般實作錯誤**；只有證實是架構成本問題，才針對問題進行最小 React 對照 Spike，將實測取捨寫回 Technical Design，選定方案後才開啟 M1。
- **Gate 未有充分證據時，不標記通過，也不先投入大量 M1/M2 正式 UI 實作**；只記錄尚待驗證條件並繼續最小驗證。沒有要求雙框架完整並行開發，也沒有強制行數／bundle 大小門檻。

**Exit evidence**：兩條最小流程可重現、指定的正反向情境有測試紀錄、風險與比較理由可追溯，**TD-02／04／07 已更新為正式選型或明確記錄 Gate 未通過**。**M1 開始條件：Gate 已正式選定實作架構。**

## Phase M0 completion — Rules and round skeleton

下列原有 M0 工作由 M0-S0～S3 中的最小原型涵蓋，不重複造第二套架構；正式遊戲骨架延伸應以 Gate 選定方案為準：

- 繼續使用 M0 Gate 已確認的 Web App Toolchain；不再另行建立與 Spike 不一致的第二套骨架。
- Implement three fixed gestures, deterministic result function and nine matchup tests (FR-01 / FR-02; NFR-08).
- Implement the single-round state transitions and replay/reset. Prevent duplicate settlements (FR-10; NFR-04).
- Use placeholders for original vehicle art; verify the basic flow on the target touch devices.

**Exit evidence:** Reproducible nine-combination tests and manual single-round smoke test; **M0 Gate 的正式選型證據已記錄，才能開始 M1**.

## Phase M1 — First playable vertical slice (requires M0 architecture sign-off)

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
