# Milestone 2 of 6: Stronger verify

**Status in the kit:** Early release: the fresh-repository proof run (`setup/proof-run.md`)
has not been done yet. Built, with dry runs proven on GitHub. The kit carries the contract
review workflow and the gate wiring. **You build** the contract checker and the visual
check; this document says what each must do.

**Depends on:** milestone 0 (the gate, so a new check can block a merge) and milestone 1
(the contract, so there is something to check a change against).

## Goal

Catch what human reviewers catch by hand today, so review spends its time on correctness
and judgement: a check that every contract is complete and every promise has its proof, a
picture of every component in both themes, and an agent that reads the contract and posts
findings as a second opinion. The reviewer still owns correctness. Green checks show that
the assertions pass, not that they are the right assertions.

## In plain words

Today a reviewer looks at every change and spots small mistakes the computer could have
spotted: a border that disappeared in dark mode, a promise in a component's description
that the code no longer keeps. This milestone adds three helpers. One checks that every
component's written promise is filled in and that each promise points at a real test. One
takes a picture of every component in light and dark and flags any picture that changed.
One reads the promise and the change and leaves notes where they disagree. None of them
approves anything. A person still reviews and approves every change; they start with
better evidence.

## What it adds

### In the kit

| Piece | Kit file | What it does |
| --- | --- | --- |
| **Contract review** (agent) | `templates/.github/workflows/contract-review.yml` | On a ready pull request that touches `{{COMPONENT_DIR}}`, reads the contract rules and the diff and posts inline comments it is at least 80% sure of, plus one summary. It never approves or requests changes. Without a Claude credential it prints a notice and passes. |
| **Gate wiring** | `templates/.github/workflows/pr-gate.yml`, job `contract-check` | Runs the contract checker on pull requests that touch components, and is in the gate's `needs` list so it can block. Until the checker exists, the job prints a notice and passes. |

### You build

These two are part of the milestone, not extras. Each is custom code for your stack, which
is why the kit describes them instead of shipping them. Neither needs a paid service. The
React + Storybook adapter says how the first team built them.

