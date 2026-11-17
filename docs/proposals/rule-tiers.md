# Proposal: give each rule a tier and a check

**Proposal. Not adopted at the origin system.** Included because milestones 2 to 4 need a
way to say which rules can block a merge, which checks them, and how a waived rule
becomes evidence. Adopt it as a decision record in the product-design skill, with a human
accepting it, before any job depends on it.

## The problem

Verify (milestone 2), the verifier and the evals (milestone 4) need to know two things
about every rule in the constitution: can it block a merge, and what checks it. Today a
rule is prose with a `Source:` line. Nothing says whether a finding against it is a
failure, a default an author may argue with, or a note.

## The proposal

The product-design skill already gives every rule a stable `rule/<slug>` ID, a `Source:`,
a `Why:` and `Exceptions:`. Every rule has exactly one home, so this must not become a
separate gates file. Add two lines to the existing format:

```markdown
### rule/some-stable-slug

**Rule:** …
**Tier:** Floor | Reflex | Finish
**Check:** lint `<rule id>` | render `<story or test>` | judged
**Source:** …
**Why:** …
**Exceptions:** …
```

### Tiers

| Tier       | Meaning                                                                                                                                                     |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Floor**  | Never waived. A required check behind the gate (milestone 0).                                                                                               |
| **Reflex** | A default an agent falls into. Waivable on the PR, with evidence and a reason specific to the change. A named person approves every waiver.                 |
| **Finish** | Reported, never blocks. The same status as the skill's existing "a finding with no rule ID is labelled an opinion".                                        |

### Check kinds

`Check:` matches the levers the skill already names for where a new standard belongs:

- **lint**: code can find the failure without rendering, with few false positives and a
  concrete fix. Names the lint rule.
- **render**: the check has to run the component. Names the story, test, axe run or
  visual-diff target.
- **judged**: it needs product or codebase context. The verifier (milestone 2) or a
  reviewer applies it.

### Example rows

| Rule (generic)                                              | Tier   | Check                                      |
| ----------------------------------------------------------- | ------ | ------------------------------------------ |
| Colour, spacing and duration literals come from the tokens  | Floor  | lint (stylelint / ESLint rule)             |
| A static label never looks interactive (no border, shadow)  | Floor  | render (visual diff) until then judged     |
| A disabled state says why it is disabled                    | Reflex | judged                                     |
| Every `<button>` sets an explicit `type`                    | Floor  | lint                                       |
| Labels and table heads are not uppercase or letter-spaced   | Reflex | lint                                       |

## What this adds

- **One map from rules to lint.** A `lint:gates` check confirms that every `Check: lint`
  rule names a real rule in the lint config, and that every custom lint rule points back
  at a `rule/` ID. Prose and check cannot drift apart.
- **Separate counts.** Floor failures and unanswered Reflex findings are reported
  separately, so "0 Floor failures" is always a true statement in the change record
  (milestone 3).
- **Waivers are evidence.** A rule waived on three PRs in a row is a house style, not an
  exception. That is the evidence milestone 4 collects: repeated waivers propose changing
  the rule, a person decides, and evals score the change by counting findings on a fixed
  task set.

## How to adopt it

1. Open a decision record in the product-design skill with `Status: proposed` and a
   `Source:` verified on `{{DEFAULT_BRANCH}}`.
2. Tier the rules that already exist. Most hard stops are Floor with a lint check; most
   judgement rules are Reflex, judged.
3. Add the two lines to the rule format in `SKILL.md` and to each rule, in one PR.
4. A human accepts the record. Only then may the gate, the verifier or the evals read the
   tiers.

## Considered and dropped

Candidates that look like rules but do not fit a tiered check, as a guide for adopters
drawing their own line:

- Minimum text size: a dense-UI type scale may include sizes below a general-purpose
  floor on purpose. Check the scale before writing the rule.
- "No overshoot easing": if a spring ease is in the motion scale by design, the rule is
  about clipping, not the ease.
- "No card inside a card": composition is a design decision, recorded in `decisions/`,
  not a lint rule.
- Hover effects, cramped layouts, decorative monospace: not observable enough to pass the
  skill's test that a rule must describe an observable failure.
