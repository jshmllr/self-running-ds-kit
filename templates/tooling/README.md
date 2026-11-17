# Tooling templates

Two small programs that read Markdown and nothing else. Both are plain TypeScript run directly
by Node, with no build step and no dependencies beyond Node's own modules. Copy the folders
into your repository as `tooling/guidance/` and `tooling/evidence/`.

| Tool                | Milestone | What it does                                                                                                                                                     | Edits guidance? |
| ------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| **Guidance check**  | 4         | Reads every guidance file and fails a change on a broken link or anchor, or a `rule/<id>` defined twice or nowhere. Warns on a changed rule with no `Source:` line and on a sentence written in two files. | No              |
| **Evidence digest** | 4         | Turns a week of bot review comments into a plain summary: counts per file, per cited rule or section, per reviewer, with excerpts.                                | No              |

## Requirements

- **Node 22.18 or later, or Node 24.** The files import each other with
  `.ts` extensions and run with no compile step, which needs Node's type stripping.
- `"type": "module"` in `package.json`.
- A `tsconfig.json` with `allowImportingTsExtensions: true`, `module` and `moduleResolution`
  set to `nodenext`, and `@types/node` installed, so the files typecheck with the rest of the
  repo.
- **Vitest** for the tests. Include `tooling/**/*.test.ts` in the unit project.
- `git` on the PATH. The Guidance check shells out to it for the file list and the diff.

## Guidance check

```bash
node tooling/guidance/check.ts --base origin/{{DEFAULT_BRANCH}}   # what CI runs
node tooling/guidance/check.ts                                      # local: defaults to the refs in DEFAULT_BASE_REFS
node tooling/guidance/check.ts CLAUDE.md AGENTS.md                  # only these files, every finding at full level
```

Add to `package.json`:

```json
"guidance:check": "node tooling/guidance/check.ts"
```

Exit codes: 0 clean, 1 at least one error remains, 2 the check could not run (not inside a
repository, or `--base` has no merge base with `HEAD`). On GitHub Actions it prints
`::error` and `::warning` annotations and appends a table to the job summary.

How scope works: problems in files changed since the merge base are errors and warnings.
Problems only in untouched files are notices and never fail the run, so a change is not
blamed for what it did not cause. The Source and duplicate rules look only at changed lines.
Skills listed in `THIRD-PARTY-NOTICES.md` are treated as copied word for word: no Source or
duplicate findings, but links and rule ids in them are still checked.

**Adopters edit** the constants block at the top of `check.ts`:

- `THIRD_PARTY_NOTICES`: path of the notices file that lists copied skills, one code span per
  table row.
- `DEFAULT_BASE_REFS`: refs tried in order when `--base` is absent. Set the first to
  `origin/{{DEFAULT_BRANCH}}`.
- `GUIDANCE_PATHSPECS`: which files are guidance. Ships with `CLAUDE.md`, `AGENTS.md`,
  `DESIGN.md`, the Copilot instruction files, and every Markdown file under `.github/skills/`,
  `.claude/skills/`, `.claude/commands/` and `.claude/agents/`. Remove what you do not have
  and add what you do.

In CI, run it from a job that has fetched the base branch (`fetch-depth: 0` then
`git fetch origin {{DEFAULT_BRANCH}}`), gated by a path filter over the same globs plus
`tooling/guidance/**`. Wire the job into the gate's `needs` list so it can block a merge.

## Evidence digest

```bash
node tooling/evidence/summarize.ts evidence/comments.json evidence/summary.md
```

The weekly workflow gathers `comments.json` with the host's CLI and this program writes the
summary it posts. `comments.json` is one object:

```json
{
  "since": "2026-01-01",
  "until": "2026-01-08",
  "pullRequests": [{ "number": 12, "title": "…", "files": ["src/Button/Button.tsx"] }],
  "comments": [
    {
      "pr": 12,
      "kind": "review-comment",
      "author": "some-reviewer[bot]",
      "path": "src/Button/Button.tsx",
      "url": "https://…",
      "body": "Breaks rule/one-home; see CLAUDE.md § Styling."
    }
  ]
}
```

`kind` is `review-comment` (inline), `review` (a review summary) or `summary` (a whole-PR
second-opinion comment). A comment counts as citing guidance when its body names a
`rule/<id>` or a `CLAUDE.md § Heading` or `CLAUDE.md#anchor`; the headings come from the
`CLAUDE.md` in the checkout, so renamed sections are matched by name or anchor.

**Adopters edit** `GUIDANCE_FILE` at the top of `summarize.ts` if the constitution file has
another name. The section-citation patterns in `digest.ts` also spell `CLAUDE.md`; change
them together.

The digest only summarises. Proposed rule changes, when a credential exists, come from the
agent step in the workflow, and a person turns an accepted proposal into a normal pull
request, where the Guidance check applies to it like any other change.

## Tests

```bash
npx vitest run tooling/guidance tooling/evidence
```

Every test is kept; three fixture strings were reworded (an attribution to
an upstream author became `example-org/skills`, and two em dashes became commas), with no
change to what is asserted.