- **Contract checker.** A script that reads the contract of each component a change
  touches and fails when the form is incomplete: a missing section of the blank form, no
  Status line, a promise with no proof, or a proof that names a test or story that does not
  exist. It calls no model. It does not judge whether a promise is right; the approver
  does that when they sign the Status line. Without it, a contract is a document nobody
  checks. Build prompt: [Contract checker](#contract-checker).
- **Visual check.** On every pull request that touches components, take a picture of each
  component's main examples in light and dark, compare each with an approved picture
  committed to the repo, and fail on a difference. On a failure, upload the differences
  and push the new pictures to a side branch, so a person can look at old against new and
  commit the new ones if the change was intended. It reports only, outside the gate, until
  it has run clean for a few weeks. Build prompt: [Visual check](#visual-check).

Scope: UI components under `{{COMPONENT_DIR}}` only. `{{OUT_OF_LOOP_PACKAGES}}` keep their
own review process; their contract is semantics, which a picture cannot see.

## Setup

### Admin steps

1. Add `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` as a repository secret for the
   contract review. Without it the review skips and everything else runs.
2. Once the visual check has run clean on `{{DEFAULT_BRANCH}}` for a few weeks, add its job
   to the gate's `needs` list. Until then it reports and does not block.

### Repo steps

1. Copy `contract-review.yml` and fill its placeholders.
2. Build the contract checker at `tooling/contract/check.ts`, or change the
   `contract-check` job to call yours. The job starts checking as soon as the file exists.
3. Build the visual check and add its job where `pr-gate.yml` marks the place.
4. For each rule turned into a lint check, keep the rule in its one home and add a
   `Check:` line that names the lint rule, so prose and check cannot drift apart.

## Proof

- **Contract checker:** a pull request that deletes one section of a contract, or renames
  the test a promise names, goes red. Restoring it goes green.
- **Visual check:** a branch that reintroduces a known visual bug goes red in the theme
  where the bug shows. A branch with no visual change stays green.
- **Contract review:** a test pull request that breaks one promise gets a comment pointing
  at it. With the credential removed, the workflow passes with a notice.
- **Nothing approves.** The required approval still comes from `{{APPROVER_TEAM}}`.

At the origin: the contract checker passes on the first contract and runs on GitHub; the
visual check was proven locally on every component example in both themes; the contract
review's dry run passes.

## Gotchas that apply

`docs/gotchas.md` items 34 to 40.

- A visual check that is always red teaches people to ignore red. Keep it report-only until
  it is stable.
- Both themes must be covered before it blocks. A component that passes in light and breaks
  in dark is the common case.
- A second-opinion agent cannot be the named person who approves.

## Decisions it needs

- **Visual-diff tool.** The origin chose the test runner's built-in screenshot comparison,
  run inside the existing component test setup, with no paid service. Adopt it, or choose a
  hosted service if reviewing pictures becomes the bottleneck.
- **What runs the agents.** The origin chose Claude Code in GitHub Actions, pinned to a
  commit, proposal-only.

## Pickup prompt

### Install the kit's pieces

```text
You are picking up milestone 2 of 6 (Stronger verify) for {{DS_NAME}}.
Read docs/architecture.md and docs/milestones/2-verify.md in the kit first.
Goal: install templates/.github/workflows/contract-review.yml with its placeholders filled, and confirm the contract-check job in the gate workflow is in the gate's needs list.
Constraints: follow AGENTS.md and CLAUDE.md. New branch off {{DEFAULT_BRANCH}}. The agent never approves or requests changes.
Done when: a test pull request that breaks one promise gets a review comment, and the workflow passes with a notice when the credential is removed.
Out of scope: building the contract checker or the visual check.

First step: present a plan in chat and wait for approval before changing anything.
```

### Contract checker

```text
You are building the contract checker for {{DS_NAME}}, milestone 2 of 6.
Read CLAUDE.md § Component contract first: it defines the blank form, the Status line and the rule that every promise names one proof.
Goal: a script at tooling/contract/check.ts, run as `node tooling/contract/check.ts --base <ref>`, that finds the components a change touches under {{COMPONENT_DIR}} (everything since the merge base, plus untracked files), reads each one's contract from {{CONTRACT_HOME}}, and reports: a missing section of the form, a missing or malformed Status line, a promise with no proof, and a proof that names a test or story that does not exist. Print GitHub annotations and a job summary under Actions, a plain list otherwise. Exit 1 on any error.
Constraints: no model calls and, if possible, no dependencies beyond the runtime, so CI runs it without installing anything. It checks the form, never whether a promise is right. Unit tests with one passing and one failing contract for every rule.
Done when: the first approved contract passes; deleting one section, or renaming a named test, fails with an annotation on the right line.
Out of scope: judging the contract's content, and {{OUT_OF_LOOP_PACKAGES}}.

First step: present a plan in chat and wait for approval before changing anything.
```

### Visual check

```text
You are building the visual check for {{DS_NAME}}, milestone 2 of 6.
Read docs/milestones/2-verify.md § You build first.
Goal: on pull requests that touch {{COMPONENT_DIR}} or the {{DOCS_SURFACE}} config, take a picture of each component's main examples (start with the default and the accessibility example) in light and dark, compare each with a reference picture committed to the repo, and fail on a difference. On a failure, upload the differences as an artifact and push the new pictures to a side branch; add a command a person runs to fetch them, look at old against new, and commit the ones that were intended.
Constraints: use the screenshot comparison built into the test runner the repo already uses before considering a paid service. Make reference pictures on the same operating system the CI runner uses. The job reports only; it does not join the gate's needs list in this change.
Done when: a branch that reintroduces one known visual bug fails in the theme where it shows, and a branch with no visual change passes.
Out of scope: making the check required, and {{OUT_OF_LOOP_PACKAGES}}.

First step: present a plan in chat and wait for approval before changing anything.
```
