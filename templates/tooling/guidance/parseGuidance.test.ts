import { describe, expect, it } from 'vitest';

import { parseGuidance, parseThirdPartySkills } from './parseGuidance.ts';

const md = (...lines: string[]) => lines.join('\n');

describe('parseThirdPartySkills', () => {
  it('reads the skill names from the table and skips header, separator and prose rows', () => {
    const notices = md(
      '# Third-party skills',
      '',
      'The `grilling` skill is copied byte-for-byte.',
      '',
      '| Skill | Source | Copied at |',
      '| --- | --- | --- |',
      '| `tdd` | [example-org/skills](https://example.com) `skills/engineering/tdd/` | `9ce12c4a` |',
      '| `writing-for-agents` | [example-org/skills](https://example.com) | `95da47fc` |',
      '| not-a-code-span | x | y |',
      '',
      '## example-org/skills'
    );
    expect(parseThirdPartySkills(notices)).toEqual(['tdd', 'writing-for-agents']);
  });
});

describe('parseGuidance', () => {
  it('slugs headings the way GitHub anchors them', () => {
    const { headings } = parseGuidance(
      md(
        '## CLAUDE.md § Test Contract Quality',
        '### Two-file pattern: `.stories.tsx` + `__stories__/*.tsx`',
        '## Rules (React 19)',
        '## Rules (React 19)'
      )
    );
    expect(headings.map((heading) => heading.slug)).toEqual([
      'claudemd--test-contract-quality',
      'two-file-pattern-storiestsx--__stories__tsx',
      'rules-react-19',
      'rules-react-19-1',
    ]);
  });

  it('collects relative links with their anchors and skips external links and code', () => {
    const { links } = parseGuidance(
      md(
        'See [testing](../CLAUDE.md#test-contract-quality) and [home](https://example.com/a#b).',
        'Not a link: `[x](missing.md)`.',
        '```md',
        '[also not](missing.md)',
        '```',
        '[same file](#rules)'
      )
    );
    expect(links).toEqual([
      {
        target: '../CLAUDE.md#test-contract-quality',
        path: '../CLAUDE.md',
        anchor: 'test-contract-quality',
        line: 1,
      },
      { target: '#rules', path: '', anchor: 'rules', line: 6 },
    ]);
  });

  it('credits a Source line to its section, and a Source heading to the parent section', () => {
    const { sections } = parseGuidance(
      md(
        '# Decision',
        '## Rule',
        'Components must merge `className` last.',
        '**Source:** PR #1.',
        '## Mentions',
        'A rule needs a `Source:` line.',
        '## Source',
        'PR #2.'
      )
    );
    expect(sections.map((section) => [section.heading?.text ?? null, section.hasSource])).toEqual([
      [null, false],
      ['Decision', true],
      ['Rule', true],
      ['Mentions', false],
      ['Source', true],
    ]);
  });

  it('marks rule language and numbered lists, ignoring words inside code', () => {
    const { sections } = parseGuidance(
      md(
        '## Labels',
        'Callers must pass a label.',
        '## Code',
        'Use `MUST` sparingly.',
        '## Steps',
        '1. Run it.'
      )
    );
    expect(sections.slice(1).map((section) => section.hasRuleMarker)).toEqual([true, false, true]);
  });

  it('separates rule definitions from references, and ignores rule ids in fenced code', () => {
    const parsed = parseGuidance(
      md(
        '### rule/heading-rule',
        '',
        '**rule/bold-rule**, stated in bold.',
        '',
        'An exception defers to',
        '`rule/heading-rule`.',
        '',
        '```markdown',
        '### rule/example-only',
        '```'
      )
    );
    expect(parsed.ruleDefinitions).toEqual([
      { id: 'heading-rule', line: 1 },
      { id: 'bold-rule', line: 3 },
    ]);
    expect(parsed.ruleReferences).toEqual([{ id: 'heading-rule', line: 6 }]);
  });

  it('normalises sentences and records the line each starts on', () => {
    const { sentences } = parseGuidance(
      md('Use **`cn()`** to merge [classes](x.md). Then', 'pass `className` last!', '', '| a | b |')
    );
    expect(sentences.map(({ normalized, line }) => ({ normalized, line }))).toEqual([
      { normalized: 'use cn to merge classes', line: 1 },
      { normalized: 'then pass classname last', line: 1 },
    ]);
  });
});
