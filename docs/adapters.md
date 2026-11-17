# Adapters: what to swap for another stack

The kit has a shared core and a set of swappable parts. The core is the process: the gate,
the fast lane, the contract and its Status line, the proof rule, the PR description format,
the test-quality policy, and "people decide, helpers suggest". None of that depends on a
framework, a docs tool, a code host or an agent runtime.

Everything else is an **adapter**. The first adapter, and the only one proven, is React 19 +
Storybook + GitHub + Claude Code (`adapters/react-storybook/`). This page says which pieces
belong to which adapter, so a team on a different stack knows what to replace and what to
leave alone.

## The map

| Kit piece                                                        | Core or adapter   | Depends on         | A different stack replaces it with                                                                   |
| ---------------------------------------------------------------- | ----------------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| Always-run gate job, fail-closed, `merge_group` trigger          | Adapter (CI)      | GitHub Actions     | The same shape in the host's pipeline: one job every path-gated job feeds, accepting only pass/skip  |
| Ruleset JSON, merge queue settings, bypass for the release actor | Adapter (host)    | GitHub             | The host's branch protection and merge train; the release bot still needs an explicit bypass         |
| Labels (`fast-lane`, `ready-for-agent`, `needs-person`)          | Adapter (host)    | GitHub             | The host's labels; names stay the same so the written rules keep pointing at them                    |
| PR template: What / Why / If we don't do it / In plain words     | Core              | Markdown           | Nothing. Put the same headings in the host's merge-request template                                  |
| `CLAUDE.md` sections (contract, fast lane, test quality, …)      | Core              | Markdown           | Nothing. The file name changes if the agent runtime reads a different one; the content does not      |
| `AGENTS.md` router                                               | Core              | Markdown           | Nothing. Hard stops are filled from the stack adapter                                                |
| Contract home: doc comment on the exported component             | Adapter (docs)    | Docgen + autodocs  | The one source that both renders the docs page and ships to consumers (see "Docs surface" below)     |
| Stories meta description rule                                    | Adapter (docs)    | Storybook          | Whatever field your docs tool lets override the component description: leave it unset                |
| Part kinds (named spot, set of parts, swap what it's drawn as)   | Core              | None               | Nothing. The names describe composition, not a framework                                             |
| Planning hook + React best-practices skill + skip list           | Adapter (stack)   | React, Claude Code | Drop both, or swap in your framework's guide with its own skip list                                  |
| Stack hard stops (no `forwardRef`, no manual memo, …)            | Adapter (stack)   | React 19           | Your framework's equivalents, each with a `Source:` line                                             |
| `/validate` command                                              | Core shape        | Your scripts       | Keep the command; point `{{VALIDATE_CMD}}` at whatever computes scope and runs checks                |
| Copilot instructions + scoped `*.instructions.md`                | Adapter (review)  | GitHub Copilot     | Your review bot's instruction file, or nothing: the checks also ship as the `contract-review` skill  |
| Toolkit skills (`grilling`, `tdd`, `diagnosing-bugs`, …)         | Core              | Markdown           | Nothing. They read as plain instructions for any runtime                                             |
| `review-triage` skill                                            | Adapter (host)    | `gh` CLI           | The same steps against the host's CLI or API                                                         |
| `agents/openai.yaml` beside each upstream skill                  | Adapter (runtime) | Codex-style tools  | Keep; harmless elsewhere                                                                             |

## Notes by adapter

### Framework: Vue or Svelte with Storybook

The contract stays where it is: in the doc comment on the exported component, the text that
feeds the autodocs page. Check the docgen your Storybook framework uses reads that comment
and not a sibling (the React adapter's gotcha is that docgen reads the exported object, not
the inner function; your docgen will have its own version of this). Verify by opening the
Docs page and finding the Status line.

Drop `adapters/react-storybook/skills/vercel-react-best-practices` and the planning hook.
Replace the stack hard stops with your framework's: the shape is "one line, one Source,
fails review every time", and the list stays short. Lint-enforced rules differ, so the
AGENTS.md sentence that names which hard stops lint already catches is rewritten, not
copied.

### Docs surface: Figma, a hand-written docs site, or no Storybook

The rule to keep is that the contract has **one home that both renders the docs and ships
to consumers**. A docs page generated from code can't catch drift from that code, and a
hand-written page nobody imports drifts the other way. Pick the home first, then prove
these three things on one component before writing the rules:

1. The docs page shows the Status line and the seven headings, taken from the home.
2. An agent asking about the component gets the same text (whatever your agent-readable
   surface is).
3. A consumer looking the component up sees the same text, or the kit's rules say plainly
   that consumers don't.

If the home can't reach consumers, say so in the contract rules rather than claiming it
does. The Proof rule (one named test per promise) and the Status flip work the same way
wherever the text lives.

### Code host: GitLab, Bitbucket and similar

The ideas transfer; the names don't. Each host has its own branch protection, required
pipeline jobs, merge trains and approval rules. The kit's host-specific files are examples
of the settings, not importable there. Carry over the invariants: one always-run required
job that fails closed; a merge train that re-tests each change before it lands; an explicit
bypass for the actor that pushes release commits; and labels with the kit's names. Check
your host's expression language for the loose-equality trap (`null == false`) before
copying any `if:` condition.

### Agent runtime

Claude Code is the first runtime: the templates assume `CLAUDE.md`, `.claude/settings.json`
hooks, `.claude/commands/` and `.claude/skills/`. Every skill is a Markdown file with
frontmatter, so other runtimes read them as instructions. The upstream skills also carry
`agents/openai.yaml` interface files, which Codex-style runtimes read. GitHub Copilot reads
`.github/copilot-instructions.md` and the scoped `.github/instructions/*.instructions.md`
files; keep those as pointers to `AGENTS.md` and `CLAUDE.md`, never copies, and remember
Copilot's `applyTo` can miss file types (`.mdx` for one), so scope deliberately.

A runtime without hooks loses only the planning reminder; the skill description and the
`AGENTS.md` pointer still fire.
