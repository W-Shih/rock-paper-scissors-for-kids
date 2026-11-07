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
6. Code and tests implement and verify the approved spec; they must not silently redefine it.

## Change control

- For a product goal, MVP scope or priority change: update PRD decision first, then reconcile Spec and technical design/plan.
- For behavior clarification within approved scope: update Spec first, then adjust design, implementation plan, code and tests.
- For internal engineering choices that do not affect observable requirements: update technical design/plan as appropriate without rewriting PRD or Spec.
- When documents disagree, raise the discrepancy and reconcile both authorities instead of automatically treating one document as globally superior.
- Never promote PRD §5.3 ideas to committed requirements without explicit product approval.
- Preserve existing FR / US / AC / NFR / NFR-AC IDs unless an explicit migration is approved; maintain traceability.
- Do not duplicate normative detailed requirements across documents; use links to canonical sections.
- Existing tests are evidence of expected behavior. Carefully investigate any proposed test modification; never modify tests merely to make a failing implementation pass.
- Prioritize simple, maintainable and testable solutions (KISS / YAGNI) without speculative infrastructure.
- Document unverified assumptions; do not claim a prototype or real-device acceptance has passed without evidence.

## Development workflow

Check Constitution principles -> review PRD scope -> read relevant Spec FR/US/AC/NFR -> review Technical Design -> update Implementation Plan -> implement -> test -> record validation evidence. User-facing Chinese and English content must follow the Spec.
