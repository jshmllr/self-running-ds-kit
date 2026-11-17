# Adopting the kit

The kit is a set of files and a set of steps. The files go into your repository; the steps
split into what an admin does on the host and what a contributor does in a PR. Each step
names what proves it worked. Work milestone by milestone; milestone 0 before anything else.

The `adopt` skill (`skills/adopt/SKILL.md`) walks an agent through this file, asks the
placeholder questions, and fills the templates.

Check `README.md` § Workflow requirements first: a personal or organisation-owned repository, one
admin, GitHub Actions, Claude Code (or another agent that reads `SKILL.md` files), Node.js, `gh`.

## Starting checklist

The kit does not scaffold a library. Before milestone 0, have these in place. A new library
builds them in their own PRs first; an existing one points at what it already has.

- One UI component with a behavioural test and a docs page.
- A package manifest, a committed lockfile and a supported Node version.
- Lint, typecheck, build and test commands, plus one combined validation command, all
  passing locally. A required gate on a red baseline blocks everyone.
- The package output consumers will use; for a typed library, public types that build.
- An admin who can apply rules, and a second person if you want approved contracts.

An existing library keeps its tools and jobs. Note which existing job covers each check
rather than adding a duplicate.

### Small-team defaults and later settings

Milestones 0 and 1 are a good place to pause: a real gate, shared guidance and one
contract. Install each later piece with its milestone.

- **`ORG`**: your username on a personal account.
- **`APPROVER_TEAM`**: the reviewer's team or handle, or `none`. With `none`, omit the kit's
  CODEOWNERS entry and reword "the approver team" in the adopted guidance. Preserve any
  existing ownership file and its rules; remove only the unused template from the scratch copy.
- **Working alone.** GitHub will not let you approve your own PR, so your first contract
  stays `Draft, not reviewed` and milestone 1's approval proofs are recorded as not
  reached. Everything else in milestones 0 and 1 can be proven.
- **`CONSUMER_APPS`, `OUT_OF_LOOP_PACKAGES`**: `none` if you have none.
- **Not publishing yet**: `RELEASE_APPROVER=repository owner`, `RELEASE_BOT_ACTOR=none`, and
  delete the deploy-key entry from the ruleset's bypass list. Manual releases: name the
  person and delete the bypass too. A bypass exists only for a real release actor.
- **`ROADMAP_ISSUE`, `CONSUMER_REPOS`, `PUBLISH_WORKFLOWS`, `SAMPLE_COMPONENT`**: leave them
  out of the values file until you install the workflows that use them.

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

Every template uses `{{NAME}}` placeholders. Fill the scratch copy (§ 3) with:

```bash
sh ../self-running-ds-kit/scripts/fill-placeholders.sh <values-file> <scratch-dir> --milestone-0
```

The values file is one `KEY=value` per line, with no quotes or variable expansion. The
script fails if any placeholder is left, except `FIRST_CONTRACT_PATH`, which
`--milestone-0` lets wait until milestone 1. Once the first contract exists, replace
`{{FIRST_CONTRACT_PATH}}` in your `CLAUDE.md` with its path and confirm nothing is left:

```bash
sh ../self-running-ds-kit/scripts/fill-placeholders.sh --check \
  CLAUDE.md AGENTS.md .github/workflows/pr-gate.yml \
  .claude/settings.json .claude/commands/validate.md \
  .claude/hooks/load-planning-skill.js .claude/skills/product-design/SKILL.md \
  docs/automation-map.md
```

`--check` only reports; it edits nothing. Pass the exact configuration files you adopted,
not entire repository or skill directories. Omit paths you did not install; add the selected
ruleset, CODEOWNERS (if adopted), and any adopted review instructions to the list. Copied
toolkit skills and other instructional examples are not configuration to fill. In an
existing project, check the merged files you changed rather than unrelated guidance.

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
| `NODE_VERSION`             | Node version your library supports, for the gate jobs     | `24`                        |
| `PACKAGE_MANAGER_SETUP_CMD` | Installs your pinned package-manager version in each gate job | `corepack enable`        |
| `INSTALL_CMD`              | Install that refuses to change the lockfile               | `pnpm install --frozen-lockfile` |
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

Work in a scratch copy, never over your repository: copy `templates/` (hidden folders
included) to a temporary directory, keep only the current milestone's files, fill them,
then review and merge them in. Where a file already exists, merge the kit's sections into
it and keep everything else. Where a kit rule conflicts with one of yours, the team's
policy owner picks one, and the winner lives in one place. Existing branch protections
stay; the admin checks the combined result.

For milestone 0, keep these and remove the rest. The six helper workflows,
`.github/templates/` and `tooling/` arrive with their milestones.

- `CLAUDE.md`, `AGENTS.md`, `.prettierignore`, `.claude/settings.json`,
  `.claude/hooks/`, `.claude/commands/` and `.claude/skills/product-design/`.
- `.github/workflows/pr-gate.yml`, the selected `.github/rulesets/` file, `.github/CODEOWNERS`,
  `.github/labels.json` and `.github/pull_request_template.md`.
- `.github/copilot-instructions.md` and `.github/instructions/` if you use Copilot.
- `docs/automation-map.md`, trimmed to the gate, toolkit and fast lane.

Copy `skills/*` and `THIRD-PARTY-NOTICES.md` from the kit separately. Where adopted guidance
mentions automation from a later milestone, mark it as not installed yet.

Then, per file:

| File                                                         | Do                                                                                            |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `CLAUDE.md`                                                  | Keep the (core) sections, once any conflict is settled. Replace every (stack) section with your rules. Fill each `Source:`. Delete the KIT NOTEs. If you already have a CLAUDE.md, paste the core sections in. |
| `AGENTS.md`                                                  | Fill the hard stops from your stack adapter. Keep the routing table pointing at one home per rule. |
| `.github/workflows/pr-gate.yml`                              | Replace the run steps with your commands, or copy the four gate pieces into your existing workflow. |
| `.github/rulesets/`                                          | Keep one file: `default-branch-gate-and-queue.json` for an organisation, `default-branch-gate-only.json` for a personal account. Delete the other. |
| `.github/CODEOWNERS`                                         | Organisation route, or a personal account with a named approver. Put the kit's line first in an existing file, then verify the effective owners: later matching entries override it. With `APPROVER_TEAM=none`, omit only the kit entry; preserve existing ownership rules. |
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

### CI setup before enabling the gate

Each gate job starts on a fresh runner, so it sets up Node, the package manager and the
dependencies itself:

- **`NODE_VERSION`**: a version your library supports. The contract and guidance jobs pin
  Node 24 on their own, and the milestone 4 tooling needs 22.18 or later.
- **`PACKAGE_MANAGER_SETUP_CMD`**: installs the version your project already pins in
  `packageManager`. pnpm or Yarn: `corepack enable` (Node 24 ships Corepack; on later Node,
  `npm install --global corepack && corepack enable`). npm with the version Node ships:
  `npm --version`, which only confirms npm is there.
- **`INSTALL_CMD`**: `npm ci`, `pnpm install --frozen-lockfile` or `yarn install --immutable`.

Private registries are set up with repository secrets, never in the values file. Adjust the
path filters to your folders. Without workspace packages, delete the workspace-package job
and its entry in the gate's `needs`; with them, replace its placeholder `echo` with real
checks.

## 4. Admin steps (host settings)

Milestone 0: `docs/milestones/0-gate.md` § Admin steps (rules, merge queue, code owners,
bypass for the release actor, labels). Milestone 1: the `contract` label. Later milestones list their own.

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
