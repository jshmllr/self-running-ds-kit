<!-- Paste into AGENTS.md after "Load the product-design skill". The planning hook's
     reminder names this section by its heading, so keep the heading as written. -->

## Load the planning skill

**Load `.claude/skills/vercel-react-best-practices/SKILL.md` whenever you are planning
React work**: shaping an approach, writing a plan, or entering plan mode. In Claude Code a
project hook (`.claude/hooks/load-planning-skill.js`) injects this reminder automatically
when `node` is on the PATH; other agents load it by hand.

It is a 70-rule performance guide written for a Next.js app, so **CLAUDE.md wins on every
conflict**. Skip these rule groups outright:

- `rerender-memo`, `rerender-memo-with-default-value`, `rerender-simple-expression-in-memo`,
  `rerender-split-combined-hooks`, `advanced-use-latest`: they assume manual `useMemo` /
  `memo`, which the React Compiler makes a hard stop.
- Every `server-*` rule, `bundle-dynamic-imports`, `client-swr-dedup`, `async-api-routes`,
  `rendering-hydration-no-flicker`, `rendering-hydration-suppress-warning`: app concerns
  with no target in a component library.
- `bundle-barrel-imports` applies to _internal_ imports only. The public entry barrel is
  what consumers import from; do not dismantle it.

Everything else in the skill is advisory judgment, not a hard stop. Lint already enforces
two of its rules when the matching plugins are on: `rerender-no-inline-components`
(`@eslint-react/no-nested-component-definitions` and `react-hooks/static-components`) and
`rerender-derived-state-no-effect` (`react-hooks/set-state-in-effect`).

**Source:** <!-- your adoption decision and date -->
