<!--
Constitution Sync Impact Report — scope clarification before initial commit
- Version: 1.0.0 (refines the uncommitted initial draft; no new release)
- Retained as fundamental constraints: educational purpose, rule integrity,
  emotional safety, child-appropriate interaction, privacy, trustworthy evidence.
- Moved out of constitutional scope (authority remains in PRD.md/spec.md):
  character mapping, exact UI/audio behavior, browser targets, progress counters,
  storage mechanism, retry/settlement details, and specific acceptance tests.
- Removed prescriptive engineering heuristics, architectures, and exhaustive
  delivery checklists; these belong in AGENTS.md, technical design, or plans.
- Reviewed: PRD.md, spec.md, AGENTS.md; no dependent files changed in this revision.
-->

# 工地猜拳大賽（Construction Site RPS Adventure）— Constitution

> **核心問題：Principles / Constraints**
> **文件職責：定義不可妥協的原則、決策底線，以及所有需求與實作必須遵守的約束。**

本憲章規定專案跨需求、設計、實作與驗證階段的**不可任意突破之底線**。
它不是產品功能清單、行為規格、技術設計或 Coding Agent 操作手冊；
**不重述** `PRD.md` 的版本範圍，也不以本文件取代 `spec.md` 的驗收標準。

本文件使用「**必須／不得（MUST / MUST NOT）**」表示不可擅自違反的原則。
具體實現方式由團隊與 Coding Agent 根據需求、風險與驗證結果判斷；
**符合憲章不等於必須使用特定框架、架構、設計模式、開發流程或測試工具**。

## Core Principles（核心原則）

### I. Education First — 教學目標優先

遊戲的核心目的，是幫助孩子理解真實的石頭、剪刀、布手勢及勝負關係，
而非讓孩子只記住哪一台工程車較強或單純追求勝場數。

- 任何新功能、回饋、動畫或獎勵 **MUST NOT** 扭曲真實猜拳規則，
  或使與教學目標衝突的娛樂機制取代學習目的。
- 產品 **MUST NOT** 將遊戲內完成、對戰勝利或獎勵取得，
  未經相應證據便宣稱為孩子已在真實生活中掌握規則。

**決策底線：** 當娛樂效果與正確學習發生衝突，以教學目的及規則理解為優先。

### II. Rule Integrity and Fairness — 規則正確與公平

猜拳勝負必須依所採用且經核准的規則決定；畫面只是呈現結果的方式。

- 標準雙人石頭、剪刀、布的勝負關係 **MUST** 正確且一致；
  車輛外觀、速度、特效、收藏或其他非規則因素 **MUST NOT** 改變結果。
- 對戰模式 **MUST** 遵守已核准的公平性與資訊揭露原則；
  實作不得為製造戲劇效果而暗中操縱勝負或洩露尚未揭曉的選擇。
- 新玩法若需要不同規則，**MUST** 先成為正式產品決策，
  再由 `spec.md` 定義其可觀察行為；不得自行延伸或改寫既有規則。

**決策底線：** 任何技術或敘事方案都不得破壞遊戲規則的可信度。

### III. Emotional Safety and Child Agency — 情緒安全與自主性

主要使用者是幼兒。孩子答錯、平手或輸掉時，應保持願意再試的安全感與自主性。

- 遊戲 **MUST NOT** 羞辱、嘲笑、威嚇孩子，或以懲罰、
  不可恢復的負面結局與強迫重玩製造挫折。
- 獎勵與競賽機制 **MUST NOT** 利用壓力、恐懼或失去既有成果
  迫使孩子繼續玩。
- 新互動 **MUST** 保留符合幼兒能力的參與方式；
  具體安撫、重玩、修復及互動流程由 `PRD.md`／`spec.md` 決定。

**決策底線：** 刺激性與留存率不得優先於孩子的心理安全及自主選擇。

### IV. Child-Appropriate Accessibility — 適齡且可理解

核心體驗應以尚未熟練閱讀的幼兒能理解和參與為前提。

- 主要選擇與結果 **MUST NOT** 僅依賴長篇閱讀、
  單一顏色或一定要聽見聲音才能理解的資訊。
- 不得讓裝置限制、輔助素材或非核心媒體功能的失效，
  在可以合理降級的情況下阻斷核心學習目的。
- 目標平台、雙語文字、語音模式、操作細節與具體可及性驗收
  **以 PRD／Spec 為準**，不在憲章鎖定某種 UI 或技術做法。

**決策底線：** 呈現手法可以改變，但不能犧牲幼兒理解規則的能力。

### V. Privacy, Safety and Responsible Content — 隱私、安全與素材責任

兒童相關的資料、權限、商業機制及內容授權必須採取保守而透明的做法。

- 不得收集或傳送非必要的兒童個資，也不得未經正式產品決策
  與適當風險評估，就引入新資料流程、裝置敏感權限或第三方追蹤。
- **MUST NOT** 以針對兒童的行為追蹤、操縱性付費誘導或廣告機制
  交換遊戲參與或學習成果。
