# rock-paper-scissors-for-kids

工地猜拳大賽（Construction Site RPS Adventure）：以工程車與石頭／剪刀／布的規則動畫協助孩子學習猜拳的 Browser-First、Touch-First 遊戲。

## Project documents

| Document | Responsibility |
| --- | --- |
| [constitution.md](constitution.md) | Non-negotiable cross-stage product and delivery principles |
| [PRD.md](PRD.md) | Product intent, goals, MVP scope, priority, risks and future ideas |
| [spec.md](spec.md) | **Canonical Specification SSOT** — FR / US / AC / NFR / NFR-AC and detailed observable behavior |
| [docs/technical-design.md](docs/technical-design.md) | Proposed engineering architecture and technical tradeoffs |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Execution order, dependencies, tasks and verification |
| [AGENTS.md](AGENTS.md) | Agent instructions, authority boundaries and change control |

**Documentation rule:** Changes to product scope start in PRD; changes to approved observable behavior start in Spec; implementation must meet both, without duplicating normative requirements.

**Current status:** Documentation ready for prototype; completion and real-device acceptance are not yet verified.

## Continuous integration

[CI](.github/workflows/ci.yml) runs on pull requests, pushes to `main`, or manually
from GitHub Actions. It installs locked dependencies and runs typecheck, lint,
unit/DOM tests, production build, and Chromium/WebKit E2E. Failed browser runs
upload HTML reports and traces for 7 days. Local commands and validation limits
are in [the development guide](docs/development.md). Real-device Safari and
parent/child acceptance remain separate checks.
