---
name: product-design
description: Product and design judgment for {{DS_NAME}} components. Which component to use for a UI problem, accepted design decisions with their evidence, exemplars from shipped PRs, and the decisions not made yet. Use when shaping, implementing, reviewing, or writing copy for any user-facing component under {{COMPONENT_DIR}}. Skip for CI, publish, build config, dependency, and docs-only work.
---

# Product design: {{DS_NAME}}

`CLAUDE.md` tells you **how to build correctly**. This skill tells you **what to build and
why**. Component source shows what shipped; it does not show why it became the standard, or
which parts of it were a mistake not fixed yet. That reasoning is here.

**This skill is a router and a judgment layer. It duplicates nothing.** Component APIs live
in {{DOCS_SURFACE}}, a11y criteria live in `CLAUDE.md`, colours and durations live in
`{{TOKENS_PATH}}`. An API signature or a token value written out in this skill is a bug:
delete it and route to the source.

---

## Step 1: resolve the request mode, then say which one

Do this before reading anything else. The most common failure is an audit quietly turning
into a refactor.

| Mode          | The request is                                                      | You may change                                                              | You must not                                                                 | Output                                                                 |
| ------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **shape**     | "What should this UI be?", no component chosen yet                  | Nothing. This mode produces a recommendation.                               | Write component code. Pick by resemblance to a nearby file.                  | A component choice, its rule ID, and the rejected options with reasons |
| **implement** | "Build / extend this", the shape is already decided                 | The named component and its stories, types, tests, contract                 | Redesign the shape mid-implementation. Change adjacent components unasked.   | Working code + stories + tests, `/validate` clean                      |
| **review**    | "Is this right?", a diff, a PR, a component                         | **Nothing.** Read-only.                                                     | Apply a single fix "while you're in there".                                  | Findings, each citing a rule ID or explicitly flagged as opinion       |
| **copy**      | "Fix the words": labels, empty/error/loading states, confirmations  | User-visible strings and their `aria-label` / `aria-describedby` counterparts | Touch layout, props, or visuals.                                           | String diffs only                                                      |
| **harden**    | "Make this production-safe": a11y, keyboard, focus, states, contrast | a11y wiring, keyboard handlers, focus management, missing states, tests    | Change the visual design or the component choice.                            | Fixes + a test per fix                                                 |

If the request spans modes, split it and name the order. If the mode is genuinely
ambiguous, ask. One question beats an unwanted refactor.

---

## Step 2: load only the reference you need

| Your question                                                  | Read                               |
| -------------------------------------------------------------- | ---------------------------------- |
| Which component for this UI problem?                           | `references/component-judgment.md` |
| Is there even a standard for this?                             | `references/coverage-gaps.md`      |
| Why is this the standard? What did we already decide?          | `decisions/`                       |
| What should I copy from shipped work, and what should I not?   | `exemplars/`                       |

<!-- KIT NOTE: add rows as you add reference files (patterns, a11y, copy, glossary,
     interface quality). Each file carries rules in the format below. -->

---

## Step 3: get facts from the canonical source, not from memory

| Fact                                        | Source                                                                 |
| ------------------------------------------- | ---------------------------------------------------------------------- |
| A component's props, defaults, variants     | {{DOCS_SURFACE}}, generated from the types                             |
| What a component promises                   | Its contract (`CLAUDE.md` § Component contract)                        |
| How a component behaves in the browser      | Run its stories; take a screenshot                                     |
| Colour, shadow, radius, spacing, motion     | `{{TOKENS_PATH}}`                                                      |
| Architecture, testing, a11y rules           | `CLAUDE.md`                                                            |
| Whether something actually shipped          | `git log` / `gh pr view`; a plan is not evidence that it landed        |

Never state a prop, default, or token value from recollection. Look it up.

---

## Rule format

Every rule in `references/` carries a stable ID so a finding is traceable to its evidence.

```markdown
### rule/some-stable-slug

**Rule:** One imperative sentence.
**Source:** PR, issue, decisions/NNNN-name.md, or a file path: something verifiable.
**Why:** The observable consequence of getting it wrong. Not an adjective.
**Exceptions:** When the rule does not apply, or "none".

Bad: <the specific mistake>
Good: <the specific fix>
```

Cite the ID in findings. A finding with no rule ID is labelled an opinion, so a human can
tell established standards from your judgment call. Rules are **observable**: "feels
unpolished" is not a rule; "a static label renders with a border and shadow, so it reads as
interactive" is.

**Never promote one screenshot, one shipped file, or one reviewer comment into a universal
rule.** Shipped code contains flaws not fixed yet; that is what the `exemplars/` known-flaws
sections are for.

---

## Decision authority

| Situation                                         | Who decides                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| A rule here covers it                             | You. Apply it, cite it.                                                                      |
| `coverage-gaps.md` lists it as a gap              | You, explicitly: state your reasoning and that no standard exists.                           |
| No rule and not listed as a gap                   | You, explicitly, **and add it to `coverage-gaps.md`** in the same change.                    |
| It would establish a new standard for the repo    | A human. Propose with evidence; do not write it into `references/`.                          |
| A `decisions/` record marked `accepted` covers it | Already decided. Follow it. Re-opening needs new evidence and a human.                       |
| Rules conflict                                    | A human. Report the conflict with both rule IDs.                                             |

Which lever a new standard belongs on: a **lint rule** when code can detect the failure
without rendering, with few false positives and a concrete fix; **prose guidance** in
`references/` with a `Source:` line when it needs product or codebase context; a **decision
record** when it establishes a new standard. Either way, land an example or an eval
alongside it so a regression is catchable.

---

## Verify before you claim done

- **shape**: the recommendation names a rule ID (or flags the gap) and lists what you
  rejected and why.
- **implement / harden**: `/validate` passes; a story exists for the new behaviour; a test
  exists per a11y claim; the contract is updated if a promise changed.
- **review**: every finding cites a rule ID or is labelled an opinion. You changed no files.
- **copy**: no non-string lines in the diff.

For anything visual, look at it. Do not describe rendered output you have not rendered.

---

## Adding to this skill

Guidance is versioned like code, and **a human accepts every change.**

1. Verify the claim against the current default branch, not memory or a plan.
2. Put it in the **narrowest** file that fits.
3. Include a `Source:` line.
4. A genuinely new standard opens as a `decisions/` record with `Status: proposed`.
5. Delete rules that stop earning their place.

Read `references/coverage-gaps.md` before assuming this skill has an answer.
