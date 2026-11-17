---
name: contract-review
description: Review or write a component contract. Use when a diff touches a contract (a doc comment with a Status line and a Proof list), a test or story a Proof line names, or changes what a component promises; or when the user asks to write a contract for a component.
---

# Contract review

A component's **contract** is what it promises the apps that use it. The rules live in the
repository's `CLAUDE.md` § Component contract. The seven review checks live in
`.github/instructions/component-contract.instructions.md`, so Copilot and this skill read
the same list. Read both before anything else; this skill adds no rules of its own.

## Resolve the mode first

- **review**: a diff, PR or file to check. Read-only. You change nothing.
- **write**: a component needs a contract, or a change to one. You edit the doc comment on
  the exported component and nothing else unless the user widens the scope.

Say which mode you resolved.

## Review mode

1. Collect the changed files. Include any test or story whose title a Proof line quotes,
   and any stories meta the diff touches.
2. Apply every one of the seven checks to the diff, in order. Skip none; a check that finds
   nothing is reported as "no finding".
3. For each finding, give the check number, `file:line`, the quoted text, and what would
   satisfy the check. Keep opinions out, or label them as opinion.
4. Confirm the Status line is in one of its two allowed forms, and that a changed promise
   came with a Status line reset to `Draft, not reviewed`.

Report the findings as a numbered list grouped by check. A review with zero findings says so
and lists the checks it ran.

## Write mode

1. Open the exported component (for a compound component, the `Object.assign(...)` export)
   and the component's folder.
2. Walk the blank form in order: the summary sentence, then `**Status:** Draft, not
   reviewed`, then `#### Purpose`, `#### Parts`, `#### States`, `#### Keyboard and screen
   reader`, `#### Tokens and motion`, `#### Wording`, `#### Proof`, then the `@example`
   blocks.
3. Label every part with one of the four kinds: named spot, set of parts, swap what it's
   drawn as, built in.
4. For every promise, search the component's folder for the one test whose title proves it:
   a test in any test file there, or a story's `play` test. Quote the title exactly. A
   promise with no test is either dropped, or moved to the one "Visual check only" line
   when only a person can judge it. Promise nothing the code does not do today.
5. Anything that depends on an undecided proposal starts with `Open:` and says in plain
   words what is undecided, with no issue, PR or decision link inside the comment.
6. Leave `parameters.docs.description.component` unset on the stories meta; move any
   existing text into the doc comment.

Finish by running the seven review checks against your own result, and list any check you
could not satisfy and why.
