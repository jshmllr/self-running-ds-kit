# {{DS_NAME}}

Component library published as `{{PACKAGE}}`. {{DOCS_SURFACE}} is the primary dev surface.

> **This file is the canonical engineering reference.** `README.md` and
> `.github/copilot-instructions.md` are thin pointers to it. Standards edits belong here.
>
> - **Agent entry point:** [`AGENTS.md`](./AGENTS.md), the routing table and hard stops.
> - **Product and design judgment** (which component to use, accepted decisions, exemplars,
>   known gaps): [`.claude/skills/product-design/SKILL.md`](./.claude/skills/product-design/SKILL.md).
>   This file owns _how to build correctly_; the skill owns _what to build and why_.
> - **Live component APIs:** {{DOCS_SURFACE}}, never a hand-written summary.

<!--
  KIT NOTE: the sections below marked (core) are the same for any design system and came
  from a working roadmap. Sections marked (stack) are placeholders for your own rules;
  the React + Storybook adapter in the kit has a starting set. Delete every KIT NOTE
  before committing.
-->

## Commands (stack)

```bash
{{LINT_CMD}}
{{TYPECHECK_CMD}}
{{BUILD_CMD}}
{{TEST_CMD}}
{{VALIDATE_CMD}}        # diff-scoped: runs the right checks for the current change
```

## Repo layout (stack)

```
{{COMPONENT_DIR}}                 ← UI components; the contract loop covers these
{{OUT_OF_LOOP_PACKAGES}}          ← packages outside the loop; their own review process
{{TOKENS_PATH}}                   ← design tokens, the single source for colour, spacing, motion
```

## Architecture, styling, accessibility, testing harness (stack)

<!-- KIT NOTE: your stack rules go here. Each rule has one home; AGENTS.md § Hard stops
     points at these sections instead of restating them. -->

---

## Component contract (core)

A component's **contract** is what it promises the apps that use it. It lives in the one
piece of text that feeds the component's documentation page, the agent-readable component
manifest and the shipped package, so there is exactly one copy. In this repo that text is
<!-- KIT NOTE: name it, e.g. "the JSDoc on the exported component" -->
`{{CONTRACT_HOME}}`. Contracts cover UI components under `{{COMPONENT_DIR}}`;
`{{OUT_OF_LOOP_PACKAGES}}` keep their own review process. Worked example: the first
approved contract in this repo, at `{{FIRST_CONTRACT_PATH}}`.

### The blank form

The summary sentence comes first, then these parts in this order, then the usage examples:

```md
**Status:** Draft, not reviewed

#### Purpose

#### Parts

#### States

#### Keyboard and screen reader

#### Tokens and motion

#### Wording

#### Proof
```

- **Status**: `Draft, not reviewed`, or `Approved by <name> on <YYYY-MM-DD>`.
- **Purpose**: the job each variant does, and which component to use for the jobs next to
  it.
- **Parts**: each part labelled with one of four kinds. A _named spot_ is a prop that takes
  your content. A _set of parts_ is sub-components you arrange. _Swap what it's drawn as_
  replaces the element a part renders. _Built in_ marks a part consumers can't change. Say
  so when one of the first three isn't available.
- **States**: every state the component can be in. List the common ones it lacks
  (disabled, read-only, hidden) as not applicable.
- **Keyboard and screen reader**: keys, focus, accessible names and announcements. State a
  known gap as a gap.
- **Tokens and motion**: where its colours, sizes and spacing come from, and what moves,
  with which duration and easing variables.
- **Wording**: what to name the labels consumers pass, and the one word for the component.
- **Proof**: each promise, then the one check that proves it.

### Rules

1. **Every promise names one test in the component's folder,** by its exact title: a test
   from any test file there, including a headless hook's, or a story's interaction test. A
   title may wrap across lines. Promise only what a test proves. Something only a person
   can judge, such as a look or a motion, goes in one "Visual check only" line, naming the
   story that shows it where one exists. Renaming or deleting a named test changes the
   contract.
