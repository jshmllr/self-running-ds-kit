# How {{DS_NAME}} runs itself, and where people decide

This is the map of the automation around {{DS_NAME}}: what runs, when, what it reads and
writes, what it needs, and the point at which a named person decides. It is written for the
people who have to approve the automation, so it favours plain words over detail; each row
names the file that is the source of truth.

The whole system follows one rule: **people decide, helpers suggest.** Nothing here merges a
pull request, publishes a release, rolls one back, closes an issue, quarantines a test or
changes the guidance on its own.

<!-- KIT NOTE: delete rows for pieces you have not installed, and delete this note. Keep
the table honest: a row describes what is running today, not what is planned. -->

## The loop

A change moves through the same stages whether a person or an agent does the typing.

| Stage    | What happens                                                       | What holds it to account                                                              |
| -------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Intent   | Someone opens an issue                                             | Triage proposals: labels, duplicates, a pickup prompt                                  |
| Clarify  | Open questions become a checklist on the issue                     | A contract line that starts `Open:` names what is undecided                            |
| Contract | The component's {{CONTRACT_HOME}} says what it promises            | `CLAUDE.md` § Component contract; the contract check; a person signs the Status line   |
| Build    | A person, with local agents, writes the code                       | `CLAUDE.md`, `AGENTS.md` and the product-design skill                                  |
| Verify   | The host runs the checks on the pull request                       | `{{GATE_CHECK_NAME}}`: lint, typecheck, tests, contract check, guidance check, visual check |
| Review   | Agents post findings; a person approves                            | The approver owns correctness; agents never approve                                   |
| Release  | The publish workflows version and publish from `{{DEFAULT_BRANCH}}` | The release suggestion drafts the size and the change record; a person confirms it    |
| Observe  | A weekly read-only report of how {{CONSUMER_APPS}} use the package | Posted on the roadmap issue; a person decides what becomes work                        |

Four loops sit on top of the stages. **Self-healing:** a red run on `{{DEFAULT_BRANCH}}`
arrives with a diagnosis and a proposed fix. **Self-learning:** review findings are gathered
into a weekly digest with proposed guidance changes, and an eval measures whether guidance
changes help. **Self-managing:** triage proposals and the usage report keep the backlog and
consumer usage visible. **Backfill:** existing components get a drafted contract that stays
marked unreviewed until an engineer checks it against intent.

**Scope.** Contracts, the visual check, the contract review and backfill apply to the UI
components under `{{COMPONENT_DIR}}` only. {{OUT_OF_LOOP_PACKAGES}} keep their own
engineer-reviewed process; their contract is semantics, which a screenshot cannot see.

## Every automated piece

"Agent" means a step that runs Claude Code inside GitHub Actions
(`anthropics/claude-code-action`, pinned to a commit). Every agent step is optional: without a
credential the workflow prints a notice and the plain steps still run. Each job declares the
least permissions it needs.

