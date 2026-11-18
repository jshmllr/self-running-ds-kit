# Milestone 4 of 6: Self-learning

**Status in the kit:** Built. The guidance check passes on real project guidance, and the
evidence digest and backfill dry runs pass on GitHub. The guidance evals are proven on
fixed examples only, not yet with a live model. The kit carries the guidance check, the
evidence digest and the backfill workflow. **You build** the guidance evals; this document
says what they must do.

**Depends on:** milestone 1 (contracts are the form a backfill draft fills in) and
milestone 2 (review comments are the evidence the loop learns from).

## Goal

Rules improve by measurement. The guidance stays consistent; evidence from reviews proposes
a change; evals test whether the change helps; a person accepts or rejects. Existing
components get a drafted contract when someone asks, and the draft counts as unreviewed
until an engineer signs it off against intent.

## In plain words

Today, when the same mistake keeps appearing in review, someone has to notice the pattern
and write a new house rule by hand, and nobody checks whether the rules contradict each
other or whether they work. This milestone adds four helpers. One checks the written rules
on every change for broken links, the same rule written twice, and rules with no stated
reason. One collects the week's review comments and suggests rule changes. One gives an AI
assistant practice tasks with only the rules to go on and scores what it writes, so you can
see whether a rule change helped. One drafts a written promise for an existing component
from its code, marked unreviewed until an engineer checks it against what the component is
meant to do. A person decides every change to the rules.

## What it adds

### In the kit

| Piece | Kit files | What it does |
| --- | --- | --- |
| **Guidance check** | `templates/tooling/guidance/`, job `guidance-check` in `templates/.github/workflows/pr-gate.yml` | On pull requests that touch guidance files, fails on a broken link or anchor and on a `rule/<id>` defined twice or nowhere, and warns on a changed rule with no `Source:` line and on a long sentence repeated in two files. Problems the change did not touch are notices. Skills listed in `THIRD-PARTY-NOTICES.md` get no `Source:` or duplicate warnings. No model. |
| **Evidence digest** | `templates/tooling/evidence/`, `templates/.github/workflows/evidence-digest.yml` | Weekly, collects bot review comments on pull requests merged in the last seven days, groups them by file, by cited rule and by reviewer, and posts one comment on issue `{{ROADMAP_ISSUE}}`. With a Claude credential it adds up to five proposed rule changes, each with its pattern, rule, change and source. It edits nothing. |
| **Backfill contract** (agent) | `templates/.github/workflows/backfill-contract.yml`, `templates/.github/templates/backfill-contract-pr.md` | A person starts it and names one component. The agent drafts the contract from the component's types, code, tests and stories, with Status `Draft, not reviewed`, and opens a draft pull request labelled `unreviewed-contract`. Components that already have a Status line are skipped. |

`templates/tooling/README.md` says how to run the two tools and their tests.

### You build

This one is part of the milestone, not an extra. Its graders read your code, so it is
custom code for your stack. A run costs model usage, so runs are started by a person.

