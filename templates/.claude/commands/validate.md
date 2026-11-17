---
description: Run lint, typecheck, build, and tests for the current change. Diff-scoped by default.
---

# Validate: run `{{VALIDATE_CMD}}` and report

`{{VALIDATE_CMD}}` computes the scope from `git diff`, runs the checks, and prints a
pass/fail summary. This command runs it and reports the result. **Do not compute scope or
dispatch checks yourself.**

## Run it

From the repository root, in the **main session** with `run_in_background: true` (a test run
outlasts a sub-agent's shell cap):

| `$ARGUMENTS`            | Command                            | Runs                                                         |
| ----------------------- | ---------------------------------- | ------------------------------------------------------------ |
| _(empty)_               | `{{VALIDATE_CMD}}`                 | Diff-scoped static checks and tests; builds for wider changes |
| `all`                   | `{{VALIDATE_CMD}} all`             | Every workspace's checks and suites                          |
| one or more paths       | `{{VALIDATE_CMD}} <paths…>`        | Path-scoped checks (the diff is ignored)                     |
| preview without running | add `--dry-run` before the target  | The plan and its reasons only                                |

Wait for the completion notification, then report the output **verbatim**: the scope
reasons, one `PASS`/`FAIL` line per check, the failure tails it printed, and the final
line. Success is exit code `0` and the script's own success line; nothing else counts.

If another session is already running tests, the script waits for the machine lock. That
is expected; keep waiting.

## Workspace ownership

<!-- KIT NOTE: say which root scripts do NOT run which package suites, and what a change
     in one package adds (e.g. a dependant's typecheck). This is the part people get wrong. -->

## Reading failures

Do **not** rerun a failure to "double-check" it, except for a browser test timing out in a
file the change does not touch, or a worker-start error. Rerun that one command alone, and
if it passes, report the pass and say the first result was contention.

Any other failure stands as reported. Do not fix anything in this command; the user will
ask.

## Manual commands

| Purpose            | Command                                   |
| ------------------ | ----------------------------------------- |
| Full / scoped lint | `{{LINT_CMD}}` / `{{LINT_CMD}}:scope <dirs…>` |
| Typecheck / build  | `{{TYPECHECK_CMD}}` / `{{BUILD_CMD}}`     |
| Tests              | `{{TEST_CMD}}` / `{{TEST_CMD}} <path>`    |

Capture output in full; truncating it hides the failure block.
