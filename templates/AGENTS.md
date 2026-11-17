# AGENTS.md: {{DS_NAME}}

Entry point for every agent that works in this repository: Claude Code, PR review bots,
GitHub Copilot, and any other coding assistant.

`{{PACKAGE}}` is a component library. {{DOCS_SURFACE}} is the primary dev surface. Consumers
are {{CONSUMER_APPS}}.

**This file routes. It does not restate standards.** Every rule has exactly one home; the
table below says which. If you find the same rule written in two places, that is a bug:
fix it by deleting the copy, not by syncing it.

---

## Load the product-design skill

**Load `.claude/skills/product-design/SKILL.md` when you are shaping, implementing,
reviewing, or writing copy for a user-facing component.**

That includes choosing which component to use for a UI problem, adding or changing a
component's props, states, visuals, motion, or labels, reviewing a diff that touches
anything under `{{COMPONENT_DIR}}` that renders, and writing user-visible strings.

**Skip it for:** CI and workflow files, publish and versioning, build and test config,
dependency bumps, README and docs-only edits, and repo tooling that renders nothing.

The skill resolves a **request mode** first (`shape`, `implement`, `review`, `copy`,
`harden`) so an audit does not silently become an edit. Announce the mode you resolved.

If the skill has no rule for the decision in front of you, check
`references/coverage-gaps.md`. If the gap is listed, say so and state your reasoning
instead of inventing a standard. If the gap is _not_ listed, add it.

<!-- KIT NOTE (stack): the React adapter adds a section here, "Load the React
     best-practices skill when planning", with its skip list. See
     adapters/react-storybook/README.md. -->

---

## Where each answer lives

| Question                                                             | Canonical source                                                                 | Do not                                                           |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| What props does this component take?                                 | {{DOCS_SURFACE}}, generated from the types                                       | Read the types file and paraphrase it into a doc                 |
| What does this component promise, and how do I write or change that? | [`CLAUDE.md` § Component contract](CLAUDE.md#component-contract-core)            | Promise what no test proves, or describe it in a second place    |
| Which component should I use here?                                   | `.claude/skills/product-design/references/component-judgment.md`                 | Pick by resemblance to a nearby file                             |
| Why is this the standard?                                            | The rule's `Source:` line, then the linked PR, issue, or decision record         | Promote one screenshot or one shipped file into a universal rule |
| Architecture, styling, a11y, testing **criteria**                    | `CLAUDE.md`                                                                      | Restate any of it in a new file                                  |
| Writing, changing, deleting, or reviewing tests                      | [`CLAUDE.md` § Test Contract Quality](CLAUDE.md#testing-test-contract-quality-core) | Judge quality by test counts or matcher syntax                   |
| Colors, shadows, radii, spacing, motion values                       | `{{TOKENS_PATH}}`                                                                | Hardcode a colour literal, px shadow, or duration                |
| Accepted design decisions and their evidence                         | `.claude/skills/product-design/decisions/`                                       | Re-litigate a decision recorded as `accepted`                    |
| A decision worth copying from shipped work                           | `.claude/skills/product-design/exemplars/`                                       | Assume shipped code is correct; exemplars list known flaws       |
| What we have _not_ decided yet                                       | `.claude/skills/product-design/references/coverage-gaps.md`                      | Improvise a standard to fill the gap                             |
| How do I verify a change?                                            | `.claude/commands/validate.md` (`/validate`)                                     | Hand-compute lint/test scope                                     |
| Does my change qualify for the fast lane?                            | [`CLAUDE.md` § Fast lane](CLAUDE.md#fast-lane-core)                              | Skip a check or the approval because a change is small           |
| How do I share local review results on the PR?                       | [`CLAUDE.md` § Code Review Checklist](CLAUDE.md#code-review-checklist-core)      | Keep review notes only on your machine                           |
| Where do working plans live?                                         | [`CLAUDE.md` § Working Plans](CLAUDE.md#working-plans-core)                      | Keep completed plans as an archive                               |
| What does the automation around pull requests, releases and the backlog do, and who decides? | [`docs/automation-map.md`](docs/automation-map.md) | Assume a check or an agent approved, merged or released anything |

`README.md` and `.github/copilot-instructions.md` are **pointers to `CLAUDE.md`**, not
independent sources. Standards edits go in `CLAUDE.md`.

---

## Hard stops

These fail review every time. Each one is spelled out with rationale in `CLAUDE.md`;
follow the pointer rather than trusting this summary.

<!-- KIT NOTE (stack): list your stack's hard stops here, each with a pointer to its
     CLAUDE.md section. The React adapter lists candidates. These two are stack-neutral: -->

1. Colour, spacing and motion values come from `{{TOKENS_PATH}}`, never literals. →
   _CLAUDE.md § Styling_
2. Don't skip, disable, or weaken a test to make a change pass. → _CLAUDE.md § Validation_

Only `.claude/skills/product-design/` may add rules beyond this list, and only with a
`Source:` line pointing at real evidence.

---

## Verifying work

Run `/validate` (`.claude/commands/validate.md`). It computes scope from `git diff`, runs
static checks, then builds, then tests under a machine lock.

Docs-only changes (this file, `README.md`, `CLAUDE.md`, `.claude/**` Markdown) do not need
`/validate`. Anything touching `{{COMPONENT_DIR}}` (doc comments included), package code or
tests, docs-surface config, or build config does.

---

## Changing the guidance itself

See [`CLAUDE.md` § Changing the guidance itself](CLAUDE.md#changing-the-guidance-itself-core).
In short: a `Source:` line for every rule, automation proposes and a human accepts, and
rules that stop earning their place get deleted.