- **Guidance evals.** A set of practice tasks, each taken from a real mistake a person
  found in review, an audit or a decision record, never an invented one. An AI assistant in
  an empty folder gets one task and may read only your consumer-facing rules page. Fixed
  graders, not a model, then check what it wrote against named checks such as "no
  hard-coded colours" or "uses the right component", and name the first file and line that
  fails. A report gives the pass rate per check and per task with a confidence interval,
  and warns when the baseline is so high that the tasks cannot show an improvement. Pull
  requests that touch the evals grade committed pass and fail examples with no model call.
  Build prompt: [Guidance evals](#guidance-evals).

The constitution's rule stays: automation collects evidence and proposes. No agent edits
`SKILL.md`, `references/`, or `decisions/` to "capture a learning" without a person.

## Setup

### Admin steps

1. Create the labels `unreviewed-contract` and `roadmap`, and open the roadmap issue whose
   number becomes `{{ROADMAP_ISSUE}}`.
2. Decide who signs off backfill drafts: the same `{{APPROVER_TEAM}}` approval that covers
   contracts, with the extra duty of checking intent rather than code.

### Repo steps

1. Copy `templates/tooling/` and add the `guidance:check` script line from its README.
   Run the check once over the whole guidance and fix what it finds before the job goes in.
2. Mark each rule you want checked as `rule/<id>`: a heading, or a bold or code
   `rule/<id>` at the start of the paragraph that defines it. Refer to it elsewhere by id.
3. Copy `evidence-digest.yml` and `backfill-contract.yml` and the backfill pull request
   template; fill `{{ROADMAP_ISSUE}}` and `{{SAMPLE_COMPONENT}}`.
4. Build the guidance evals.

## Proof

- **Guidance check:** a pull request that adds a broken anchor fails; one that defines a
  rule id twice fails; the whole guidance passes with no errors.
- **Evidence digest:** a dry run writes the grouped digest to the job summary.
- **Backfill:** three drafted contracts exist, each marked `Draft, not reviewed` until an
  engineer signs it off, and at least one was corrected during sign-off.
- **Evals:** the pass example passes every check and the fail example fails every check; one
  proposed rule change is measured before and after and accepted or rejected by a person.

## Gotchas that apply

`docs/gotchas.md` items 34 to 38 and 41 to 43.

- A contract drafted from code locks in current behaviour, bugs included. The Status line
  and the label exist so nobody mistakes a draft for an agreed contract.
- Evals need a stable scorer. Fixed graders keep before and after comparable; a model as
  judge does not.

## Decisions it needs

- **What counts as evidence.** The kit counts bot review comments and the contract
  review's summaries. Add people's review comments if you want them counted.
- **Which guidance the evals test first.** The kit starts with the consumer-facing rules
  page, because it is what other teams' assistants read.
- **Backfill order.** Components with audit findings first, then the most-used components
  according to the usage report.

## Pickup prompt

### Install the kit's pieces

```text
You are picking up milestone 4 of 6 (Self-learning) for {{DS_NAME}}.
Read docs/architecture.md and docs/milestones/4-self-learning.md in the kit first, and the rule: automation collects evidence and proposes; a person accepts every change to the guidance.
Goal: install templates/tooling/ (guidance check and evidence digest), the guidance-check job, evidence-digest.yml, backfill-contract.yml and its pull request template, with placeholders filled. Run the guidance check over the whole guidance and list what it finds before fixing anything.
Constraints: follow AGENTS.md and CLAUDE.md. New branch off {{DEFAULT_BRANCH}}. No agent edits SKILL.md, references/ or decisions/.
Done when: the guidance check passes with no errors, the digest dry run writes its summary, and a backfill dry run on {{SAMPLE_COMPONENT}} writes a draft contract.
Out of scope: building the evals, and {{OUT_OF_LOOP_PACKAGES}}.

First step: present a plan in chat and wait for approval before changing anything.
```

### Guidance evals

```text
You are building the guidance evals for {{DS_NAME}}, milestone 4 of 6.
Read docs/milestones/4-self-learning.md § You build first.
Goal: (a) eval cases, one Markdown file each with frontmatter (id matching the file name, source linking the real review comment, issue or decision record it came from, title, and a list of check ids) and a short task; start with ten cases from real findings. (b) A runner that gives a headless agent one case in a fresh folder, with only the consumer-facing rules page, no project settings, no other tools beyond reading and writing files, and a turn and time limit, then saves what it wrote. (c) Fixed graders, one per check id, that parse the code and name the first file and line that fails; output with no code fails every check. (d) A report with the pass rate per check and per case, a 95% Wilson interval, a warning when the baseline is above 95%, and the cases that fail every run. (e) A workflow: pull requests that touch the evals grade committed pass and fail examples with no model call; real runs start only by hand.
Constraints: graders are deterministic, never a model. Never invent a case. The evals never edit guidance.
Done when: the pass example passes every check, the fail example fails every check, and one real run produces a report.
Out of scope: changing the guidance based on the results; that is a person's pull request.

First step: present a plan in chat and wait for approval before changing anything.
```
