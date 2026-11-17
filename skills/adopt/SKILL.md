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
not read milestones 2 to 5 yet; they are not part of this run.

## Step 2: ask the decisions and the placeholders, in one round

Present `setup/ADOPT.md` § 1 (decisions) with the origin's answer as the recommendation,
and § 2 (placeholders) with an example each. Fill defaults you can read from the repo
(package name, default branch, package manager, the four commands from the manifest's
scripts) and show them for confirmation instead of asking. Run
`gh api users/<owner> --jq .type`: `Organization` means the queue ruleset; `User` means the
gate-only ruleset and the personal-account steps in `docs/milestones/0-gate.md`. Wait for the answers. Write the
values file to `.claude/plans/kit-values.env` and a plan with a `State:` line to
`.claude/plans/kit-adoption.md`.

## Step 3: fill and place the templates

Run `scripts/fill-placeholders.sh .claude/plans/kit-values.env <scratch-dir>` on a copy of
`templates/`, then move the result into the repository. Where a file already exists
(`CLAUDE.md`, `AGENTS.md`, a validation workflow, `.prettierignore`), merge the kit's
sections in rather than overwriting; the (core) sections go in whole, and a (stack)
placeholder section is replaced by the repository's own rules or the adapter's. Delete every
KIT NOTE. Leave `FIRST_CONTRACT_PATH` as a visible placeholder until milestone 1 fills it.

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
before opening the PR.

## Completion

Every row of `setup/proof-run.md` § Target is reached, or the plan file lists the row and
what blocks it. Then set the plan's `State:` to done and tell the person which approvals
each PR waits on. Never merge, enable auto-merge, or edit host rules yourself.

Before closing, list what is still ahead: for each of milestones 2 to 5, the kit pieces to
install and the "You build" pieces the team writes itself, as named in each milestone doc.
Say plainly that the kit is not finished at milestone 1: a milestone is done only when its
"You build" pieces exist and their proofs pass.
