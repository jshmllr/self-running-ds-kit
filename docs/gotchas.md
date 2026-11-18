# Gotchas

Everything learned the hard way while building milestones 0 to 5. Each entry says what
went wrong, why, and what the kit does about it. Add to this file when a proof run finds
a new one.

## The gate and the merge queue

1. **A required check that gets skipped blocks the PR forever, or passes wrongly.**
   Path-gated jobs don't report when their files didn't change. Requiring them directly
   blocks every PR that skips one. The kit requires one always-run gate instead, and the
   gate accepts only `success` and `skipped`; `failure` and `cancelled` fail it. It fails
   closed: if change detection itself fails, the gate sees that job as `failure`.
2. **`null == false` is true in Actions expressions.** Equality is loose and both coerce to
   `0`. In a merge-queue event `github.event.pull_request.draft` is null, so a preview job
   guarded only by `draft == false` runs in the queue, tries to deploy to an environment
   named for a PR number that isn't there, and crashes. Guard every PR-only job with
   `github.event_name == 'pull_request'` as well.
3. **Path filtering in a merge group diffs against the default branch's tip** unless you pass
   the group's `base_sha` and `head_sha`. Without them the diff includes groups queued
   ahead, which runs extra jobs (a superset, never a miss). With them it is exact. On PR
   events the inputs are empty strings and ignored.
4. **Release automation that pushes version bumps needs a bypass.** Required checks and a
   required merge queue reject a direct push to the default branch unless the actor is on
   the bypass list. Confirm `{{RELEASE_BOT_ACTOR}}` can bypass before enabling, or the
   first release after the switch fails at `git push`.
5. **An organisation-level ruleset can only be changed by an organisation owner.** A repo
   admin can layer a repository ruleset on top; the two combine. Before adding a required
   check to an org ruleset, check which repositories it targets: every repo without that
   check's job would be blocked.
6. **Merge queue group size 1 when a release runs on every push to the default branch.**
   Each release then traces to exactly one PR, and a failing group removes only the PR
   that broke it. Build concurrency above 1 still tests queued PRs in parallel.
7. **A job that is always red teaches people to ignore red.** Keep deploy previews and
   other best-effort jobs out of the gate's `needs`. A preview outage must not block a
   merge, and a red preview next to a green gate is a clear signal, not noise.
8. **Converting a PR to draft skips the gate,** which the host reports as success on that
   commit. It can't cause a bad merge (drafts can't merge, and ready-for-review re-runs
   it) but it shows a stale green briefly. Moving preview teardown to its own workflow
   removes those triggers from the validation workflow entirely.
9. **The merge-queue path can't be proven until a queue exists.** Reason it from the
   action's source and the host's docs, say in the PR that it is reasoned and not run, and
   treat the first real queue run as the proof.

## The contract

10. **A second description field on the docs page replaces the contract.** In Storybook,
    a stories meta that sets `parameters.docs.description.component` overrides the
    component's doc comment on the Docs page, so the contract silently disappears. The
    rule: leave that field unset; a per-story note goes in the story-level field.
11. **Docgen reads the doc comment on the exported symbol, not the inner function.** For a
    compound component built with `Object.assign(Root, { Part })`, the contract goes on
    the `export const`, or the docs page, the manifest and the shipped types all show the
    inner function's placeholder comment instead.
12. **The contract ships to consumers, so it can't carry links.** A PR, issue or decision
    number inside the contract is a pointer a consumer can't follow, and the Code Comments
    rule forbids it anyway. Say what is undecided in words; keep the tracking link on the
    issue or PR.
13. **The Status line goes stale on merge unless the flip is a procedure.** After approval,
    the author's final commit changes only the Status line; the approver approves again.
    Check your branch rules: if approvals are dismissed on push, the second approval is
    the one that counts; if they aren't, it still covers the final text.
14. **The Proof list ships in the type definitions.** Consumers see test titles they can't
    run. The kit keeps it (one source beats two); the alternative is to keep summary,
    purpose, keyboard behaviour and examples in the shipped comment and let the tests be
    the proof. Record the choice as a decision either way.
15. **Automated review can't reach a local docs server.** A review bot on the host reads
    files, not a localhost MCP. The contract checklist therefore lives in a scoped
    instructions file in the repo, not behind a tool.
16. **Scoped instruction files can miss file types.** An `applyTo` glob of code and style
    extensions skips `.mdx` and plain Markdown, so a contract-only change may get no
    review checklist. Scope the contract instructions to every file type a contract can
    live in.
17. **A docs-surface accessibility check that only reports can't block.** If the a11y addon
    is set to report (`'todo'`) rather than fail (`'error'`), it isn't part of the gate.
    Decide which it is before promising "a11y proven by machines".
18. **Writing the contract exposes untested promises.** Expect to add or tighten tests
    (a fallback label, a singular/plural name that a loose regex also matched, an
    interactive part with no automated a11y scan). Budget for it; it is the point.
19. **A rule that references a stage must point at where the stage is defined.** The fast
    lane says it skips "plan approval" and "contract sign-off"; a reviewer asked where
    those are required. Define the stage (or link the milestone that will) before a rule
    names it.
