# Milestone 0 of 6: Make the gate real

**Status in the kit:** Built. All three pieces exist at the origin system with evidence,
and are waiting on the approver team. The gate's red, green and skipped cases are proven on
real runs; the merge-queue path is reasoned, not run, until a queue exists.

## Goal

Nothing red lands on the default branch, and every contributor's agent runs the same
toolkit.

## In plain words

Today a change can go into the shared code even when its automatic tests failed, because
the only hard rule is one person's approval. This milestone adds one final pass/fail result
to every change that sums up all the tests, and asks an admin to make that result required.
It also writes down which tiny changes (documentation and on-screen wording) may skip the
planning steps, and it saves the AI assistant's helpers in the repository so everyone's
assistant works the same way. Three pieces, each cheap, and everything later assumes they
are in place.

## What it adds

| Piece              | Kit files                                                                                          |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| **The gate**       | `templates/.github/workflows/pr-gate.yml`, `templates/.github/rulesets/default-branch-gate-and-queue.json` (organisation) or `default-branch-gate-only.json` (personal account) |
| **The fast lane**  | `templates/CLAUDE.md` § Fast lane, `templates/.github/pull_request_template.md` checkbox, the `fast-lane` label in `templates/.github/labels.json`, the AGENTS.md routing row |
| **The toolkit**    | `skills/` (grilling, tdd, diagnosing-bugs, codebase-design, writing-for-agents, review-triage), `THIRD-PARTY-NOTICES.md`, `templates/.prettierignore`, `templates/CLAUDE.md` § Code Review Checklist (post local results on the PR), `templates/CLAUDE.md` § Changing the guidance (toolkit rule) |

## Setup

### Admin steps (someone with repository or organisation admin)

1. **Confirm who can change the default branch's rules.** If they come from an
   organisation ruleset, either an org owner edits it or a repo admin adds a repository
   ruleset on top. Read `gh api repos/{{ORG}}/{{REPO}}/rules/branches/{{DEFAULT_BRANCH}}`
   first; it lists every rule and its source.
2. **Check the release automation's push path.** Find the actor that pushes version bumps
   and tags to the default branch (`{{RELEASE_BOT_ACTOR}}`). It must be on the bypass list
   of the new rules, or the first release after enabling fails at `git push`.
3. **Add the required check and the merge queue.** Import
   `templates/.github/rulesets/default-branch-gate-and-queue.json` (Repository settings →
   Rules → Rulesets → Import), or post it with
   `gh api -X POST repos/{{ORG}}/{{REPO}}/rulesets --input default-branch-gate-and-queue.json`.
   The values and why:

   | Setting                             | Value                           | Why                                                                 |
   | ----------------------------------- | ------------------------------- | ------------------------------------------------------------------- |
   | Required check                      | `{{GATE_CHECK_NAME}}`, source GitHub Actions | The one job that always reports                           |
   | Require branches up to date         | Off                             | The queue already tests each PR on top of the ones ahead            |
   | Merge method                        | Merge commit                    | Match the default branch's existing history                         |
   | Build concurrency                   | 5                               | Tests up to five queued PRs in parallel                             |
   | Minimum and maximum group size      | 1 and 1                         | Each release traces to one PR when publishing runs on every push    |
   | Only merge non-failing PRs          | On                              |                                                                     |
   | Status check timeout                | 45 minutes                      | Longer than the slowest validation job                              |

   If the org ruleset targets more repositories than this one, add the check in a ruleset
   scoped to this repository only, or every other repo is blocked.
4. **Create the labels** from `templates/.github/labels.json`:
   `gh label create fast-lane --color 0E8A16 --description "Docs or user-visible copy only"`
   and the others marked milestone 0.

### Personal account (no merge queue)

A repository owned by a personal account has no merge queue; the host offers it only on
organisation-owned repositories. Everything else in the kit works. Public repositories get
rulesets free; a private one needs a paid personal plan or classic branch protection.

1. **Import `templates/.github/rulesets/default-branch-gate-only.json`** instead of the
   queue ruleset. Same route: Settings → Rules → Rulesets → Import, or
   `gh api -X POST repos/{{ORG}}/{{REPO}}/rulesets --input default-branch-gate-only.json`,
   where `{{ORG}}` is the username.
2. **Require branches to be up to date** (the ruleset sets this on). The queue normally
   tests each PR on top of the ones ahead of it; without a queue, this setting is what stops
   two green PRs from merging into a red default branch. Press "Update branch" before the
   final run.
3. **Approvals.** A personal account has no teams, so `{{APPROVER_TEAM}}` has no meaning.
   The ruleset ships with zero required approvals because an author cannot approve their
   own PR; a two-person project raises it to one. For a named approver, add a
   `.github/CODEOWNERS` file and turn on "Require review from Code Owners". The contract
   Status line still names the person who approved.
