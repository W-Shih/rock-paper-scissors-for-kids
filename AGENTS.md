# Agent Working Agreement — Construction Site RPS Adventure

> 核心問題：**How should AI coding agents operate in this repository?**（Agent Instructions / Workflow / Governance）
> 核心職責：**定義 Coding Agent 在本專案的工作方式，包括文件權威與讀取順序、變更控制、開發流程、測試與驗證要求，以及交付結果的回報原則。Agent 必須遵守已核准的產品需求與專案憲章，不得自行改寫產品決策或將未承諾的功能納入實作。**

## Documentation authority (SDD / Scheme B)

### Constitution 與 AGENTS.md 的職責邊界

- **Constitution — Principles / Constraints**：定義專案不可違反的核心原則與決策底線，約束產品需求、技術設計、實作及驗收。
- **AGENTS.md — Agent Instructions / Workflow / Governance**：定義 Coding Agent 如何遵守上述原則、使用權威文件、處理變更、修改程式、執行驗證及回報結果。

**權責原則**：`AGENTS.md` 負責指導 Agent 的工作行為，不得重新定義、削弱或覆蓋 `constitution.md` 的核心原則。

### 文件權威與讀取順序

1. `constitution.md` defines cross-stage non-negotiable principles and decision constraints; implementation choices remain flexible within these boundaries.
2. `PRD.md` is the source of product intent: users, goals, scope, priorities, risks, uncommitted ideas and product-level decisions.
3. `spec.md` is the **canonical functional specification SSOT**: FR / US / AC / NFR / NFR-AC definitions, observable behavior, game and UX flows, visual feedback rules and acceptance criteria.
4. `docs/technical-design.md` records proposed architecture, technology choices, data structures and engineering tradeoffs. It is not a source of new product requirements.
5. `docs/implementation-plan.md` records task order, dependencies, validation and execution progress, not new requirements.
6. `docs/glossary.md` is the shared **domain vocabulary reference**, not a second product or acceptance SSOT; use it to disambiguate terms when reading documents and naming code/tests.
7. Code and tests implement and verify the approved spec; they must not silently redefine it.

## Change control

- For a product goal, MVP scope or priority change: update PRD decision first, then reconcile Spec and technical design/plan.
- For behavior clarification within approved scope: update Spec first, then adjust design, implementation plan, code and tests.
- For internal engineering choices that do not affect observable requirements: update technical design/plan as appropriate without rewriting PRD or Spec.
- When documents disagree, raise the discrepancy and reconcile both authorities instead of automatically treating one document as globally superior.
- Never promote PRD §5.3 ideas to committed requirements without explicit product approval.
- Preserve existing FR / US / AC / NFR / NFR-AC IDs unless an explicit migration is approved; maintain traceability.
- Prefer domain terms from `docs/glossary.md` in descriptive variable, function, file and test names; avoid ambiguous synonyms. If a term conflicts with an approved behavior, clarify the authoritative Spec / PRD first and then update the Glossary. Do not treat Glossary wording as a new product requirement.
- Do not duplicate normative detailed requirements across documents; use links to canonical sections.
- Existing tests are evidence of expected behavior. Carefully investigate any proposed test modification; never modify tests merely to make a failing implementation pass.
- Prioritize simple, maintainable and testable solutions (KISS / YAGNI) without speculative infrastructure.
- Document unverified assumptions; do not claim a prototype or real-device acceptance has passed without evidence.

## Engineering Practices

- **Backward compatibility / Breaking Changes**：在 Review、規劃與實作時，優先維持已核准的行為、既有使用者資料及對外介面；先確認變更是否真的會破壞相容性。內部尚未承諾的實作細節可合理重構，不因單純改名或重組模組就視為產品 Breaking Change。
- **必要的不相容變更**：說明受影響情境、理由、替代方案、遷移／回退策略與相關測試；依影響同步更新適用的 `README.md`、`spec.md`、技術設計、使用說明、程式註解及版本資訊。僅在產品行為或正式介面改變時依 Change control 取得相應決策，勿為內部重構不必要地升版。
- **設計品質**：重視可讀性、可維護性、可測試性與適度可擴展性；保持合理的責任分層與依賴方向。依問題需要參考 SOLID、KISS、YAGNI、DRY、LoD，必要時才採用設計模式；它們是判斷工具，**不是必須逐條套用的硬性檢核或抽象化指令**。若原則相互衝突，說明取捨，避免過度設計。
- **隨變更補測試**：新功能、Bug Fix 與具回歸風險的重構，應同步新增／調整與風險相稱的測試，涵蓋主要成功、失敗及邊界路徑；優先補上這次修改所暴露的既有測試缺口，不要求每次變更補齊全部歷史缺口或追求任意 coverage 百分比。
- **修改既有測試需有理由**：先判斷是產品規格正式變更、測試本身錯誤／脆弱，還是實作回歸；需要改動時說明原因及原驗收意義是否仍受保障。**不得只為了讓測試通過而刪除、放寬或改寫有效測試**。
- **驗證誠信**：按變更範圍執行適用的型別檢查、靜態分析、單元／整合／E2E 或實機測試；若環境不允許，明確列出未執行的項目及風險，不得宣稱已通過。

### 持續改善程式碼設計（Iterative Design）

- 在每次實作與 Code Review 時，依變更範圍及風險檢視程式碼結構、模組職責與依賴方向；不要求每次都掃描整個 Codebase。
- 優先維持高內聚、低耦合，以及簡單、穩定的模組介面。
- 運用 KISS、YAGNI，避免為尚未確認的需求預先引入抽象層或設計模式。
- 若觀察到頻繁跨模組修改、重複邏輯或測試難以隔離等具體問題，評估局部 Refactoring 的效益、範圍與替代方案。
- 架構改善須有明確效益，並評估 Breaking Changes、回歸測試與文件同步；若調整實質影響架構決策或 Task，依文件職責更新 `docs/technical-design.md` 或 `docs/implementation-plan.md`。
- 架構檢查工具的發現應視為待評估的改善候選，不得僅為滿足工具建議而執行缺乏實際價值的重構。

## Code Review

- **依風險調整深度**：適用於重要設計、功能、Bug Fix 與重構；小型文件／低風險變更只需相稱的檢查，不強制每次都建立 PR、多名審查者或繁瑣審批流程。
- **Review 重點**：檢查是否符合 Constitution／PRD／Spec、是否引入不必要的 Breaking Changes 或回歸、模組責任與依賴是否清晰、是否過度設計，以及測試與文件是否隨變更更新；有安全、隱私或兒童體驗風險時優先檢視。
- **問題與證據**：區分必須修正的正確性／安全／相容性問題、值得改善的可維護性問題，以及可選建議；重要發現提供具體程式位置、重現方式或測試證據，避免僅以個人風格或設計原則名稱要求改寫。
- **交付與回報**：重大未解問題不可被宣告為已驗收；明確報告變更摘要、測試結果、未驗證事項與已知風險。Review 不得自行降低 Spec 驗收標準；技術取捨依相應文件權責處理。

## Development workflow

Check Constitution principles -> review PRD scope -> read relevant Spec FR/US/AC/NFR -> consult the relevant `docs/glossary.md` terms -> review Technical Design -> update Implementation Plan as needed -> implement -> test -> risk-based Code Review -> record validation evidence. User-facing Chinese and English content must follow the Spec.