20. **Two rules about the same thing drift.** "Docs changes skip validation" and "any change
    under the component folder, doc comments included, runs validation" lived in two
    sections and disagreed. One home per rule; the other section points.

## The toolkit and the agent config

21. **Hooks must work without `jq` and without GNU `grep`.** A Windows Git Bash install
    often has neither, and `\b` in `grep -E` is a GNU extension. A hook that exits quietly
    when its tool is missing never fires there, while the docs say it fires automatically.
    The kit's hook is a node script; node is always present in a JavaScript repo.
22. **Formatters rewrite vendored skills.** A Prettier pass turned a bare `'use client'`
    directive in an upstream code example into `('use client');`. Byte-for-byte copies go
    in `.prettierignore`, and content bugs are fixed upstream so the next copy keeps them.
23. **Untracked local copies of a skill block the pull that commits it.** Git refuses to
    overwrite untracked files. Tell contributors to remove local copies (including symlinks
    from a skills CLI) before pulling the toolkit PR. Worktrees share `.git/info/exclude`,
    so an excluded skill folder needs `git add -f`.
24. **A headless agent run can't write to `.claude/`.** Non-interactive sessions treat it
    as protected; a skill that writes a plan file there succeeds only interactively. Prove
    a skill in print-only mode when running headless.
25. **Every new rule needs a `Source:` line, and an authority.** A reviewer flagged three
    new sections with no source, and a conflict with "only the product-design skill may
    add rules". Decide who may add rules where, and write the source as you adopt.
26. **Review-thread `line` is null for outdated threads.** Fetch `originalLine` too, or
    the triage prints `file:null`.
27. **Multiple logged-in `gh` accounts make a visible repo return 404.** It looks like a
    missing repository. Scope a token per command instead of switching the global account,
    which changes state for every other session on the machine.
28. **Endpoint security may kill unsigned or unfamiliar binaries.** A review tool that
    exits 137 on launch is being killed, not crashing. Use another reviewer and say so in
    the PR.
29. **Worktrees with a borrowed `node_modules` break some tooling.** The package manager's
    dependency verification tries to install; browser-based test runners refuse to serve
    files outside the worktree. Run those in CI, and say so.

33. **A personal account has no merge queue.** The host offers the queue only on
    organisation-owned repositories, so the queue ruleset does not apply there. Use the
    gate-only ruleset with "Require branches up to date" on; that setting does the queue's
    job of catching two green PRs that are red together, at the cost of a manual
    "Update branch" click.

## The helpers (milestones 2 to 5)

34. **A check that is not in the gate's `needs` list never blocks.** Three checks were added
    and left out of the gate job, so they could fail and the change would still
    merge once the gate was required. Every new job goes into `needs` the day it is added,
    except a report-only job that is waiting to prove it is stable.
35. **In the merge queue the base branch name is blank.** A job that fetches
    `github.base_ref` fetches nothing in a `merge_group` run and fails. Take the base from
    `github.event.pull_request.base.sha` or `github.event.merge_group.base_sha`, as the kit's
    gate jobs do.
36. **A label must exist before a workflow applies it.** `gh issue create --label` and
    `gh pr create --label` fail on a missing label. Create every label in
    `templates/.github/labels.json` before the first run.
37. **An agent step must stay green without a credential.** Print a notice and skip when no
    key is set, put `continue-on-error` on the agent step, and warn after it if it failed.
    The plain steps still run, so a missing secret never turns a pull request red.
38. **Pin the agent action to a commit, not a tag, and keep its tool list narrow.** A tag
    can move. Each agent gets only the tools its job needs (often just writing one file),
    and a plain shell step does the posting.
39. **Reference pictures depend on the operating system.** Fonts render differently on
    each, so a picture made on a laptop never matches one made on the CI runner. Make and
    update references on the runner's operating system.
40. **Pull requests from forks get a read-only token.** A visual check that pushes
    candidate pictures to a branch cannot do it there. Upload them as an artifact instead.
41. **Every eval run costs model usage.** Start real runs by hand. On pull requests, grade
    committed pass and fail examples with no model call; that proves the graders without
    spending anything.
42. **A baseline near 100% shows nothing.** If the rules already pass more than 95% of the
    time, a rule change cannot show an improvement. Add harder cases taken from real
    findings.
43. **Copied third-party skills trip the guidance check.** Their wording is upstream's and
    carries no `Source:` lines. List them in `THIRD-PARTY-NOTICES.md`; the check then skips
    the `Source:` and duplicate warnings for them and still checks their links.
44. **The automation map drifts from the workflows.** The map said a check ran only
    on component changes when it ran on every change. Re-read the workflow trigger whenever
    you edit a row of `docs/automation-map.md`.

## Process

30. **Every roadmap PR needs an "In plain words" section.** The roadmap's audience includes
    people who don't write code. Three to six sentences, after What / Why / If we don't do
    it, naming no tools.
31. **Open roadmap PRs as drafts until the whole set is presentable** when the approver
    wants to see the end-to-end story, not one brick. Say what approval each PR waits on;
    never write who merges.
32. **Frame every status in milestone terms.** "Milestone 1 of 6, Agree the contract" is how
    sponsors follow it; issue numbers and phase labels lose them.
