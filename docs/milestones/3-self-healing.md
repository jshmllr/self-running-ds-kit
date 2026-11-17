# Milestone 3 of 6: Self-healing

**Status in the kit:** Built at the origin system, with dry runs proven on GitHub, and
waiting there for its architecture and AI review. The kit carries the fix proposal
workflow. **You build** the release suggestion; this document says what it must do.

**Depends on:** milestone 0 (the gate is what defines "red") and milestone 1 (the contract
is what the release suggestion reads to tell a breaking change from a fix).

## Goal

Red comes with a diagnosis and a proposed fix, and every change comes with a suggested
release size and a drafted change record. **People decide, helpers suggest.** A named
person approves every fix, every quarantine, every release and every rollback. There is no
automatic canary and no automatic rollback.

## In plain words

Today when a test fails on the shared branch, or a release fails, the work stops until
someone notices and digs in. This milestone adds a helper that notices first, works out
what went wrong and where, and writes it up with a suggested fix. A person decides whether
to apply it. A second helper reads each change to the components and suggests whether the
next release is a small fix, a new feature or a breaking change, and drafts the notes. A
named person picks the size. Nothing ships, and nothing is undone, without that person.

## What it adds

### In the kit

| Piece | Kit file | What it does |
| --- | --- | --- |
| **Fix proposal** (agent) | `templates/.github/workflows/fix-proposal.yml` | When `{{VALIDATION_WORKFLOW}}` or a publish workflow fails on `{{DEFAULT_BRANCH}}`, gathers the failed jobs, the last green commit, the commits between and the log tails, then opens one issue labelled `needs-person` and `fix-proposal` with What failed, Suspect commit, Diagnosis, Proposed fix and A person decides. An untouched test that only timed out gets a quarantine proposal instead of a fix. Without a credential the gathered facts become the issue. |

### You build

This one is part of the milestone, not an extra. It reads your package's public types, so
it is custom code for your stack. It needs no paid service.

- **Release suggestion.** On every pull request that touches components, compare what the
  package offers before and after the change (its exports and their types) and the
  contracts it changed. Suggest the size: a removed export or a changed promise is a
  breaking change, a new export is a feature, anything else is a fix. Post one comment
  that shows the suggestion, the difference and a drafted change record, and update that
  same comment on every push. It always passes; it never blocks. `{{RELEASE_APPROVER}}`
  picks the size through whatever release-intent mechanism the publish workflows read.
  Build prompt: [Release suggestion](#release-suggestion).

## Setup

### Admin steps

1. Create the labels `needs-person` and `fix-proposal` (see `templates/.github/labels.json`).
2. Add the Claude credential secret if milestone 2 did not.
3. Name `{{RELEASE_APPROVER}}`.
4. Confirm the release bot's pushes still bypass the branch rules.

### Repo steps

1. Copy `fix-proposal.yml`, fill `{{PUBLISH_WORKFLOWS}}` with the exact names of the
   workflows it should watch, and run its dry run.
2. Build the release suggestion and add its job to `{{VALIDATION_WORKFLOW}}`.

## Proof

- **Fix proposal:** a dry run on a real failed run opens a correct issue with the failing
  command, the suspect commit and a proposed fix. With the credential removed, the issue
  still opens with the facts. Nothing merges.
- **Release suggestion:** a branch that removes a public export gets a comment suggesting a
  breaking change with the difference and a drafted change record. Nothing publishes
  without `{{RELEASE_APPROVER}}`.

At the origin both dry runs pass on GitHub.

## Gotchas that apply

`docs/gotchas.md` items 34, 36 to 38.

- Version-bump commits pushed by the release bot need a bypass of the branch rules.
- A rollback can change behaviour for work in progress in the consumer apps. That is why
  rollback is always a person's call, with a change record.
- Quarantining a flaky test is skipping a test. Keep it a proposal.

## Decisions it needs

- **Who approves a release and a rollback.** The origin chose the pull request's approver,
  with the change record drafted on the pull request. One named role, `{{RELEASE_APPROVER}}`.
- **Where the change record lives.** The pull request comment, the release notes, or a file
  per release. The origin drafts it on the pull request.

## Pickup prompt

### Install the kit's pieces

```text
You are picking up milestone 3 of 6 (Self-healing) for {{DS_NAME}}.
Read docs/architecture.md and docs/milestones/3-self-healing.md in the kit first, and the rule: automation proposes; a named person approves every fix, quarantine, release and rollback.
Goal: install templates/.github/workflows/fix-proposal.yml with {{PUBLISH_WORKFLOWS}} and the other placeholders filled, create its labels, and run its dry run against a real failed run.
Constraints: follow AGENTS.md and CLAUDE.md. New branch off {{DEFAULT_BRANCH}}.
Done when: the dry run writes a correct proposal to the job summary, with and without the credential.
Out of scope: auto-merging fixes, auto-quarantining tests, canaries and rollbacks.

First step: present a plan in chat and wait for approval before changing anything.
```

### Release suggestion

```text
You are building the release suggestion for {{DS_NAME}}, milestone 3 of 6.
Read CLAUDE.md § Component contract and the publish workflows first.
Goal: a script run on pull requests that touch {{COMPONENT_DIR}}. It snapshots the package's public API (every export and its type) on the pull request and on its base, compares them and the changed contracts, and suggests a size: removed export or changed promise means breaking, new export means feature, otherwise fix. It drafts a change record from the merged pull requests since the last release tag. A job posts the result as one pull request comment found by a fixed heading and updated on every push.
Constraints: it always exits 0 and never blocks. It never edits versions; the publish workflows still own them and {{RELEASE_APPROVER}} picks the size. Unit tests for each size rule with conflicting inputs.
Done when: a branch that removes a public export gets a comment suggesting breaking, with the difference and a drafted change record; a branch that changes only a comment suggests fix.
Out of scope: publishing, rollbacks, and changing which version the consumer apps run.

First step: present a plan in chat and wait for approval before changing anything.
```
