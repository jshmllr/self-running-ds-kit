import { describe, expect, it } from 'vitest';

import {
  changedRanges,
  checkGuidance,
  type GuidanceInput,
  type LineRange,
} from './checkGuidance.ts';
import { parseGuidance } from './parseGuidance.ts';

const md = (...lines: string[]) => lines.join('\n');

/** Parses `sources` and treats every file in it, plus `extra`, as existing. */
function check(
  sources: Record<string, string>,
  options: Omit<GuidanceInput, 'files' | 'existing'> & { extra?: string[] } = {}
) {
  const files = new Map(
    Object.entries(sources).map(([file, text]) => [file, parseGuidance(text)] as const)
  );
  const existing = new Set([...files.keys(), ...(options.extra ?? []), 'docs']);
  return checkGuidance({ ...options, files, existing });
}

const levels = (findings: ReturnType<typeof check>) =>
  findings.map(({ file, line, level }) => ({ file, line, level }));

const MUST_SECTION = md('# Guide', '', '## Buttons', '', 'Every button MUST set a type.');
const touched = (start: number, end = start): Map<string, LineRange[]> =>
  new Map([['AGENTS.md', [{ start, end }]]]);

describe('checkGuidance links', () => {
  it('passes a link to a heading that exists in the target file', () => {
    const findings = check({
      'AGENTS.md': 'See [rules](docs/RULES.md#claudemd--styling-rules).',
      'docs/RULES.md': '## CLAUDE.md § Styling Rules',
    });
    expect(findings).toEqual([]);
  });

  it('fails a link whose anchor matches no heading in the target file', () => {
    const findings = check({
      'AGENTS.md': 'See [rules](docs/RULES.md#styling-rules).',
      'docs/RULES.md': '## CLAUDE.md § Styling Rules',
    });
    expect(levels(findings)).toEqual([{ file: 'AGENTS.md', line: 1, level: 'error' }]);
  });

  it('fails a link to a file that does not exist, resolved from the linking file', () => {
    const findings = check(
      { 'docs/guide.md': '[up](../README.md) [missing](./README.md)' },
      { extra: ['README.md'] }
    );
    expect(findings.map((finding) => finding.message)).toEqual([
      'Broken link: ./README.md points at a file that does not exist.',
    ]);
  });

  it('downgrades a broken link in a file outside the scope to a notice', () => {
    const findings = check(
      { 'AGENTS.md': '[gone](gone.md)', 'CLAUDE.md': '[gone](gone.md)' },
      { scope: new Set(['CLAUDE.md']) }
    );
    expect(levels(findings)).toEqual([
      { file: 'AGENTS.md', line: 1, level: 'notice' },
      { file: 'CLAUDE.md', line: 1, level: 'error' },
    ]);
  });

  it('fails an unchanged link whose anchor the changed target no longer has', () => {
    const findings = check(
      { 'AGENTS.md': '[rules](CLAUDE.md#old-name)', 'CLAUDE.md': '## New name' },
      { scope: new Set(['CLAUDE.md']) }
    );
    expect(levels(findings)).toEqual([{ file: 'AGENTS.md', line: 1, level: 'error' }]);
  });
});

describe('checkGuidance rule ids', () => {
  it('passes a rule defined once and referenced elsewhere', () => {
    const findings = check({
      'a.md': '### rule/one-home',
      'b.md': 'Follow `rule/one-home`.',
    });
    expect(findings).toEqual([]);
  });

  it('fails a rule defined in two files and names both places', () => {
    const findings = check({
      'a.md': '### rule/one-home',
      'b.md': md('# B', '', '**rule/one-home**, a second copy.'),
    });
    expect(levels(findings)).toEqual([{ file: 'b.md', line: 3, level: 'error' }]);
    expect(findings[0].message).toContain('a.md:1, b.md:3');
  });

  it('fails a reference to a rule defined nowhere', () => {
    const findings = check({
      'a.md': '### rule/one-home',
      'b.md': 'Follow `rule/one-hom`.',
    });
    expect(findings.map((finding) => finding.message)).toEqual([
      'rule/one-hom is referenced but defined nowhere in the guidance.',
    ]);
  });
});

