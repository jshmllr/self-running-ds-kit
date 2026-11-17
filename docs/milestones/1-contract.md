# Milestone 1 of 6: Agree the contract

**Status in the kit:** Built. The first contract (on a small label component) and the
written rules exist at the origin system as draft PRs, reviewed by an engineering reviewer
and an independent agent, waiting on the approver team. The form, the proof rule, the
`Open:` marking, the Status-flip procedure and the review checklist below are the result of
that review; nothing here is untested on a real component.

## Goal

One contract format, proven once on a real component, with written rules so the next
contract comes out the same shape.

## In plain words

Each building block gets a short written promise of what it does, kept in one place in the
code where both people and the apps that use it can read it. The promise has the same
seven headings every time, a line saying whether it has been approved and by whom, and one
named automatic test behind every claim. Changing a promise always needs a person's
sign-off, even if only the words change. The automatic reviewer gets a checklist so it can
point out a missing test or an unapproved change.

## What it adds

| Piece                                  | Kit files                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------- |
| The rules                              | `templates/CLAUDE.md` § Component contract (blank form, six rules, Source line)    |
| The fast-lane exception                | `templates/CLAUDE.md` § Fast lane: changing a promise always needs sign-off        |
| Routing                                | `templates/AGENTS.md` row "What does this component promise…"                     |
| The review checklist                   | `templates/.github/instructions/component-contract.instructions.md` (seven checks) |
| Agent-side checklist                   | `skills/contract-review/SKILL.md` (applies the same seven checks; writes a contract from the form) |
| Where it lives in each stack           | `adapters/react-storybook/README.md`; `docs/adapters.md` for other stacks          |
| Label                                  | `contract` in `templates/.github/labels.json`                                      |

## Setup

### Admin steps

1. Create the `contract` label.
2. Confirm the branch rules' approval behaviour: whether approvals are dismissed when new
   commits land. The Status-flip procedure works either way, but the team should know
   which case they are in.

### Repo steps

1. **Pick one small, stable component** with a good test file as the first contract. Small
   means its contract fits on one screen; stable means no open redesign.
2. **Decide where the contract lives in your stack**, using the adapter: the one text that
   feeds the docs page, the agent-readable manifest and the shipped package. Verify all
   three surfaces show it before writing rules.
3. **Write the first contract** from the blank form. Expect to add or tighten tests: every
   promise must name one existing test title, and the writing exposes promises nothing
   proves. Mark looks and motion as "Visual check only". Mark anything that depends on an
   undecided proposal with `Open:` and plain words. Status line: `Draft, not reviewed`.
4. **Remove any second description field** that would replace the contract on the docs
   page (gotcha 10).
5. **Open it as its own PR**, labelled `contract`, with What / Why / If we don't do it / In
   plain words. The approval from `{{APPROVER_TEAM}}` signs off both the content and the
   code. After approval, one final commit flips only the Status line to
   `Approved by <name> on <date>`, and the approver approves again.
6. **Then write the rules PR**: § Component contract, the fast-lane exception, the AGENTS.md
   row, and the scoped instructions file. If the rules PR and the fast-lane PR edit the same
   section, stack the rules PR on the fast-lane PR. Point the "worked example" line at the
   first contract.
7. Replace `{{FIRST_CONTRACT_PATH}}` in `CLAUDE.md` with the contract's path, then run
   the scoped `scripts/fill-placeholders.sh --check` example in `setup/ADOPT.md` § 2
   on the adopted configuration files only. Exclude copied toolkit instructions and
   unrelated examples; it must report no unresolved configuration placeholders.
   Record the two choices below as decisions with a `Source:` line. Working alone: see
   `setup/ADOPT.md` § Small-team defaults.

## Proof

- The docs page for the component opens with the summary, the Status line and all seven
  headings, above the generated props table and examples.
- The agent-readable manifest for the component contains `#### Proof`.
- The shipped package's type output for the component carries the same text (where the
  stack ships doc comments).
- Each new or tightened test fails when its behaviour is broken on purpose and passes
  with the code restored. Say which ones in the PR.
- The automated review applies the checklist on the next PR that touches a contract.
- A fresh agent, given only the rules, writes a second component's contract in the same
  shape without asking what the headings mean.

## Gotchas that apply

`docs/gotchas.md` items 10 to 20.

## Decisions it needs

The origin settled these; adopt or record otherwise.

- **Where the contract lives:** in the component's own docs source (no new page), because
  that text already reaches the docs page, the agent manifest and the shipped package.
  The alternative, a separate Markdown spec file, is easier for a verifier to read but a
  second place to look and needs its own route to consumers.
- **Who signs off:** one approver from the required team covers both content and
  buildability. Accessibility is proven by machines on the build PRs.
- **Part kinds:** named spot, set of parts, swap what it's drawn as, built in.
- **Acceptance examples:** every promise names its one owning test, of either kind. A
  rule that every promise needs a story-level interaction test would duplicate unit tests.
- **Unbuilt components:** the write-up stays on the GitHub issue in the same form and
  moves into the code with the first build PR. Nothing shows on the docs surface early
  unless someone chooses to.
- **Status flip:** final commit changes only the Status line; the approver approves again.
- **The shipped Proof list** (gotcha 14): keep it, or trim shipped text to summary,
  purpose, keyboard behaviour and examples. Record the choice.

## Pickup prompt

```text
You are picking up milestone 1 of 6 (Agree the contract) for {{DS_NAME}}.
Read docs/architecture.md, docs/milestones/1-contract.md, adapters/react-storybook/README.md
(or docs/adapters.md for another stack) in the kit first, then CLAUDE.md and AGENTS.md in
the repository.

Context: a component's contract is spread across types, doc comments, stories and prose,
and nothing says which text the apps see. Scope is UI components under {{COMPONENT_DIR}};
{{OUT_OF_LOOP_PACKAGES}} keep their own process.
Goal: PR 1 writes the first contract on one small component in its docs source, using the
blank form (Status, Purpose, Parts, States, Keyboard and screen reader, Tokens and motion,
Wording, Proof), every promise naming one test in the component's folder, looks marked
"Visual check only", undecided items marked "Open:" in words with no links, and removes any
second description field that would hide it. PR 2 writes the rules: CLAUDE.md § Component
contract, the fast-lane exception, the AGENTS.md row and .github/instructions/
component-contract.instructions.md.
Read first: the chosen component's source, types, tests and stories; the docs-surface
config; how its docgen picks the comment it shows.
Constraints: follow AGENTS.md hard stops and CLAUDE.md (Code Comments, Test Contract
Quality). The contract ships to consumers, so no PR, issue or ticket pointers inside it.
Promise only what a test proves; add or tighten tests where a promise has none, and show
each new test failing on a deliberate break. Subagents run only scoped lint and typecheck;
the main session runs /validate once per PR. Never merge or mark ready without being told.
Done when: the docs page, the agent manifest and the shipped types all show the contract
with its Status line; the approval flips the Status line by the documented procedure; the
rules PR makes a second contract come out the same shape.
Out of scope: generating code from contracts; contracts for packages outside the loop;
fixing behaviour bugs the contract exposes (file them; the contract states the gap).

First step: present a plan in chat and wait for approval before changing anything.
```