| Piece | Runs when | Reads | Writes | Needs | A person decides |
| --- | --- | --- | --- | --- | --- |
| **Gate** (`.github/workflows/pr-gate.yml`, job `{{GATE_CHECK_NAME}}`) | Every pull request and merge-queue run | The results of the other jobs | One pass or fail | An admin to make it required | Whether to merge; the gate only blocks red |
| **Fast lane** (`CLAUDE.md` § Fast lane) | A pull request that changes only docs or user-visible copy | | | | Every check and the approval still apply; only the plan is skipped |
| **Guidance check** (`tooling/guidance/`, job `guidance-check`) | Pull requests that touch guidance files | The guidance files | Annotations and a job summary | | Which rule to keep; the check only reports broken links, rule ids defined twice or nowhere, missing `Source:` lines and duplicated sentences |
| **Contract check** (`tooling/contract/`, job `contract-check`) | Pull requests that touch `{{COMPONENT_DIR}}` | The contracts and the tests and stories they name | Annotations and a job summary | | The approver signs the Status line; the check only verifies the form and that every proof exists |
| **Visual check** (job `visual-check`) | Pull requests that touch components or the docs surface | Each component in light and dark, against committed reference images | A diff artifact and candidate images on a branch | | Whether the new look is right: a person reviews old against new and commits the new references |
| **Release suggestion** (job `release-suggestion`) | Pull requests that touch `{{COMPONENT_DIR}}` | The public API on the pull request and on its base; the contracts | One pull request comment: suggested size, the API diff, a drafted change record | | {{RELEASE_APPROVER}} confirms the size; the publish workflows still own versions |
| **Contract review** (agent, `.github/workflows/contract-review.yml`) | A ready pull request that touches `{{COMPONENT_DIR}}` | The diff, the contracts, the tests and stories | Inline review comments and one summary, as a second opinion | A Claude credential | The reviewer; the agent never approves or requests changes |
| **Fix proposal** (agent, `.github/workflows/fix-proposal.yml`) | {{VALIDATION_WORKFLOW}} or a publish workflow fails on `{{DEFAULT_BRANCH}}` | The failed run's logs, the last green run, the commits between them | One issue labelled `needs-person` and `fix-proposal`, or a comment on the open one | A Claude credential for the diagnosis; the facts are gathered without it | Every fix and every quarantine |
| **Triage proposals** (agent, `.github/workflows/triage-proposals.yml`) | An issue is opened or reopened; weekly digest | The issue, recent issues and labels | One comment and the `triage-proposal` label; a weekly digest on the roadmap issue | A Claude credential | Labels, duplicates and sections; the agent never closes or edits an issue |
| **Backfill contract** (agent, `.github/workflows/backfill-contract.yml`) | A person starts it and names one component | That component's types, code, tests and stories | A branch and a draft pull request labelled `unreviewed-contract`, Status `Draft, not reviewed` | A Claude credential | The signing engineer checks the draft against intent, not against the code |
| **Evidence digest** (`tooling/evidence/`, `.github/workflows/evidence-digest.yml`) | Weekly, and on demand | Bot review comments on pull requests merged in the last seven days | One comment on the roadmap issue; with a credential, up to five proposed rule changes | Optional Claude credential | Which proposals become guidance, through a normal pull request |
| **Usage report** (`.github/workflows/usage-report.yml`) | Weekly, and on demand | Shallow clones of {{CONSUMER_APPS}}, deleted after the scan | One comment on the roadmap issue: pinned version, component counts, overrides, deprecated APIs | A read token for those repositories | What, if anything, becomes work; nothing is opened in those apps |
| **Guidance evals** | A person starts a run; pull requests that touch them grade fixed examples | The consumer rules page, the eval cases, what the agent under test writes | A report with pass rates and confidence intervals | A Claude credential | Whether a guidance change helped; the eval never edits guidance |

## What never happens

- No workflow merges, turns on auto-merge, or pushes to `{{DEFAULT_BRANCH}}`.
- No workflow publishes, cancels or rolls back a release. No canary or automatic rollback.
- No agent approves or requests changes on a pull request.
- No agent closes, reopens or rewrites an issue; triage adds one label and one comment.
- No agent edits `CLAUDE.md`, `AGENTS.md`, a skill or a decision record. Guidance changes
  arrive as proposals a person turns into a normal pull request.
- No code is written into {{CONSUMER_APPS}}, and nothing tracks their users at runtime.
- The only branches automation pushes are the visual check's candidate images (reviewed
  before they are committed) and the backfill branch (a draft pull request a person asked for).

## Data handling

- **With a Claude credential**, an agent step sends its prompt and whatever it reads to
  Anthropic's API: the diff, the files it opens, workflow logs, issue text. Every agent step
  lists the tools it may use, and none may push, comment or edit beyond its row above.
  **Without a credential nothing leaves GitHub**; the plain steps still run.
- **Consumer code** is cloned shallowly onto the runner, its history is removed, and only
  names and counts are posted.
- **GitHub tokens** are the job-scoped `GITHUB_TOKEN`, with write access to contents only on
  the visual check (candidate images) and the backfill (its own branch).
- **Secrets:** `CLAUDE_CODE_OAUTH_TOKEN` or `ANTHROPIC_API_KEY` for the agent steps,
  `CONSUMER_READ_TOKEN` for the usage report. The Claude Code action is pinned to a commit,
  not a tag.

## Switching a piece off

Remove the Claude credential and every agent step skips with a notice. Delete a workflow file
and that piece stops. None of the checks blocks anything until an admin makes
`{{GATE_CHECK_NAME}}` required, so until then all of them are advisory.

## Decisions taken as assumptions

Record here the choices you made while adopting, so an approver can overrule any of them in
one place.

| Decision | Assumption | Who can change it |
| --- | --- | --- |
| Who makes the gate required | | An organisation owner or repository admin |
| Where a contract lives | {{CONTRACT_HOME}} | Settled in milestone 1 |
| What runs the agents | Claude Code in Actions, pinned, proposal-only | |
| Visual diff tool | The test runner's built-in screenshot comparison; no paid service | |
| Fast lane | Docs and user-visible copy only | |
| Release approver and change record | {{RELEASE_APPROVER}}; the release suggestion drafts the change record on the pull request | |
