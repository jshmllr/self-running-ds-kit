---
name: adopt
description: Adopt the self-running design system kit in a repository. Use when a team wants to set up the contract-anchored workflow (required gate, fast lane, shared toolkit, component contracts) or says "adopt the kit", "set up the gate", "install the design system kit", "install the self-running kit".
---

# Adopt the kit

Walk a repository through `setup/ADOPT.md`, one milestone at a time. You fill templates and
open PRs; a person makes every decision and applies every admin step.

## Step 1: find the kit and read the entry points

Locate the kit folder (the plugin root, or a `self-running-ds-kit/` checkout). Read
`README.md`, `setup/ADOPT.md`, `docs/architecture.md` and `docs/milestones/0-gate.md`. Do
not read milestones 2 to 5 yet; they are not part of this run. Check the repository against
`setup/ADOPT.md` § Starting checklist. Anything missing becomes its own PR, planned before
the gate.

## Step 2: ask the decisions and the placeholders, in one round

Present `setup/ADOPT.md` § 1 (decisions) with the origin's answer as the recommendation,
and § 2 (only the placeholders the current milestone uses) with an example each; apply
§ Small-team defaults where they fit. Fill defaults you can read from the repo (package
name, default branch, Node version, setup and install commands, the four commands from the
manifest's scripts) and show them for confirmation instead of asking. Run
`gh api users/<owner> --jq .type`: `Organization` means the queue ruleset; `User` means the
gate-only ruleset and the personal-account steps in `docs/milestones/0-gate.md`. Wait for the answers. Write the
values file to `.claude/plans/kit-values.env` and a plan with a `State:` line to
`.claude/plans/kit-adoption.md`.

## Step 3: fill and place the templates

Copy `templates/` to a scratch directory, keep only the milestone 0 files listed in
`setup/ADOPT.md` § 3, and run
`scripts/fill-placeholders.sh .claude/plans/kit-values.env <scratch-dir> --milestone-0`.
Then merge the result into the repository. Where a file already exists (`CLAUDE.md`,
`AGENTS.md`, `CODEOWNERS`, a validation workflow, `.prettierignore`), merge the kit's
sections in and keep everything else. Where a kit rule conflicts with an existing one, list
both in the plan and ask the person which wins. A (stack) placeholder section is replaced by the repository's own rules or the adapter's.
Delete every KIT NOTE. Leave `FIRST_CONTRACT_PATH` as a visible placeholder until milestone 1 fills it.

Install the stack adapter per `adapters/<stack>/README.md`. Copy the toolkit skills and
`THIRD-PARTY-NOTICES.md` into `.claude/skills/`.

## Step 4: open the milestone 0 PRs

Three PRs, each with What / Why / If we don't do it / In plain words: toolkit, fast lane,
gate. The gate PR's description ends with the admin runbook from
`docs/milestones/0-gate.md`, with the values filled in. Run the gate's three proofs (green,
red, skipped) and paste the run links into the PR. Hand the admin steps to the person.

## Step 5: milestone 1

After the person confirms the gate is required, follow `docs/milestones/1-contract.md`
§ Repo steps: one small component, verify the three surfaces, write the contract, open the
contract PR, then the rules PR. Use the `contract-review` skill to check your own contract
before opening the PR. Then replace `{{FIRST_CONTRACT_PATH}}` in `CLAUDE.md` with the
contract's path and run `scripts/fill-placeholders.sh --check` on the files you placed; it
must report nothing.

## Completion

Every row of `setup/proof-run.md` § Target is reached, or the plan file lists the row and
what blocks it. Then set the plan's `State:` to done and tell the person which approvals
each PR waits on. Never merge, enable auto-merge, or edit host rules yourself.

Before closing, list what is still ahead: for each of milestones 2 to 5, the kit pieces to
install and the "You build" pieces the team writes itself, as named in each milestone doc.
Say plainly that the kit is not finished at milestone 1: a milestone is done only when its
"You build" pieces exist and their proofs pass.
