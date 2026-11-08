---
name: pr-delivery
description: Deliver the current project branch through a GitHub PR, independent review, fixes and verification, merging low-risk reversible changes and escalating decisions. Use when the user asks to deliver a branch or complete the PR workflow; standalone PR writing or review uses the respective skill.
---

# PR delivery

Coordinate delivery; use [pr](../pr/SKILL.md) for the PR body and
[code-review](../code-review/SKILL.md) for independent Standards / Spec review.
Read both skills before their steps. Keep their templates and review procedures
in those files rather than copying them here.

For an actual delivery request, this workflow includes committing scoped fixes,
pushing the branch, creating or updating the PR, posting results, and merging
eligible low-risk changes. Respect narrower instructions such as "do not merge".
Requests to explain, create or edit this skill do not invoke delivery.

## 1. Establish the delivery scope

Read [AGENTS.md](../../../AGENTS.md), including applicable nested instructions.
Follow its documentation authority, reading order, change control, verification
and reporting rules. Keep `docs/implementation-plan.md` as the Task SSOT.

Inspect Git status, the current branch, remotes and the requested work. Identify
which local changes belong to this delivery; preserve unrelated staged, unstaged
and untracked work. Stage and commit only scoped paths or hunks. If the work is
on `main`, preserve it on a `codex/` work branch before publishing the delivery.
Do not reset branches or rewrite existing commits as a routine setup step.

Verify the GitHub repository and access using the available connector or `gh`.
Use `main` as the base unless the user or repository specifies another base.
Read repository merge rules and available protection / required-check metadata.
If configuration is inaccessible, do not infer that no restrictions exist.
Confirm the proposed diff is nonempty and the repository, base and head are the
intended targets before any remote write. Reuse the matching open PR for that
repository, base and head; resolve an ambiguous target before writing.

## 2. Publish a concrete draft

Apply the risk gate throughout delivery, including effects triggered by pushing
or opening a PR. If publishing itself would cause high-risk or irreversible
effects, prepare the concrete draft locally and complete unaffected checks before
escalating; do not publish first. A draft for discussion does not approve a
disputed product decision or authorize deployment.

Commit scoped delivery work as needed and push the work branch without force.
Create a Draft PR, or update the existing matching PR without reverting its
status unnecessarily. Use `pr` to write its body, reflecting the actual final
scope, change type, evidence, door classification and blast radius. Include a
practical rollback explanation. Update preliminary evidence after verification.
Use the glossary location specified by AGENTS when `pr` says `GLOSSARY.md`.

Provide `code-review` with the verified repository / PR reference, pinned base
and head, canonical specification and relevant task references from AGENTS.
These supply review context even when `docs/agents/` tracker setup is absent;
treat that context as supplied for `code-review` and skip its missing-tracker
setup request in this case. Do not create another tracker or specification as
a delivery prerequisite.

## 3. Review, fix and verify

Run `code-review` against the PR's committed scope using its shared snapshot
and independent reviewers. Use its standards-source discovery; missing optional
standards files do not justify inventing a new standard or stopping delivery.
Separate concrete defects from optional suggestions and unresolved hypotheses.

Have an Implementer fix confirmed, in-scope defects, preserving independent
Reviewer judgment. Use a fresh implementer subagent when delegation is available;
custom agent configuration is not required. Check proposed findings against their
evidence before changing code. Record reasons when a finding is not applicable.
Product decisions and specification conflicts follow the escalation gate below.

Execute verification appropriate to the changes under AGENTS. Inspect actual
repository commands instead of assuming a toolchain exists. For document-only
changes, perform proportional document validation; do not require unrelated
product tests. Record commands, results and material limits.

Commit and push scoped fixes to the same PR branch. Re-review the affected
changes and regression risks on a new snapshot; retain prior review coverage
only for unchanged content. Repeat while there are actionable defects and
meaningful progress. Do not loop on optional suggestions or unchanged failures;
after a genuine unresolved blocker, complete unaffected work and report it.

## 4. Route by risk and evidence

**Merge autonomously only when every condition holds:**

- The change fits the approved scope and documentation authority.
- It is a low-risk two-way door: bounded impact and a practical, adequate
  rollback, with no destructive or difficult-to-reverse consequences.
- Independent review has no unresolved blocking findings, and appropriate
  verification is sufficient for the affected behavior.
- The final remote head is the reviewed and verified commit; changes to the
  base have been assessed, with necessary integration checks repeated.
- Required checks and repository merge / review requirements are satisfied.

Reversibility alone is not evidence of low risk. Assess the actual consequences,
including data compatibility, privacy, child experience and delivery permissions
where affected. A document or skill can change agent authority; do not classify
it as low risk solely because it is text.

**Escalate** product decisions, substantive specification conflicts, high-risk
or one-way changes, and verification gaps that could alter the merge decision.
Present the exact decision, evidence, impact, options and recommendation. Preserve
the PR and do not merge while that decision remains unresolved. Routine technical
choices and missing optional tools are not automatic reasons to ask: use adequate
available alternatives, and report access / environment blockers only when they
cannot be resolved within the authorized scope.

## 5. Publish the outcome and complete delivery

Update the PR body through `pr` and post a final review summary with the reviewed
head and base SHAs, separate Standards / Spec conclusions, fixes, verification,
remaining limitations, risk / rollback assessment and the merge or hold reason.
Link existing evidence instead of duplicating canonical requirements.

For an eligible PR, mark it Ready and merge under the repository's merge policy.
If no policy is specified, prefer a merge commit to retain the delivery boundary.
Recheck remote head, base and required checks immediately before merging; bind
the operation to the reviewed head when supported. If either ref changes, assess
and refresh the affected review / verification before proceeding. If the selected
method is unavailable, follow an allowed repository policy or report the blocker.
Never force-push, bypass protections, change protection rules, or substitute the
AI summary for a required approval. Do not queue an automatic future merge while
an unresolved decision or verification gap remains.

Observe the actual merge result. Report the PR URL, merged / held status, merge
commit when applicable, verification summary and only the decisions or blockers
still requiring the user. An accepted merge request or queued operation alone
does not establish that the PR was merged.