2. **Anything that depends on an undecided proposal starts with `Open:`** and says in plain
   words what is undecided. It carries no PR, issue or decision link, because the text
   ships to apps (see [§ Code Comments](#code-comments-core)). Put the tracking link on the
   component's issue or PR. The rest of the contract can still be approved and built.
3. **Sign-off is one approval from `{{APPROVER_TEAM}}`,** the team the branch rules already
   require. It covers both what the component promises and whether the code keeps those
   promises. A PR that changes a promise sets the Status line to `Draft, not reviewed`.
   After the approval, the author's last commit changes only that line, to
   `Approved by <approver> on <YYYY-MM-DD>`, and asks the approver to approve again. When
   the branch rules keep an approval after new commits, the second approval is what covers
   the final text.
4. **A PR that changes what a component promises updates its contract in the same PR.**
   This always needs sign-off, even when only words change (see [§ Fast lane](#fast-lane-core)).
5. **A component that isn't built yet keeps its write-up on its GitHub issue,** in the same
   form. The write-up moves into the code in the PR that builds the component.
6. **Nothing else may override the contract text on the docs page.** If your docs tool lets
   a second field replace the component description, that field stays unset. A component
   whose description still lives in such a field moves the text into the contract when it
   gets one.

Automated review can't follow links, so it reads its copy of the review checks from
`.github/instructions/component-contract.instructions.md`. Change that file whenever these
rules change.

**Source:** <!-- KIT NOTE: link your adoption decision (issue, ADR or PR) and the date -->

---

## Fast lane (core)

A PR qualifies when every change is documentation or user-visible copy:

- Prose in Markdown and MDX (MDX imports and JSX are code), `CLAUDE.md`, `AGENTS.md`, and
  Markdown guidance under `.claude/`.
- Code comments and doc comments, except directive comments (`eslint-disable`,
  `@ts-expect-error`, `prettier-ignore` and the like), which change what runs or is
  checked.
- The wording of user-visible strings, including their `aria-label` / `aria-describedby`
  counterparts, plus the test and story lines that repeat the same string. Nothing else
  on those lines changes.

**It skips the up-front stages:** no working plan in `.claude/plans/`, no plan presented
for approval before work starts, and no contract sign-off. A typo fix in a contract leaves
its Status line as it is and needs no second approval
([§ Component contract](#component-contract-core)).

**It keeps every check and approval:** every `{{VALIDATION_WORKFLOW}}` job, automated
review, the required human approval, and the What / Why / If we don't do it description.
Any change under `{{COMPONENT_DIR}}` also runs `/validate` (see
[§ Validation](#validation-core)), and a copy change loads the product-design skill in
`copy` mode.

**Everything else takes the full process**, including:

- Dependency changes (manifest dependency ranges, the lockfile, workspace config), because
  they carry supply-chain risk.
- Any other change to behaviour, styling, tokens, tests, stories, or build or CI config.
- Changing what a component promises, even when only words change. Adding, removing or
  changing a promise always needs sign-off; see
  [§ Component contract](#component-contract-core). A typo fix that leaves every promise
  the same stays in the fast lane.
- Agent configuration: `.claude/settings*.json`, `.claude/hooks/`, skill scripts, and the
  `tools:`, `allowed-tools:` and `model:` frontmatter of agent, command and skill files.
  They change what agents may run.
- A release-intent file, which requests a larger release bump. Version fields stay out of
  every feature PR; the publish automation owns them.

**To mark one**, add the `fast-lane` label and tick the fast-lane checkbox in the PR
template. A reviewer who finds a file outside these criteria removes the label, and the PR
takes the full process.

**Source:** <!-- KIT NOTE: link your adoption decision and the date -->

---

## Validation (core)

Every change to files that affect the shipped package or its checks MUST pass before it is
called complete. CI and documentation-only changes skip this step, except that any change
under `{{COMPONENT_DIR}}`, doc comments included, runs it.

**Run `/validate`.** The command ([`.claude/commands/validate.md`](.claude/commands/validate.md))
runs `{{VALIDATE_CMD}}` from the main session in the background and reports its output
verbatim. That file owns the scope rules and the manual commands.

Rules:

- Do not suppress lint rules without a documented, justified reason.
- Do not bypass type failures with ignore directives; fix the type.
- Do not skip, disable or weaken a test to work around a failure; fix the underlying issue.
- If `/validate` reports failures, fix them before presenting the change as finished.
- Run it once at the end of an isolated change rather than after every file touch.
- **Subagents do not run `/validate` or test suites.** A subagent implementing part of a
  change runs only the scoped lint and the typecheck. The orchestrating session runs
  `/validate` once after merging the subagents' work. Parallel test runs on one machine
  turn into contention timeouts.

---

## Testing: Test Contract Quality (core)

These rules apply to every test suite in the repo: unit, docs-surface interaction tests,
and tooling tests.

1. **Test observable contracts, not incidental implementation.** Protect the results,
   errors, state transitions, side effects, and supported interactions a module promises
   to consumers. A public parser's output or a consumer callback's arguments can be the
   contract. Avoid locking private call sequences, intermediate structures, or render
   counts unless they protect an explicitly justified requirement.
2. **One canonical home per contract; distinct cases must earn their place.** Avoid
   repeating the same setup, action, and expected outcome without adding protection.
   Retain distinct boundary conditions and failure modes, using parameterized cases where
   appropriate. Different layers protect different responsibilities, such as a hook's
   commit semantics versus a component's wiring of blur to that commit.
3. **Remove scaffolding that proves nothing about the product.** Review generated tests as
   critically as handwritten tests. Remove fixture self-checks, tautological assertions,
   redundant smoke tests, and temporary probes once stronger coverage exists. Preserve
   meaningful compile-time compatibility and governance checks, identified separately from
   runtime behaviour tests. Judge the test, not its author.
4. **Require assertions that distinguish correct behaviour from a plausible failure.** Ask:
   "If the behaviour named here stopped working, would this test fail?" A race test must
   expose a stale overwrite; a reset test must first establish changed state; an override
   test must use conflicting values. Expected results must not simply reproduce the
   implementation being tested.

**Author procedure:** before writing or changing a test, identify the consumer boundary and
the exact promise. Search existing tests and stories for its owner; extend that owner
unless another boundary or failure mode warrants a separate scenario. Name a plausible
broken implementation and choose inputs and postconditions that distinguish it. Before
consolidating or deleting, identify the surviving assertion, its owner, and the command
that runs it. Record contract, failure, and retention reasoning in the PR description, not
in test banners or production comments.

**Review procedure:** evaluate changed assertions and deletions, not just the presence of a
test. A reportable finding identifies the changed assertion and a concrete regression it
would miss, an unsupported constraint that rejects a behaviour-preserving refactor, a
duplicate (both locations and the stronger survivor), or a deleted distinct promise with
no replacement. Do not expand a feature review into a whole-suite cleanup.

Green CI establishes execution under the assertions, not that they are the right
assertions. No matcher, mock, timer or story without an interaction test is automatically
a violation; there is no test-count quota.

Accessibility: every suite that renders DOM includes an automated accessibility assertion
on production UI, not on markup invented to satisfy a checkbox. Hook-only suites are
exempt.

**Source:** <!-- KIT NOTE: link your adoption decision and the date -->

---

## Pull Request Descriptions (core)

Every PR description begins with these standalone `##` sections, in this order:

1. **What**: the observable change in plain language.
2. **Why**: the problem and why the change is needed.
3. **If we don't do it**: the concrete impact of leaving things unchanged.
4. **In plain words**: three to six sentences for someone who doesn't write code: what
   changes for people who use the repo, what they'll notice, and what's needed from whom
   before it can go in. Say what a tool does instead of naming it.

Keep each section short and understandable without reading the diff or a linked plan.
Describe this PR's scope, not the whole project. State uncertainty honestly. Distinguish
implemented behaviour from pending approval. Technical detail, stack information and
validation evidence come after these sections, never buried in a checklist or a link.

`.github/pull_request_template.md` provides the headings; this section is the requirement.

---

## Code Comments (core)

Comments document the code as it is now, for a reader who has only this repo.

1. **No pointers to anything outside the repo.** No plan, phase, decision id, ticket, PR or
   review thread. If the reasoning matters, state the reasoning; if it doesn't, drop it.
2. **Describe the present, not the history.** No "previously X, now Y", no commented-out
   code. Git holds the history. When you change code, delete or rewrite the comments the
   change invalidated.
3. **Only comment what the code cannot say.** A counter-intuitive choice, a subtle
   invariant, a workaround and why it's needed, a deliberate edge-case decision.
4. **Be brief.** One or two sentences.

Doc comments on public exports are the exception to brevity: examples and remarks earn
their length because they surface in consumers' tooling.

---

## Code Review Checklist (core)

When reviewing or refactoring code:

1. Flag any accessibility gap against the relevant pattern in the accessibility reference.
2. Flag every stack hard stop listed in `AGENTS.md`.
3. Flag any comment that cites an out-of-repo artefact, narrates history, or restates the
   code.
4. For added, changed, or deleted tests, apply
   [Test Contract Quality](#testing-test-contract-quality-core).
5. For a diff that touches a contract, a named proof test, or a stories meta, apply the
   checks in `.github/instructions/component-contract.instructions.md`.

**Post local review results on the PR**, so reviewers see what was already checked:

- `/code-review <level> <pr> --comment` posts the built-in reviewer's findings as inline
  comments. Each one opens a review thread; reply to each finding, then resolve it.
- `/review-triage <pr-url>` posts its fix plan's summary as one PR comment.

---

## Working Plans (core)

`.claude/plans/*.md` is the approved location for implementation, review-triage, and other
working plans. Plans there may be tracked in Git when retaining the work in progress is
useful.

Every plan declares its current state near the top (`Draft`, `Active`, `Blocked`) and keeps
it current. A completed plan is not an archive: remove the plan file when its work is
done. Preserve durable outcomes in the code, the documentation, or an accepted decision
record instead.

---

## Changing the guidance itself (core)

Guidance is versioned like code.

- A new or changed rule needs a `Source:` line verified against the current default
  branch: not memory, not a screenshot.
- Automation may **collect** evidence and **propose**. A human accepts or rejects. No agent
  edits `SKILL.md`, `references/`, or `decisions/` to "capture a learning" without a human
  in the loop.
- Rules that stop earning their place get deleted. A shorter skill that agents follow
  beats a long one they skim.
- `.claude/skills/` holds the team toolkit: skills every contributor's workflow relies on.
  Personal skills install at user level (`~/.claude/skills/`). A skill copied from another
  repository records its source and licence in `.claude/skills/THIRD-PARTY-NOTICES.md`.
- A rule that other files refer to gets an id: a heading, or a bold or code `rule/<id>` at
  the start of the paragraph that defines it. Refer to it elsewhere by that id, never by
  restating it. Each id is defined in exactly one place.

Two pieces of automation hold this loop, and neither edits guidance. The **guidance check**
(`node tooling/guidance/check.ts`) runs on pull requests that touch guidance: it fails on a
broken link or anchor and on a `rule/<id>` defined twice or nowhere, and warns on a changed
rule with no `Source:` line and on the same sentence written in two files. Skills that
`.claude/skills/THIRD-PARTY-NOTICES.md` lists as copied get no `Source:` or duplicate
warnings, because their wording is fixed upstream. The weekly **evidence digest**
(`.github/workflows/evidence-digest.yml`) groups the week's bot review comments by file and
cited rule and posts them on the roadmap issue with at most five proposed rule changes. A
person accepts a proposal by editing the guidance in a normal pull request.
