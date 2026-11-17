# File inventory, by bucket

Every piece of the kit falls into one of three buckets. The bucket decides how it was
written and how an adopting team treats it.

| Bucket                                  | How it's written                                             | What you do with it                           |
| --------------------------------------- | ------------------------------------------------------------ | --------------------------------------------- |
| **Core**: same for any design system    | Copied almost word for word from a working system            | Use as is; fill the `Source:` lines           |
| **Local**: same idea, local details     | The idea is fixed; names, paths and commands are placeholders | Fill the placeholders                         |
| **Adapter**: depends on tooling         | One stack shipped first; the kit says what another stack swaps | Pick an adapter or write one                  |

Status describes the system the kit came from: **Built** means it exists there; **Proven**
means a named check or run passed there. Neither means this packaged kit has passed in a
fresh repository yet; `setup/proof-run.md` is that test.

## Core

| Kit file                                                          | Milestone | Status  |
| ----------------------------------------------------------------- | --------- | ------- |
| `templates/CLAUDE.md` § Component contract                        | 1         | Built   |
| `templates/CLAUDE.md` § Fast lane                                 | 0         | Built   |
| `templates/CLAUDE.md` § Validation                                | 0         | Proven  |
| `templates/CLAUDE.md` § Test Contract Quality                     | 0         | Proven  |
| `templates/CLAUDE.md` § Pull Request Descriptions (incl. In plain words) | 0  | Proven  |
| `templates/CLAUDE.md` § Code Comments                             | 0         | Proven  |
| `templates/CLAUDE.md` § Code Review Checklist (post results)      | 0         | Built   |
| `templates/CLAUDE.md` § Working Plans, § Changing the guidance    | 0         | Proven  |
| `templates/AGENTS.md` routing table shape and "one home per rule" | 0         | Proven  |
| `templates/.github/pull_request_template.md`                      | 0         | Built   |
| `templates/.github/instructions/component-contract.instructions.md` | 1       | Built   |
| `templates/.github/labels.json` (`fast-lane`, `contract`, `needs-person`, …) | 0 to 5 | Built |
| `templates/.claude/skills/product-design/` (skill shape, rule format, decision authority, gaps file, decision template, exemplar format) | 0 | Proven |
| `skills/grilling`, `tdd`, `diagnosing-bugs`, `codebase-design`, `writing-for-agents` (vendored) | 0 | Built |
| `skills/review-triage`                                            | 0         | Built   |
| `skills/contract-review`                                          | 1         | New in the kit |
| `skills/adopt`                                                    | setup     | New in the kit |
| `docs/architecture.md`, `docs/gotchas.md`, `docs/milestones/*`    | all       | Built; 2 to 5 include pieces you build |
| `templates/docs/automation-map.md` (shape: loop, every piece, what never happens, data, switching off, assumptions) | all | Built |
| `templates/tooling/guidance/` (guidance check) and its tests       | 4         | Built   |
| `templates/tooling/evidence/` (evidence digest) and its tests      | 4         | Built   |
| `docs/proposals/rule-tiers.md`                                    | 2 to 4    | Proposal, not adopted |
| `THIRD-PARTY-NOTICES.md`                                          | 0         | Built   |

## Local

