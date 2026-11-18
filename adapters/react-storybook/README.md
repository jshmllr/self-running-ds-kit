# Adapter: React 19 + Storybook

The first adapter, and the proven one. It covers where the contract lives in a React
component library documented by Storybook, the Storybook rules that protect it, and the
React-specific toolkit pieces.

## Where the contract lives

The contract is the JSDoc on the **exported component symbol**: the thing consumers import.
For a compound component built as `export const Tag = Object.assign(TagRoot, { Group, … })`,
that is the `Object.assign(...)` export, not the inner root function. `react-docgen-typescript`
reads the exported symbol's comment and ignores the root function's, so a contract written on
the wrong one never reaches a reader.

That one comment feeds three surfaces at once, which is why it is the only copy:

| Surface                                    | Who reads it                                 | Verify by                                                                                                            |
| ------------------------------------------ | -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| The autodocs Docs page                     | People browsing {{DOCS_SURFACE}}             | Open the component's Docs page; the Status line and all seven headings sit above the stories and the props table      |
| The component manifest (`@storybook/addon-mcp`) | Agents using the Storybook MCP          | Fetch `/manifests/components.json` from the running Storybook; the component's `description` contains `#### Proof`    |
| The shipped `.d.ts`                        | Consumer editors and assistants on hover     | Run `{{BUILD_CMD}}`; the component's `.d.ts` in `dist/` carries the same text                                        |

Do all three on the first contract before writing the team's rules. A contract that renders
in one place and not the others is a drift bug waiting to happen.

## Storybook rules that protect it

- **Leave `parameters.docs.description.component` unset on the stories meta.** When set, it
  replaces the component JSDoc on the Docs page, so the contract disappears from the one
  surface people look at. A note about a single story goes in that story's
  `parameters.docs.description.story`.
- An existing stories meta that already sets the component description keeps it until its
  component gets a contract; then the text moves into the JSDoc in the same PR.
- The description-free meta still owns `title`, `component`, `args`, `argTypes` and tags.

## A trade-off to record

A reviewer raised two consequences of the single-source rule, and the adopting team should
decide on them explicitly:

1. **The Proof list ships to consumers.** Every promise names a test title, so a consumer
   hovering the component sees thirty-odd test names they can't run.
2. **The Status line in shipped types goes stale** between the approval commit and the next
   release that carries it. A consumer may read "Draft, not reviewed" on an approved contract
   for a release cycle.

The kit keeps the full contract in the JSDoc: a single source beats a trimmed public copy
that drifts from the private one, and the Status flip (one final commit, one re-approval)
keeps the stale window to one release. The alternative is to keep summary, Purpose, Keyboard
and screen reader, and the `@example` blocks in the JSDoc and let the tests themselves be
the proof, with the Proof list living beside the tests. Record whichever you choose in your
contract rules; the review checks assume the first.

## Planning hook and the React best-practices skill

