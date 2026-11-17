# The proof run: does the kit work without its authors?

The same test the origin used for its toolkit, applied to the whole kit: a fresh
repository with no history, an agent given only the kit, and a fixed target. Wherever the
agent gets stuck or asks a question only the origin team could answer, the kit has a hole.

## Setup

1. Create an empty repository with a tiny component library: one package, two or three
   components with tests and a docs surface, a CI workflow that lints, typechecks, builds
   and tests. No AGENTS.md, no CLAUDE.md, no skills.
2. Give the agent the kit (install the plugin, or copy the folder in) and this prompt:

   ```text
   Adopt the self-running design system kit in this repository and reach the end of milestone 1.
   Read the kit's README.md and setup/ADOPT.md first, then use the adopt skill.
   Ask me only the questions in setup/ADOPT.md § Fill the placeholders and § Decide these
   first. I will act as the admin when you hand me admin steps.
   ```

3. Answer only placeholder and decision questions. Refuse anything else with "the kit
   should tell you"; write the question down.

Before scoring milestone 1, follow the scoped `scripts/fill-placeholders.sh --check` example
in `setup/ADOPT.md` § 2 on adopted configuration files, excluding copied toolkit instructions;
it must report nothing. On an organisation, also prove that a green PR without the code
owner's approval cannot merge.

## Target

| Milestone 0                                                        | Milestone 1                                                               |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------- |
| A gate job exists and goes red on a deliberate error, green after  | One component has a contract in the blank form, every promise naming a test |
| A docs-only PR shows skipped jobs and a green gate                 | The docs page shows the Status line and seven headings                    |
| The admin runbook is correct enough for you to apply it            | The rules PR exists: § Component contract, fast-lane exception, routing row, review checklist |
| The fast-lane section, checkbox and label exist                    | The Status flip happens by the documented procedure                       |
| The toolkit is committed; a fresh clone runs `/review-triage`      | A second component's contract comes out the same shape                    |

## Scorecard

Record each row as reached / not reached, then list:

- **Questions the agent asked** that the kit should have answered. Each is a doc fix.
- **Steps the agent skipped or did wrong**, and which kit sentence should have prevented
  it. Fix the sentence (sharpen the completion criterion) before adding a new one.
- **Gotchas hit** that `docs/gotchas.md` doesn't list. Add them.
- **Placeholders missing or unneeded.** Change the set in `setup/ADOPT.md` and the script.

A run is a pass when both columns are reached with no question outside the two allowed
sections. Keep the throwaway repository until the kit changes are made, so the run can be
repeated against them.