| Kit file                                                          | Placeholders it carries                                              |
| ----------------------------------------------------------------- | -------------------------------------------------------------------- |
| `templates/.github/workflows/pr-gate.yml`                         | `VALIDATION_WORKFLOW`, `GATE_CHECK_NAME`, `DEFAULT_BRANCH`, `COMPONENT_DIR`, the four commands, `NODE_VERSION`, `PACKAGE_MANAGER_SETUP_CMD`, `INSTALL_CMD` |
| `templates/.github/rulesets/default-branch-gate-and-queue.json`   | `DEFAULT_BRANCH`, `GATE_CHECK_NAME`                                  |
| `templates/.github/rulesets/default-branch-gate-only.json`        | `DEFAULT_BRANCH`, `GATE_CHECK_NAME` (personal account, no queue)     |
| `templates/.github/CODEOWNERS`                                    | `APPROVER_TEAM` (names the approver the queue ruleset requires)      |
| `templates/.github/copilot-instructions.md`                       | `DS_NAME`, `PACKAGE`, `DOCS_SURFACE`, `COMPONENT_DIR`, `TOKENS_PATH` |
| `templates/.claude/settings.json`                                 | the four commands, `VALIDATE_CMD`                                    |
| `templates/.claude/commands/validate.md`                          | `VALIDATE_CMD`, the four commands; the Workspace ownership section is yours to write |
| `templates/.claude/hooks/load-planning-skill.js`                  | `PLANNING_SKILL`                                                     |
| `templates/CLAUDE.md` and `templates/AGENTS.md` headers and (stack) sections | `DS_NAME`, `PACKAGE`, `DOCS_SURFACE`, `CONSUMER_APPS`, `COMPONENT_DIR`, `OUT_OF_LOOP_PACKAGES`, `TOKENS_PATH`, `APPROVER_TEAM`, `CONTRACT_HOME`, `FIRST_CONTRACT_PATH` |
| `templates/.github/workflows/contract-review.yml`, `fix-proposal.yml`, `triage-proposals.yml`, `backfill-contract.yml`, `evidence-digest.yml`, `usage-report.yml` | `COMPONENT_DIR`, `CONTRACT_HOME`, `DEFAULT_BRANCH`, `VALIDATION_WORKFLOW`, `PUBLISH_WORKFLOWS`, `ROADMAP_ISSUE`, `CONSUMER_REPOS`, `SAMPLE_COMPONENT`, the commands |
| `templates/.github/templates/backfill-contract-pr.md`             | `COMPONENT_NAME`, filled by the backfill workflow at run time        |
| `templates/docs/automation-map.md`                                | `DS_NAME`, `DEFAULT_BRANCH`, `COMPONENT_DIR`, `CONSUMER_APPS`, `RELEASE_APPROVER`, `GATE_CHECK_NAME`, `CONTRACT_HOME` |
| `setup/ADOPT.md`, `scripts/fill-placeholders.sh`                  | Define and fill the set                                              |

## Adapter

| Kit file                                                          | Stack                                  | What another stack swaps (see `docs/adapters.md`) |
| ----------------------------------------------------------------- | -------------------------------------- | ------------------------------------------------- |
| `adapters/react-storybook/README.md`                              | React 19 + Storybook + GitHub + Claude Code | Where the contract lives and how docgen finds it; the meta-description rule; stack hard stops |
| `adapters/react-storybook/AGENTS.section.md`                      | React                                  | The planning skill and its skip list              |
| `adapters/react-storybook/skills/vercel-react-best-practices/`    | React                                  | Dropped or replaced for Vue/Svelte                |
| `templates/.claude/hooks/load-planning-skill.js` + the hooks block in `settings.json` | Claude Code             | Another runtime's hook mechanism, or none         |
| `templates/.github/copilot-instructions.md`, `instructions/`      | GitHub Copilot                         | The host's review-bot instruction file            |
| `templates/.github/rulesets/*.json`, merge queue settings         | GitHub                                 | The host's branch protection and queue            |
| `skills/*/agents/openai.yaml`                                     | Codex-style runtimes                   | Already present from upstream                     |

## You build

These pieces are part of milestones 2 to 5 but read the adopting team's own code, so the kit
describes them instead of shipping them. Each milestone doc has what it must do, who decides,
the proof, and a build prompt.

| Piece | Milestone | What it reads |
| --- | --- | --- |
| Contract checker | 2 | Contracts in `{{CONTRACT_HOME}}` and the tests and stories they name |
| Visual check | 2 | Rendered components in both themes |
| Release suggestion | 3 | The package's public exports and their types |
| Guidance evals (cases, runner, graders, report) | 4 | What an agent writes, graded against your stack's rules |
| Usage scanner | 5 | Consumer apps' source code |
