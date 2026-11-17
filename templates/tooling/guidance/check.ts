import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import {
  changedRanges,
  checkGuidance,
  resolveLink,
  type Finding,
  type LineRange,
} from './checkGuidance.ts';
import { parseGuidance, parseThirdPartySkills, type ParsedGuidance } from './parseGuidance.ts';

/**
 * `node tooling/guidance/check.ts [--base <ref>] [files…]`: the Guidance check.
 *
 * Checks every tracked guidance file. Problems in files changed since the merge base with `<ref>`
 * (default: the refs in `DEFAULT_BASE_REFS`) are errors and warnings; problems only in untouched files
 * are notices, so a change is not failed for what it did not cause. Source-line and duplicate
 * warnings cover only the lines the change touched, and skip the skills that
 * `.claude/skills/THIRD-PARTY-NOTICES.md` lists as copied from another repository. Files named on
 * the command line are always in scope, and the output is limited to them. Untracked files are
 * not read until they are added. Exits 1 when any error remains, 2 when the check cannot run.
 */

// Adopters edit this block: where the copied-skill list lives, which files count as guidance,
// and which refs to diff against when no --base is given.
const THIRD_PARTY_NOTICES = '.claude/skills/THIRD-PARTY-NOTICES.md';
const DEFAULT_BASE_REFS = ['origin/main', 'main'];

/** Pathspecs for the guidance files, in `git ls-files` glob syntax. */
const GUIDANCE_PATHSPECS = [
  'CLAUDE.md',
  'AGENTS.md',
  'DESIGN.md',
  '.github/copilot-instructions.md',
  ':(glob).github/instructions/**/*.md',
  ':(glob).github/skills/**/*.md',
  ':(glob).claude/skills/**/*.md',
  ':(glob).claude/commands/*.md',
  ':(glob).claude/agents/*.md',
];

function git(...args: string[]): string | null {
  const result = spawnSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  return result.status === 0 ? result.stdout : null;
}

function lines(output: string | null): string[] {
  return (output ?? '').split('\n').filter(Boolean);
}

function parseArgs(argv: string[]): { base: string | null; files: string[] } {
  const args = argv[0] === '--' ? argv.slice(1) : argv;
  let base: string | null = null;
  const files: string[] = [];
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--base') {
      base = args[i + 1] ?? null;
      if (!base) throw new Error('--base needs a ref, e.g. --base origin/main');
      i += 1;
    } else {
      files.push(args[i]);
    }
  }
  return { base, files };
}

/** The merge base with `base`, or with each of `DEFAULT_BASE_REFS` in turn when none is given. */
function mergeBase(base: string | null): { ref: string; commit: string } | null {
  for (const ref of base ? [base] : DEFAULT_BASE_REFS) {
    const commit = git('merge-base', ref, 'HEAD')?.trim();
    if (commit) return { ref, commit };
  }
  if (base) throw new Error(`No merge base between ${base} and HEAD; fetch ${base} and retry.`);
  return null;
}

function escapeData(value: string): string {
  return value.replace(/%/g, '%25').replace(/\r/g, '%0D').replace(/\n/g, '%0A');
}

function escapeProperty(value: string): string {
  return escapeData(value).replace(/:/g, '%3A').replace(/,/g, '%2C');
}

function cell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function table(findings: Finding[]): string[] {
  return [
    '| Level | File | Line | Finding |',
    '| --- | --- | --- | --- |',
    ...findings.map((f) => `| ${f.level} | \`${cell(f.file)}\` | ${f.line} | ${cell(f.message)} |`),
  ];
}

function main(): number {
  const { base, files: explicit } = parseArgs(process.argv.slice(2));
  const root = git('rev-parse', '--show-toplevel')?.trim();
  if (!root) throw new Error('Run the Guidance check inside the git repository.');
  const explicitFiles = explicit.map((file) =>
    path.relative(root, path.resolve(file)).split(path.sep).join('/')
  );
  process.chdir(root);

  const guidance = [
    ...new Set([...lines(git('ls-files', '--', ...GUIDANCE_PATHSPECS)), ...explicitFiles]),
  ].filter((file) => existsSync(file));

  const files = new Map<string, ParsedGuidance>();
  for (const file of guidance) files.set(file, parseGuidance(readFileSync(file, 'utf8')));

  const existing = new Set<string>(['.']);
  for (const file of lines(git('ls-files', '--cached', '--others', '--exclude-standard'))) {
    if (!existsSync(file)) continue;
    existing.add(file);
    for (let dir = path.posix.dirname(file); dir !== '.'; dir = path.posix.dirname(dir)) {
      existing.add(dir);
    }
  }

  const targets = new Map<string, ParsedGuidance>();
  for (const [file, parsed] of files) {
    for (const link of parsed.links) {
      const target = resolveLink(file, link.path);
      if (!target?.endsWith('.md') || files.has(target) || targets.has(target)) continue;
      if (existing.has(target)) targets.set(target, parseGuidance(readFileSync(target, 'utf8')));
    }
  }

  // Diffing the merge base against the working tree covers commits and uncommitted edits.
  const since = mergeBase(base);
  const diffArgs = ['diff', '-U0', '--no-color', '--no-ext-diff', '--no-renames'];
  const changed = since
    ? changedRanges(git(...diffArgs, since.commit, '--', ...guidance) ?? '')
    : new Map<string, LineRange[]>();
  const scope = new Set([...changed.keys(), ...explicitFiles]);
  const verbatim = new Set(
    existsSync(THIRD_PARTY_NOTICES)
      ? parseThirdPartySkills(readFileSync(THIRD_PARTY_NOTICES, 'utf8')).map(
          (name) => `.claude/skills/${name}`
        )
      : []
  );

  const all = checkGuidance({ files, targets, existing, changed, scope, verbatim });
  const findings = explicitFiles.length
    ? all.filter((finding) => explicitFiles.includes(finding.file))
    : all;
  const active = findings.filter((finding) => finding.level !== 'notice');
  const notices = findings.filter((finding) => finding.level === 'notice');
  const errors = active.filter((finding) => finding.level === 'error').length;

  const onActions = process.env.GITHUB_ACTIONS === 'true';
  for (const finding of active) {
    console.log(
      onActions
        ? `::${finding.level} file=${escapeProperty(finding.file)},line=${finding.line},title=Guidance check::${escapeData(finding.message)}`
        : `${finding.file}:${finding.line}: ${finding.level}: ${finding.message}`
    );
  }
  if (notices.length) {
    console.log('\nPre-existing problems outside this change (not failing):');
    for (const finding of notices) {
      console.log(`${finding.file}:${finding.line}: notice: ${finding.message}`);
    }
  }
  const scopeNote = since
    ? `${changed.size} changed since ${since.ref}`
    : 'no merge base, so no changed sections';
  const totals = `${errors} error(s), ${active.length - errors} warning(s), ${notices.length} notice(s) across ${files.size} guidance files (${scopeNote}).`;
  console.log(`\nGuidance check: ${totals}`);

  const summary = process.env.GITHUB_STEP_SUMMARY;
  if (summary) {
    const body = ['## Guidance check', '', totals, ''];
    if (active.length) body.push(...table(active), '');
    if (notices.length) {
      body.push(
        '<details><summary>Pre-existing problems outside this change</summary>',
        '',
        ...table(notices),
        '',
        '</details>',
        ''
      );
    }
    appendFileSync(summary, `${body.join('\n')}\n`);
  }

  return errors > 0 ? 1 : 0;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 2;
}