- 文字、插畫、音樂、音效及其他素材 **MUST** 有適當使用權；
  不得直接複製受保護作品內容。
- 目前 MVP 的權限、儲存、部署與資料保留方式
  **以 PRD／Spec 的已核准範圍為準**，不得由憲章推導出特定儲存技術。

**決策底線：** 新能力的便利性不得凌駕兒童隱私、安全或合法使用素材的責任。

### VI. Requirement and Evidence Integrity — 需求與驗證誠信

產品意圖、可觀察行為及驗收結果不得由實作便利性悄悄改寫。

- 未核准的構想 **MUST NOT** 被當作既定功能、驗收義務，
  或要求預先建置的架構能力。
- 對外宣稱的核心行為 **MUST** 有與風險相稱、可追溯的驗證依據；
  不得宣稱未執行的測試、實機試玩或學習成效已通過。
- **MUST NOT** 僅為讓實作通過而弱化有效測試、
  隱藏回歸問題或擅自降低既有驗收標準。
- 本原則不強制 TDD、SOLID、DRY、特定 Coverage 數字、
  模組數量、框架、語言或 Lint 工具；這些由工程設計、
  工作約定及適用的自動化品質門檻管理。

**決策底線：** 可以自由選擇如何實作，但不能捏造已達成的品質，
也不能在未核准下改變「成功」的定義。

## Documentation Boundaries（文件權威與責任邊界）

| 文件 | 核心問題 | 權威範圍 |
|---|---|---|
| `PRD.md` | **Why / What** | 為何開發、目標使用者、產品需求、範圍、優先級與產品決策 |
| 本 `constitution.md` | **Principles / Constraints** | 不可妥協的原則及跨階段決策底線 |
| `spec.md` | **Exact Behavior / Acceptance** | 系統如何表現、情境處理與可驗收行為（FR／US／AC／NFR／NFR-AC 的 SSOT） |
| `docs/technical-design.md`、實作計畫 | **Technical Approach / Implementation Decisions** | 架構選型、模組、依賴與執行方案 |
| `AGENTS.md` | **Agent Workflow / Engineering Practices** | Coding Agent 操作流程、慣例及執行驗證的方式 |

- 本憲章的產品原則源自專案目的，但**不是 PRD 的副本**；
  單回合數量、角色映射、教學次數、雙語呈現及版本平台等已核准細節，
  應由其所屬文件維護。
- **產品目標／範圍／優先級**改變時，先取得產品決策並更新 PRD；
  **可觀察行為／驗收條件**改變時，更新 Spec 並同步必要的下游資料。
  單純使程式符合既有 Spec 的 Bug Fix 或不改變行為的重構，
  不必為了流程形式而改寫 PRD／Spec。
- 不同文件各有權威，**不得假定 PRD、Spec 或 Constitution
  在所有問題上具有一概覆蓋其他文件的優先權**。
  發現實質衝突時，記錄差異、暫停衝突部分的決定，
  交由專案負責人確認後同步修訂相應文件。
- 憲章僅約束決策的**允許範圍**，不授權新功能；
  符合本憲章仍須符合現行 PRD 範圍及 Spec 驗收要求。

## Constitution Gates（依工作階段檢視）

檢查問題應與階段及變更風險相稱，**不代表每個小修正都必須走完整 SDD 流程**：

| 階段 | 應確認的問題 |
|---|---|
| Specify | 新需求是否符合學習、規則、公平、情緒、可及性及隱私底線？是否經產品核准？ |
| Plan | 技術或 UX 方案有否違反原則？是否留下合理的實作選擇空間？ |
| Tasks | 是否規劃足以證明關鍵需求與風險的驗證，而非只建立形式上的任務？ |
| Implement / Review | 實際行為是否符合 Spec？是否有誠實的驗證證據、未掩蓋的回歸或未核准的需求變更？ |

**門檻未通過時：** 說明衝突條款、影響與可選方案，
由專案負責人決定修正需求／方案，或依下述程序正式修訂憲章。
AI Coding Agent 可提出更佳設計或質疑不必要的限制，
但 **MUST NOT** 自行放寬不可妥協的原則或新增產品承諾。

## Governance（治理）

- **效力：** 本文件適用於人類開發者及 AI Coding Agent。
  若某項決策與強制原則衝突，未處理前不得宣告相關交付合格。
- **修訂權限：** 只有經專案負責人明確批准，才能增刪或重新定義原則；
  修訂須記錄原因、風險、對 PRD／Spec／AGENTS／技術設計的影響，
  並同步需調整的文件。技術實作不得自行修改憲章以繞過衝突。
- **版本方式（SemVer）：** MAJOR＝移除或重新定義已批准原則；
  MINOR＝新增原則或實質擴大約束；PATCH＝不改變語義的澄清。
  首次正式納入版本控制前的文字調整，視為初版草案整備。
- **例外：** 個案例外須先記錄理由、風險、替代控制與適用範圍，
  並經專案負責人批准；例外不會自動批准新的產品功能。

**Version: 1.0.0 | Ratified: 2026-11-06 | Last Amended: 2026-11-06**