`skills/vercel-react-best-practices/` is Vercel's 70-rule performance guide, vendored
byte-for-byte (see the kit's `THIRD-PARTY-NOTICES.md`). It assumes a Next.js app, so
`CLAUDE.md` wins on every conflict, and a component library using the React Compiler skips
these rule groups outright:

- `rerender-memo`, `rerender-memo-with-default-value`, `rerender-simple-expression-in-memo`,
  `rerender-split-combined-hooks`, `advanced-use-latest`: they assume manual `useMemo` /
  `memo`, which the compiler makes redundant.
- Every `server-*` rule, `bundle-dynamic-imports`, `client-swr-dedup`, `async-api-routes`,
  `rendering-hydration-no-flicker`, `rendering-hydration-suppress-warning`: Next.js app
  concerns with no target in a library.
- `bundle-barrel-imports` applies to **internal** imports only. The public barrel is what
  consumers import; leave it standing.

Everything else is advisory judgment, not a hard stop. Two rules are already lint-enforced
when the matching rules are on: `rerender-no-inline-components`
(`@eslint-react/no-nested-component-definitions`, `react-hooks/static-components`) and
`rerender-derived-state-no-effect` (`react-hooks/set-state-in-effect`).

The planning hook (`templates/.claude/hooks/load-planning-skill.js`) injects a reminder to
load the skill whenever a prompt reads like planning, or plan mode is entered. It is
node-based and needs no `jq`; without `node` on the PATH it exits quietly, and the skill
description plus the `AGENTS.md` pointer still apply.

## Stack hard stops: candidates for `AGENTS.md` § Hard stops

Each needs a `Source:` line verified against your repository before it goes in. A React 19
component library typically adopts:

1. No `forwardRef`; React 19 takes `ref` as a prop.
2. No `useMemo` / `useCallback` / `React.memo` without profiler evidence; the React Compiler
   is on.
3. No `any`; no `@ts-ignore` / `@ts-expect-error` to get past a type error.
4. Every `<button>` sets an explicit `type`, in styled components and in headless
   prop-getters.
5. Every component accepts `className` and merges it last.
6. Logic and presentation stay separated; the `use*` prefix is reserved for functions that
   call React hooks.
7. Never skip, disable or weaken a test to make a change pass.

Design-token and styling stops (which colour notation, which utility system) belong to
your own `CLAUDE.md`; they are not part of this adapter.

## Installing the adapter

1. Copy `adapters/react-storybook/skills/vercel-react-best-practices/` into
   `.claude/skills/vercel-react-best-practices/` in your repository.
2. Add the vendored folder to `.prettierignore`. A formatter pass once rewrote a bare
   `'use client'` directive inside an upstream code example; byte-for-byte means no
   formatting.
3. Add the "Load the planning skill" section to `AGENTS.md`, copied from
   `AGENTS.section.md` beside this file, and fill in its `Source:` line.
4. Copy `templates/.claude/hooks/load-planning-skill.js`, and wire it
   in `.claude/settings.json` on `PreToolUse` (matcher `EnterPlanMode`) and
   `UserPromptSubmit`, as `templates/.claude/settings.json` shows.
5. Write the first contract on one small component and verify all three surfaces in the
   table above before writing the team's contract rules.

## Building the "You build" pieces on this stack

Milestones 2 to 5 each name pieces the team writes itself; the milestone docs say what each
must do and give the build prompt. These notes say how the first team built them on React,
TypeScript, Storybook and Vitest, so the prompt can name the right tools.

| Piece | How it was built here |
| --- | --- |
| **Contract checker** (milestone 2) | A TypeScript script using Node built-ins only, run with `node` directly (type stripping, Node 22.18 or later). It parses the JSDoc on each exported component with a small hand-written parser, then checks that every test or story a proof names exists in the component's folder. About 600 lines with tests. |
| **Visual check** (milestone 2) | Vitest's built-in screenshot comparison, inside the Storybook test project the repo already ran, in browser mode. It pictures only the `Default` and `Accessibility` stories of each component, once with `data-theme="light"` and once with `dark`. Reference pictures are committed beside each component and made on Linux, the same as the runner. A small script fetches candidate pictures from the side branch for review. |
| **Release suggestion** (milestone 3) | The TypeScript compiler API reads the package's public entry point and writes a snapshot of every export and its type. The script compares the snapshot on the pull request with the one on its base and reads changed contracts with the contract checker's parser. A job posts one comment, found by its heading and updated in place. |
| **Guidance evals** (milestone 4) | The runner calls `claude -p` headless in an empty folder with no settings, no MCP servers, no slash commands and no project memory, allowing only file reading and writing. Graders parse `.tsx` with the TypeScript compiler API and read stylesheets as text, with checks such as no hex colours, no bare palette utilities, no `forwardRef`, no manual memoisation, `type` on every button, no inline SVG, icons from the icon module, uses a named component, no `@apply`, no uppercase text. The rules page under test is the consumer-facing Storybook rules page. |
| **Usage scanner** (milestone 5) | The TypeScript compiler API parses each `.ts` and `.tsx` file in the consumer apps, follows imports from the package, counts JSX use and distinct props, finds `className` and `style` props on package components, and matches deprecated exports from the package's own JSDoc `@deprecated` tags. Node built-ins and the compiler only. |

