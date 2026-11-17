# Adopting the kit

The kit is a set of files and a set of steps. The files go into your repository; the steps
split into what an admin does on the host and what a contributor does in a PR. Each step
names what proves it worked. Work milestone by milestone; milestone 0 before anything else.

The `adopt` skill (`skills/adopt/SKILL.md`) walks an agent through this file, asks the
placeholder questions, and fills the templates.

Check `README.md` § Prerequisites first: an organisation-owned repository, one admin, GitHub
Actions, Claude Code (or another agent that reads `SKILL.md` files), Node.js, `gh`.

## 1. Decide these first

Write each answer down where your team keeps decisions. Several later rules need a
`Source:` line pointing at one of them.

| Decision                                                                 | The origin's answer (adopt or replace)                                                        |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| **Who holds admin** for the default branch's rules, and by which route    | Org owner edits the org ruleset, or a repo admin layers a repository ruleset. Personal account: the owner, repository ruleset only, no merge queue |
| **Where the contract lives**                                             | In the component's own docs source; no new page                                                |
| **What runs agents on the host** (fixer, verifier, triage)                | Claude Code in GitHub Actions, pinned to a commit, proposal-only; every agent step skips without a credential |
| **Which visual-diff tool** (milestone 2)                                  | The test runner's built-in screenshot comparison inside the component test setup; no paid service |
| **Fast-lane criteria**                                                   | Docs and user-visible copy only; dependency bumps get full review; versions never in feature PRs |
| **Who approves a release or rollback**, and what the change record holds  | The pull request's approver; the release suggestion drafts the change record on the pull request |
| **Which packages are outside the contract loop**                         | Those whose contract is semantics, not look and behaviour                                      |
| **Who may add rules, and where**                                         | Only the product-design skill adds rules beyond AGENTS.md § Hard stops; everything carries a `Source:` |

## 2. Fill the placeholders

Every template uses `{{NAME}}` placeholders. Fill them with
`scripts/fill-placeholders.sh <values-file> <target-dir>`; it fails if any placeholder is
left. The values file is `KEY=value` per line.

| Placeholder                | Meaning                                                   | Example                     |
| -------------------------- | --------------------------------------------------------- | --------------------------- |
| `DS_NAME`                  | Design system name                                        | Acme Design System          |
| `PACKAGE`                  | Published package name                                    | `@acme/design-system`       |
| `ORG` / `REPO`             | Host owner (organisation or username) and repository      | `acme` / `design-system`    |
| `DEFAULT_BRANCH`           | Default branch                                            | `main`                      |
| `APPROVER_TEAM`            | Team whose approval the branch rules require              | `acme/platform-ui`          |
| `RELEASE_APPROVER`         | Named role that approves a release or rollback            | Platform lead               |
| `RELEASE_BOT_ACTOR`        | Actor that pushes version bumps; needs a rules bypass     | Deploy key                  |
| `CONSUMER_APPS`            | Apps that install the package                             | Billing Console, Field App  |
| `COMPONENT_DIR`            | Folder of UI components the contract loop covers           | `src/`                      |
| `OUT_OF_LOOP_PACKAGES`     | Packages outside the loop, or "none"                      | `packages/rules-engine`     |
| `CONTRACT_HOME`            | Where a contract lives in your stack                      | the JSDoc on the exported component |
| `FIRST_CONTRACT_PATH`      | Path of the first approved contract (fill after milestone 1) | `src/primitives/Tag/Tag.tsx` |
| `PLANNING_SKILL`           | Skill the planning hook loads                             | `vercel-react-best-practices` |
| `PACKAGE_MANAGER`          | Package manager                                           | `pnpm`                      |
| `VALIDATE_CMD`             | One command that runs the right checks for a change       | `pnpm run validate`         |
| `LINT_CMD` / `TYPECHECK_CMD` / `BUILD_CMD` / `TEST_CMD` | The four basic commands            | `pnpm run lint` …           |
| `DOCS_SURFACE`             | Where component docs render                               | Storybook                   |
| `TOKENS_PATH`              | Design-token source file(s)                               | `src/styles/_tokens.scss`   |
| `GATE_CHECK_NAME`          | The one required status check                             | `PR gate`                   |
| `VALIDATION_WORKFLOW`      | The CI workflow that runs the checks                      | `PR Validation`             |
| `ROADMAP_ISSUE`            | Issue number where digests and reports are posted (milestones 4 and 5) | `42`           |
| `CONSUMER_REPOS`           | Consumer repositories the usage report clones, space-separated | `acme/billing acme/field` |
| `PUBLISH_WORKFLOWS`        | Names of the publish workflows the fix proposal watches   | `"Publish package"`         |
| `SAMPLE_COMPONENT`         | Component folder the backfill dry run drafts a contract for | `src/primitives/Badge`    |

