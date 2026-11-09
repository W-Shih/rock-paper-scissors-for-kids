# Model routing for implementation and review

Apply these defaults when the calling workflow delegates work. Explicit user
model choices take precedence. Keep the main agent's current model and reasoning
effort; it owns task scoping, coordination, evidence assessment and delivery.

## Implementers

Delegate implementation and confirmed review fixes to a fresh-context subagent
with `model = "gpt-6-luna"` and `reasoning_effort = "medium"`.
For cross-module state changes, difficult diagnosis or substantial refactoring,
select `gpt-6.1-sol` / `medium` before dispatch. If an implementer repeatedly
fails to resolve the same confirmed defect, reassess requirements and test
evidence, then hand the bounded task to a fresh Sol / medium implementer rather
than repeating the same attempt.

Pass the approved scope, applicable AGENTS instructions, spec / ticket pointers,
workspace or worktree, file ownership and expected verification. The implementer
does the assigned work directly and reports changed files, checks and remaining
uncertainties. The parent runs the workflow's review and delivery steps; the
implementer should not recursively invoke the coordinating implementation skill.

## Standards and Spec reviewers

Spawn each axis independently with fresh context, `model = "gpt-6.1-sol"` and
`reasoning_effort = "medium"`. Follow `code-review` for the shared snapshot,
axis-specific prompts and aggregation. Reviewers inspect and report; implementers
own fixes. Use Sol / `high` for an affected axis when concurrency, data
compatibility, privacy or child-experience risks need deeper analysis. A reviewer
that discovers such a risk can request a fresh high-effort pass on the same
snapshot; record the reason and retain the other axis's valid coverage.

## Dispatch and availability

Set model and effort explicitly in the subagent tool arguments, using fresh
context (for example, `fork_turns = "none"` where supported). Prompt text alone
does not select a model. Exploration and merger helpers inherit the parent
settings unless the user specifies otherwise. Custom agent files are optional;
if used, ensure their model / effort settings agree with the intended dispatch.

If delegation or a requested model / effort is unavailable, report the limitation
and the actual fallback used. Continue authorized implementation with an available
agent when adequate; disclose any loss of review independence and apply the
calling workflow's verification and delivery gates. Include selected role/model/
effort settings and any escalation or fallback in the outcome report.
