---
name: code-review
description: "Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \"review since X\"."
---

Two-axis review of a committed diff or the user's uncommitted work:

- **Standards**: does the code conform to this repo's documented coding standards?
- **Spec**: does the code faithfully implement the originating issue / spec?

Both axes run as **parallel sub-agents** so they don't pollute each other's context, then this skill aggregates their findings. Start every sub-agent with a fresh context window.

## Language

For this repository, write review finding titles and explanatory prose (including rationale, recommendations, and summaries) primarily in Traditional Chinese (zh-TW), unless the user explicitly requests another language. Keep template labels such as Standards and Spec in English. Technical terms such as controller, reducer, and callback may remain in English, including in diagrams. Preserve code identifiers, commands, paths, requirement IDs, official names, and original quotations; prioritize natural, readable explanations over translating every term. Include this language instruction in each reviewer sub-agent's prompt and follow it when aggregating the reports.

The issue tracker should have been provided to you. If not, tell the user to run `/setup-matt-pocock-skills`.

## Process

### 1. Pin the review scope

Choose the mode from the user's request:

- **Committed changes** (branch, PR, or "since X"): resolve the base and target to commit SHAs with `git rev-parse <ref>^{commit}`. The target defaults to `HEAD`; when the user names the branch to review, that branch is the target, not the base. Infer the base from an established PR or session context; ask if it remains ambiguous. Capture `git diff <base-sha>...<target-sha>` and `git log <base-sha>..<target-sha> --oneline`.
- **WIP / uncommitted changes**: pin `HEAD` to a commit SHA. Capture staged changes with `git diff --cached <head-sha>` and unstaged changes with `git diff`. Enumerate non-ignored untracked files with `git ls-files --others --exclude-standard -z`, then capture their contents as new files. Keep the staged and unstaged layers distinct: comparing only `HEAD` to the working tree can hide staged edits that were subsequently undone in the working tree. A WIP-only review needs no other base and has no commits to list.
- **Committed changes plus WIP**: capture both scopes above, labelling the committed, staged, unstaged and untracked layers separately. Do not silently add WIP to a committed-only review.

Before dispatch, save one shared review snapshot outside the repository: resolved SHAs, capture commands, commit list where applicable, patches, file manifest, and captured file contents needed for context (including untracked files). Use index versions for staged context and working-tree versions for unstaged context. Preserve paths and binary files; report any content that cannot be inspected. Capture without changing the user's index or creating a commit or stash. Verify the selected refs and commands succeeded, and check that HEAD, the index and selected files did not change during capture; recapture if they did.

Check emptiness across the entire selected scope. An empty committed patch must not stop a WIP review with staged, unstaged or untracked changes. If every selected layer is empty, report no changes to review and stop before spawning reviewers.

### 2. Identify the spec source

Look for the originating spec, in this order:

1. Issue references in the commit messages (`#123`, `Closes #45`, GitLab `!67`, etc.), fetched via the workflow in the tracker doc.
2. A path the user passed as an argument.
3. A spec file under `docs/`, `specs/`, or `.scratch/` matching the branch name or feature.
4. If nothing is found, ask the user where the spec is. If they say there isn't one, the **Spec** sub-agent will skip and report "no spec available".

### 3. Identify the standards sources

Search the repo for every file that documents how code should be written. When `CODING_STANDARDS.md` or `CONTRIBUTING.md` exists, it must be on the list.

On top of whatever the repo documents, the Standards axis always carries the **smell baseline** below: a fixed set of Fowler code smells (_Refactoring_, ch.3) that applies even when a repo documents nothing. Two rules bind it:

- **The repo overrides.** A documented repo standard always wins; where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Like any standard here, skip anything tooling already enforces.

#### Duplication and principle priority

Distinguish **implementation duplication** from **semantic duplication** before proposing DRY or refactoring findings:

- **Implementation duplication**: similar syntax, control flow, or code shape serving independent domain rules or responsibilities that may change separately. Similarity alone is insufficient evidence for a DRY or refactoring recommendation; keep independent concepts separate.
- **Semantic duplication**: the same domain knowledge, rule, invariant, or decision has multiple authoritative implementations that must change together for the same reason, even when their code looks different. Establish this from the approved spec, domain responsibilities, callers, tests, or change history; do not infer it solely from matching code.
- For confirmed semantic duplication, evaluate a proportionate refactoring that gives the shared knowledge one authoritative representation. Prefer a small shared function, data definition, or owning module that preserves behavior and responsibility boundaries. Explain the duplicated rule, affected locations, evidence that they must change together, drift risk, and the proposed scope and tradeoffs. When evidence is insufficient, state the uncertainty rather than report a confirmed DRY finding.
- **DRY takes priority over KISS and YAGNI when these principles conflict over confirmed semantic duplication.** Do not dismiss an evidenced shared-rule problem solely because keeping copies looks simpler or extraction adds an abstraction. Use KISS and YAGNI to choose the smallest sufficient refactoring, without speculative extension points. Priority does not turn every DRY finding into a blocker; severity follows demonstrated impact and risk, and approved behavior and constitutional constraints remain binding.

Each smell reads *what it is* → *how to fix*; match it against the diff using the duplication criteria above:

- **Mysterious Name**: a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design's murky.
- **Duplicated Code**: confirmed semantic duplication across multiple locations, whether or not the code has the same shape. → evaluate consolidating the shared knowledge under the duplication criteria above.
- **Feature Envy**: a method that reaches into another object's data more than its own. → move the method onto the data it envies.
- **Data Clumps**: the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession**: a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches**: recurring `switch`/`if` cascades encode the same decision rule in multiple places. → apply the duplication criteria above; if semantic duplication is confirmed, evaluate one shared decision function or map, using polymorphism only when existing responsibilities justify it. Switching on the same type for independent decisions is insufficient evidence.
- **Shotgun Surgery**: one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Divergent Change**: one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Speculative Generality**: abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Message Chains**: long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man**: a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Refused Bequest**: a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.

### 4. Spawn both sub-agents in parallel

Read [model routing](../implement/references/model-routing.md). Explicitly select
its reviewer model and effort for each axis, including any risk-based escalation.
Keep the main agent's current settings for aggregation. Reviewers report findings
without editing the reviewed files.

Issue both sub-agent calls together, in the foreground, and aggregate the reports they return. Both reviewers use the same saved snapshot from step 1 rather than rerunning capture commands against the live working tree. If live content is needed, verify it still matches the snapshot; changed content requires a new snapshot and review of the affected scope.

**Standards sub-agent prompt** should include:

- The review mode and shared snapshot path from step 1, including capture commands and the commit list where applicable.
- The list of standards-source files you found in step 3, **plus the smell baseline and Duplication and principle priority criteria from step 3** pasted in full (the sub-agent has no other access to them).
- The brief: "Report, per file/hunk where relevant, (a) every place the diff violates a documented standard: cite the standard (file + the rule); and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls: documented-standard breaches can be hard, but baseline smells are always judgement calls, and a documented repo standard overrides the baseline. Skip anything tooling enforces. Under 400 words."

**Spec sub-agent prompt** should include:

- The same review mode and shared snapshot path supplied to the Standards reviewer.
- The path or fetched contents of the spec.
- The brief: "Report: (a) requirements the spec asked for that are missing or partial; (b) behaviour in the diff that wasn't asked for (scope creep); (c) requirements that look implemented but where the implementation looks wrong. Quote the spec line for each finding. Under 400 words."

If the spec is missing, skip the Spec sub-agent and note this in the final report.

### 5. Aggregate

Present the two reports under `## Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge or rerank findings, because the two axes are deliberately separate (see _Why two axes_).

End with a one-line summary: total findings per axis, and the worst issue _within each axis_ (if any). Don't pick a single winner across axes: that's the reranking the separation exists to prevent.

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every standard but implements the wrong thing → **Standards pass, Spec fail.**
- Code that does exactly what the issue asked but breaks the project's conventions → **Spec pass, Standards fail.**

Reporting them separately stops one axis from masking the other.