`{{COMPONENT_NAME}}` in `.github/templates/backfill-contract-pr.md` is not an adoption
placeholder: the backfill workflow fills it on every run. The fill script leaves it alone.

## 3. Repo steps (contributor PRs)

Copy `templates/` over your repository root, then edit:

| File                                                         | Do                                                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                                  | Keep the (core) sections as they are. Replace every (stack) section with your rules. Fill each `Source:`. Delete the KIT NOTEs. If you already have a CLAUDE.md, paste the core sections in. |
| `AGENTS.md`                                                  | Fill the hard stops from your stack adapter. Keep the routing table pointing at one home per rule. |
| `.github/workflows/pr-gate.yml`                              | Replace the run steps with your commands, or copy the four gate pieces into your existing workflow. |
| `.github/rulesets/`                                          | Keep one file: `default-branch-gate-and-queue.json` for an organisation, `default-branch-gate-only.json` for a personal account. Delete the other. |
| `.github/pull_request_template.md`, `copilot-instructions.md`, `instructions/` | As they are; adjust `applyTo` globs to your file types.                    |
| `.claude/settings.json`, `.claude/hooks/`, `.claude/commands/validate.md` | Fill commands; write the Workspace ownership section of `validate.md`.       |
| `.claude/skills/product-design/`                             | Start with one surface you have evidence for; list every gap honestly.                        |
| `.github/workflows/` helper workflows, `.github/templates/`   | Copy each with its milestone, not before. Each milestone doc says which.                     |
| `tooling/`                                                   | Copy with milestone 4. `tooling/README.md` lists the script lines and the runtime it needs.   |
| `docs/automation-map.md`                                     | Keep one row per piece that is running. Show it to whoever approves the automation.           |
| `.claude/skills/` (toolkit)                                  | Copy `skills/*` from the kit, plus `THIRD-PARTY-NOTICES.md`; append `templates/.prettierignore`. |
| Stack adapter                                                | Follow `adapters/<stack>/README.md`.                                                           |

Open these as separate PRs, in this order: toolkit, fast lane, gate, then (milestone 1)
first contract, then rules. Each PR description: What / Why / If we don't do it / In plain
words.

## 4. Admin steps (host settings)

Milestone 0: `docs/milestones/0-gate.md` § Admin steps (rules, merge queue, bypass for the
release actor, labels). Milestone 1: the `contract` label. Later milestones list their own.

## 5. Prove it

Run every proof in the milestone doc before calling the milestone done. Then run the
fresh-repo test in `setup/proof-run.md` once, at the end of milestone 1. Any question the
agent asks that only your team could answer is a hole in the kit's docs: fix the doc.

## 6. Milestones 2 to 5

Each milestone doc splits its pieces into **In the kit** (copy and fill) and **You build**
(custom code for your stack, with a build prompt). Work one milestone at a time: install the
kit's pieces, build yours, run the proofs, then add the new rows to
`docs/automation-map.md`. A milestone is done when every piece in both lists exists and its
proof has passed.
