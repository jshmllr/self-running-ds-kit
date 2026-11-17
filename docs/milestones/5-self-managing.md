# Milestone 5 of 6: Self-managing

**Status in the kit:** Early release: the fresh-repository proof run (`setup/proof-run.md`)
has not been done yet. Triage and the usage report are built, with dry runs proven on
GitHub. Distribution is still designed only. The kit carries the triage workflow and the
usage report workflow. **You build** the usage scanner the report runs; this document says
what it must do.

**Depends on:** milestone 1 (contracts are what gets distributed to consumers) and the
loops of milestones 2 to 4 (triage and the usage report are most useful once those produce
signal). Milestone 0's labels and pull request format are what triage checks for.

## Goal

The backlog and consumer usage stay visible without anyone curating them by hand. A triage
helper proposes labels, duplicates and pickup prompts on issues and never closes one. A
read-only usage report shows how the consumer apps actually use the package. Contracts
reach the consumer apps and their agents where they work.

## In plain words

Today nobody sees how the apps that use the design system actually use it, and the list of
requests is tidied by hand when someone has time. This milestone adds helpers for both. One
reads each new request, suggests labels, points out likely duplicates and drafts a prompt
someone could hand to an agent; a person confirms. One reads the apps' code every week and
reports which building blocks they use, where they restyle them from outside, and which
outdated ones they still use. It changes nothing in those apps, because other teams own
them. A person decides what becomes work.

## What it adds

### In the kit

| Piece | Kit file | What it does |
| --- | --- | --- |
| **Triage proposals** (agent) | `templates/.github/workflows/triage-proposals.yml` | When an issue is opened or reopened, posts one comment with suggested labels (only labels that exist), possible duplicates, which of What / Why / If we don't do it are missing, and a draft pickup prompt, and adds the `triage-proposal` label. Weekly, posts a digest on issue `{{ROADMAP_ISSUE}}`. It never closes or edits an issue. Without a credential nothing is posted. |
| **Usage report** | `templates/.github/workflows/usage-report.yml` | Weekly, shallow-clones `{{CONSUMER_REPOS}}`, deletes their history, runs the usage scanner and posts its report on issue `{{ROADMAP_ISSUE}}`. Without `CONSUMER_READ_TOKEN`, or until the scanner exists, it prints a notice and passes. |

### You build

This one is part of the milestone, not an extra. It reads your consumers' code, so it is
custom code for your stack. It needs only a read token.

- **Usage scanner.** A script that reads app source, skipping tests, stories and build
  output, and reports for each app: the package version it pins, how many files import the
  package, the most-used components with how many distinct props each uses, every
  `className` or style override on a package component with example locations, deprecated
  exports still in use, and local components that look like copies of package ones. It
  writes one Markdown report. It reads only; it tracks nothing at runtime. Build prompt:
  [Usage scanner](#usage-scanner).

Still designed, not built anywhere: **distribution**, an agent-readable route that lets
consumer apps and their assistants read each component's contract, such as a committed MCP
configuration or an `llms.txt` built from the component manifest.

## Setup

### Admin steps

1. Create the label `triage-proposal`.
2. Create `CONSUMER_READ_TOKEN`: read access to `{{CONSUMER_REPOS}}` and nothing else.
3. Agree with the owning teams of `{{CONSUMER_APPS}}` that the report is read-only and that
   upgrades stay their decision.

### Repo steps

1. Copy `triage-proposals.yml` and run its dry run on the five newest issues.
2. Build the usage scanner at `tooling/usage/scan.ts`, or change the workflow to call yours.
3. Copy `usage-report.yml` and post the first report.

## Proof

- **Triage:** a dry run on five recent issues produces correct suggestions and closes
  nothing.
- **Usage report:** the first report is posted on the roadmap issue and names at least one
  override or deprecated use that the owning team confirms is real.

At the origin both dry runs pass, and the first real report was posted.

## Gotchas that apply

`docs/gotchas.md` items 34, 36 to 38.

- Consumer repos belong to other teams. A report is welcome; an unasked-for pull request is
  not.
- A triage helper that closes issues, even obvious duplicates, loses trust the first time
  it is wrong.
- Reports can be long. Cut the posted comment and point to the full report as an artifact.

## Decisions it needs

- **Usage report scope.** Which consumer repos, how often, and which signals become a
  proposed request. The origin runs weekly over every consumer app.
- **Distribution route.** A committed MCP configuration, an `llms.txt`, or both, generated
  from the same component manifest so they cannot drift.

## Pickup prompt

### Install the kit's pieces

```text
You are picking up milestone 5 of 6 (Self-managing) for {{DS_NAME}}.
Read docs/architecture.md and docs/milestones/5-self-managing.md in the kit first, and the rule: nothing here closes an issue or opens anything in another team's repository.
Goal: install triage-proposals.yml and usage-report.yml with placeholders filled, create the triage-proposal label, and run the triage dry run.
Constraints: follow AGENTS.md and CLAUDE.md. New branch off {{DEFAULT_BRANCH}}.
Done when: the triage dry run on five recent issues writes correct suggestions to the job summary and closes nothing.
Out of scope: building the usage scanner, and distribution.

First step: present a plan in chat and wait for approval before changing anything.
```

### Usage scanner

```text
You are building the usage scanner for {{DS_NAME}}, milestone 5 of 6.
Read docs/milestones/5-self-managing.md § You build first.
Goal: a script run as `node tooling/usage/scan.ts <app paths> --out usage-report.md` that reads each app's source, skipping tests, stories and build output, and reports: the pinned version of {{PACKAGE}}, files scanned and files importing it, the most-used components with distinct props per component, className or style overrides on package components with example locations, deprecated exports still used, and local components whose names or shapes match package components. Read the package's own public exports to know what counts.
Constraints: read-only; no network beyond what the workflow already cloned; no runtime tracking. Unit tests per signal with one file that has it and one that does not.
Done when: run over one consumer app, the report names at least one real override or deprecated use the owning team confirms.
Out of scope: opening pull requests or issues in consumer repos, and distribution.

First step: present a plan in chat and wait for approval before changing anything.
```