4. **The workflow stays as it is.** The `merge_group` trigger never fires on a personal
   repository and costs nothing. Leave it; moving to an organisation later needs no edit.
5. **Proofs.** Green, red, skipped, fast lane and toolkit apply unchanged. The queue proof
   does not; record "no queue, personal account" in its place.

Moving to an organisation later: transfer the repository, delete the gate-only ruleset,
import the queue ruleset, and turn "Require branches up to date" off.

### Repo steps (a PR from a contributor)

1. **The gate.** Add the `merge_group` trigger, the path-filter `base`/`ref` inputs, the
   `pr-gate` job with every validation job in `needs`, and the `event_name` guard on
   preview jobs. `templates/.github/workflows/pr-gate.yml` shows all four in one file.
   Change nothing about what any job tests.
2. **The fast lane.** Copy § Fast lane into `CLAUDE.md`, add the checkbox to the PR
   template, add the AGENTS.md routing row, and fill the `Source:` line with your
   adoption decision.
3. **The toolkit.** Copy `skills/*` into `.claude/skills/`, add `THIRD-PARTY-NOTICES.md`
   there, append `templates/.prettierignore`, and add the "post local review results" and
   toolkit paragraphs to `CLAUDE.md`. Tell contributors to delete any local copies of the
   same skills before pulling.
4. Describe each PR with What / Why / If we don't do it / In plain words.

## Proof

- **Green:** the gate PR's own run shows every job `success` and the gate `success`.
- **Red:** push a throwaway commit with a deliberate type error; the build job fails and
  the gate prints `A validation job failed or was cancelled` and fails. Drop the commit;
  the gate goes green again.
- **Skipped:** a throwaway PR changing only `README.md` shows the path-gated jobs `skipped`
  and the gate `success`.
- **Queue:** the first real merge-queue run after the admin steps. Watch the change
  detection step first if anything fails. Personal account: not applicable; see § Personal
  account.
- **Fast lane:** the fast-lane PR is itself the first fast-lane case: label on, box ticked.
- **Toolkit:** a fresh clone (`gh repo clone`) with no local skills runs
  `claude -p "/review-triage <pr-url> --all-comments"` and the PR shows the posted summary.
  Headless runs can't write the plan file into `.claude/`; print-only is the proof there.

## Gotchas that apply

`docs/gotchas.md` items 1 to 9 (gate and queue), 33 (personal account), 21 to 24 (toolkit), 30 to 32 (process).

## Decisions it needs

- **Who holds admin** for the default branch's rules, and which route (org ruleset or
  repository ruleset) they take. On a personal account the owner is the admin and the only
  route is a repository ruleset.
- **Fast-lane criteria.** The kit ships the origin's decision: documentation and
  user-visible copy only; dependency changes get full review because of supply-chain risk;
  version bumps never appear in feature PRs because publish automation owns them. Adopt it
  or record a different one.
- **Which skills are the team's and which stay personal.** Skills needing per-person
  tokens or servers (design tools) stay at user level. Skills whose licence forbids
  republishing stay out.

## Pickup prompt

```text
You are picking up milestone 0 of 6 (Make the gate real) for {{DS_NAME}}.
Read docs/architecture.md and docs/milestones/0-gate.md in the kit first.

Context: the validation workflow runs on every PR but no check is required, so a red run
can still merge. Skills the workflow relies on exist only on one machine.
Goal: (1) one always-run "{{GATE_CHECK_NAME}}" job that passes only when every validation
job succeeded or was skipped by its path filter, plus the merge_group trigger and the admin
runbook for the required check and merge queue; (2) CLAUDE.md § Fast lane, the PR-template
checkbox and the `fast-lane` label; (3) the team skills committed under .claude/skills/
with THIRD-PARTY-NOTICES.md, and /review-triage posting its summary on the PR.
Read first: .github/workflows/*.yml, `gh api repos/{{ORG}}/{{REPO}}/rules/branches/{{DEFAULT_BRANCH}}`,
.github/pull_request_template.md, `git status .claude/`.
Constraints: follow AGENTS.md hard stops and CLAUDE.md. New branch off the default branch
per piece, three PRs. Change nothing about what any check tests. Every PR gets What / Why /
If we don't do it / In plain words. Never merge, enable auto-merge or edit rulesets yourself;
write the admin steps and hand them over.
Done when: the gate goes red on a deliberate error and green again; a docs-only PR shows
skipped jobs and a green gate; the fast-lane section and label exist; a fresh clone runs
/review-triage and the PR shows the summary.
Out of scope: changing what the checks test; consumer-side distribution.

First step: present a plan in chat and wait for approval before changing anything.
```