describe('checkGuidance Source lines', () => {
  it('warns when a changed section states a rule without a Source line', () => {
    const findings = check({ 'AGENTS.md': MUST_SECTION }, { changed: touched(5) });
    expect(levels(findings)).toEqual([{ file: 'AGENTS.md', line: 3, level: 'warning' }]);
  });

  it('does not warn for the same section when the change touched another section', () => {
    const findings = check({ 'AGENTS.md': MUST_SECTION }, { changed: touched(1) });
    expect(findings).toEqual([]);
  });

  it('accepts a Source line in the parent section', () => {
    const findings = check(
      {
        'AGENTS.md': md(
          '# Guide',
          '**Source:** PR #1.',
          '## Buttons',
          '',
          'Every button MUST set a type.'
        ),
      },
      { changed: touched(5) }
    );
    expect(findings).toEqual([]);
  });
});

describe('checkGuidance duplicated guidance', () => {
  const long =
    'Every component accepts a className prop and merges it last so consumers can override.';

  it('warns when a sentence of twelve or more words appears in two files', () => {
    const findings = check({ 'a.md': long, 'b.md': `Remember this. ${long}` });
    expect(levels(findings)).toEqual([{ file: 'a.md', line: 1, level: 'warning' }]);
    expect(findings[0].message).toContain('a.md:1 and b.md:1');
  });

  it('ignores a shared sentence shorter than twelve words', () => {
    const short = 'Run validate before you present a change as finished.';
    expect(check({ 'a.md': short, 'b.md': short })).toEqual([]);
  });

  it('reports a duplicate as a notice when neither copy is on a changed line', () => {
    const findings = check(
      { 'a.md': md('# A', long), 'b.md': long },
      { changed: new Map([['a.md', [{ start: 1, end: 1 }]]]), scope: new Set(['a.md']) }
    );
    expect(levels(findings)).toEqual([{ file: 'a.md', line: 2, level: 'notice' }]);
  });
});

describe('checkGuidance copied skills', () => {
  const copied = new Set(['.claude/skills/tdd']);
  const sentence =
    'Write the failing test first and watch it fail before writing any production code.';

  it('skips the Source rule for a changed section inside a copied skill, not for our own', () => {
    const findings = check(
      { '.claude/skills/tdd/SKILL.md': MUST_SECTION, 'AGENTS.md': MUST_SECTION },
      {
        changed: new Map([
          ['.claude/skills/tdd/SKILL.md', [{ start: 5, end: 5 }]],
          ['AGENTS.md', [{ start: 5, end: 5 }]],
        ]),
        verbatim: copied,
      }
    );
    expect(levels(findings)).toEqual([{ file: 'AGENTS.md', line: 3, level: 'warning' }]);
  });

  it('ignores a sentence shared only between copied files', () => {
    const findings = check(
      { '.claude/skills/tdd/SKILL.md': sentence, '.claude/skills/tdd/tests.md': sentence },
      { verbatim: copied }
    );
    expect(findings).toEqual([]);
  });

  it('reports a sentence we repeat from a copied skill, at our file', () => {
    const findings = check(
      { '.claude/skills/tdd/SKILL.md': sentence, 'AGENTS.md': md('# A', sentence) },
      { verbatim: copied }
    );
    expect(levels(findings)).toEqual([{ file: 'AGENTS.md', line: 2, level: 'warning' }]);
  });

  it('still fails a broken link inside a copied skill', () => {
    const findings = check(
      { '.claude/skills/tdd/SKILL.md': '[gone](./missing.md)' },
      { verbatim: copied }
    );
    expect(levels(findings)).toEqual([
      { file: '.claude/skills/tdd/SKILL.md', line: 1, level: 'error' },
    ]);
  });
});

describe('changedRanges', () => {
  it('reads added lines per file and marks a pure deletion at the line it follows', () => {
    const diff = md(
      'diff --git a/AGENTS.md b/AGENTS.md',
      '--- a/AGENTS.md',
      '+++ b/AGENTS.md',
      '@@ -10,0 +11,2 @@ heading',
      '+one',
      '+two',
      '@@ -40,3 +41,0 @@',
      'diff --git a/gone.md b/gone.md',
      '--- a/gone.md',
      '+++ /dev/null',
      '@@ -1,4 +0,0 @@'
    );
    expect(changedRanges(diff)).toEqual(
      new Map([
        [
          'AGENTS.md',
          [
            { start: 11, end: 12 },
            { start: 41, end: 41 },
          ],
        ],
      ])
    );
  });
});
