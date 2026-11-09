---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

Read [model routing](references/model-routing.md) before dispatch. The main agent
coordinates the workflow using its current settings; explicitly delegate the
implementation to a fresh implementer using that policy.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask.

Have the implementer call the Skill tool with "tdd" where possible, at pre-agreed seams.

Have the implementer run typechecking regularly and single test files regularly.
Run the full test suite once at the end of implementation.

Once done, call the Skill tool with "code-review" to review the work.
Have an implementer address confirmed, in-scope defects under the model routing
policy, then verify and re-review the affected changes before committing.

Commit your work to the current branch.
