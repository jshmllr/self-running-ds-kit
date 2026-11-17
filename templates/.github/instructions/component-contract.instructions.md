---
description: 'Review checks for {{DS_NAME}} component contracts'
applyTo: '{{COMPONENT_DIR}}**/*.{ts,tsx,js,jsx,vue,svelte,mdx}'
---

# Component contract review

A component's contract is the text that feeds its documentation page, marked by a
`**Status:**` line. The rules live in
[`CLAUDE.md` § Component contract](../../CLAUDE.md#component-contract-core). This file
lists what to check in review; it adds no rules of its own.

Apply these checks when a diff changes a contract, a test or story whose name a contract's
Proof list quotes, or a stories file's meta:

1. The contract has its parts in order: `**Status:**`, then `#### Purpose`, `#### Parts`,
   `#### States`, `#### Keyboard and screen reader`, `#### Tokens and motion`,
   `#### Wording` and `#### Proof`, then the usage examples.
2. Every Proof line names exactly one test, by its exact title, that exists in the
   component's folder: a test in any test file there, or a story's interaction test. A
   title may wrap across lines. The one "Visual check only" line is the exception: it
   lists what a person checks and names a story where one exists. Flag a new promise with
   no Proof line, and a named test that the diff renames or deletes.
3. When the PR adds, removes or changes a promise, the Status line reads
   `Draft, not reviewed` or `Approved by <name> on <YYYY-MM-DD>`. Flag any other value, and
   a promise change in a contract whose Status line the PR leaves untouched. The approver,
   not this review, checks that `Approved by` came in a final commit of its own.
4. A line that starts with `Open:` says in plain words what is undecided. Flag a PR, issue
   or decision-record number or link inside the contract.
5. Each part is labelled as a _named spot_, a _set of parts_, _swap what it's drawn as_ or
   _built in_.
6. Flag a stories meta that the diff gives a component-level description field that would
   replace the contract on the docs page, or that keeps one while its component has a
   contract.
7. A PR marked for the fast lane changes no promise. A typo fix that leaves every promise
   the same is fine.
