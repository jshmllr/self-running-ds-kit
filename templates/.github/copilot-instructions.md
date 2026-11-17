---
description: '{{DS_NAME}} development standards'
applyTo: '**/*.{jsx,tsx,js,ts,css,scss,vue,svelte}'
---

# {{DS_NAME}}: development standards

`{{PACKAGE}}` is a component library. {{DOCS_SURFACE}} is the primary dev surface.

## Read these first

This file is a **pointer, not a source**. Every standard lives in exactly one place:

1. **[`AGENTS.md`](../AGENTS.md)**: agent entry point. Routing table, when to load the
   product-design skill, hard stops, and how to verify a change.
2. **[`CLAUDE.md`](../CLAUDE.md)**: the engineering reference. Architecture, styling,
   accessibility, testing, the component contract, the fast lane, PR descriptions,
   validation.
3. **[`.claude/skills/product-design/SKILL.md`](../.claude/skills/product-design/SKILL.md)**:
   product and design judgment: which component to use, accepted decisions, exemplars,
   and the decisions not made yet.

Load 3 whenever you are shaping, implementing, reviewing, or writing copy for a
user-facing component under `{{COMPONENT_DIR}}`. Skip it for CI, publish, build config, and
dependency work.

Component APIs come from {{DOCS_SURFACE}}, never from a hand-written summary. Design tokens
come from `{{TOKENS_PATH}}`.

## Hard stops

The list with rationale is `AGENTS.md` § Hard stops; these fail review every time.

## Component contracts

A diff that touches a component's contract, a test a contract's Proof list names, or a
stories meta follows the checks in
[`instructions/component-contract.instructions.md`](instructions/component-contract.instructions.md).

## Validation

For writing, changing, deleting, or reviewing tests, follow
[`CLAUDE.md` § Test Contract Quality](../CLAUDE.md#testing-test-contract-quality-core).
Every change touching `{{COMPONENT_DIR}}`, package code or tests, docs-surface config, or
build config must pass `/validate` before it is considered complete.

## Editing standards

Change `CLAUDE.md`. Do not re-add copies of its content here.
