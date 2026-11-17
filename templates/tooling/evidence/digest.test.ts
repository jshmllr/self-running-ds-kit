import { describe, expect, it } from 'vitest';

import {
  excerpt,
  references,
  summarizeEvidence,
  type EvidenceComment,
  type KnownSection,
} from './digest.ts';

const SECTIONS: KnownSection[] = [
  { text: 'Testing', slug: 'testing' },
  { text: 'Test Contract Quality', slug: 'test-contract-quality' },
  { text: 'Styling Rules (Tailwind + SCSS)', slug: 'styling-rules-tailwind--scss' },
];

function comment(overrides: Partial<EvidenceComment>): EvidenceComment {
  return {
    pr: 1,
    kind: 'review-comment',
    author: 'Copilot',
    path: 'src/a.ts',
    url: 'https://example.com/c',
    body: 'A finding.',
    ...overrides,
  };
}

describe('references', () => {
  it('names the CLAUDE.md heading after §, not the rest of the line', () => {
    expect(
      references('Per CLAUDE.md § Test Contract Quality this test proves nothing.', SECTIONS)
    ).toEqual(['CLAUDE.md § Test Contract Quality']);
  });

  it('matches a heading cited without its trailing parenthetical', () => {
    expect(references('CLAUDE.md § Styling Rules says to merge it last.', SECTIONS)).toEqual([
      'CLAUDE.md § Styling Rules (Tailwind + SCSS)',
    ]);
  });

  it('counts a rule id and the same section cited by anchor once each', () => {
    expect(
      references(
        'Breaks `rule/api-changes-are-additive`; see CLAUDE.md § Testing and CLAUDE.md#testing, and rule/api-changes-are-additive again.',
        SECTIONS
      )
    ).toEqual(['rule/api-changes-are-additive', 'CLAUDE.md § Testing']);
  });
});

describe('summarizeEvidence', () => {
  it('groups comments by file and by reference, busiest first, with the pull requests involved', () => {
    const summary = summarizeEvidence(
      {
        since: '2026-11-06',
        until: '2026-11-13',
        pullRequests: [
          { number: 1, title: 'One', files: [] },
          { number: 2, title: 'Two', files: [] },
          { number: 3, title: 'Three', files: [] },
        ],
        comments: [
          comment({ pr: 1, path: 'src/b.ts', body: 'See rule/one-home.' }),
          comment({ pr: 2, path: 'src/a.ts', body: 'rule/one-home again.' }),
          comment({ pr: 1, path: 'src/a.ts' }),
          comment({ pr: 2, kind: 'review', path: null, author: 'claude[bot]' }),
        ],
      },
      SECTIONS
    );
    expect(summary).toContain(
      '4 bot review comments on 2 of 3 pull requests merged in this window.'
    );
    expect(summary).toContain(
      [
        '| File | Comments | Pull requests |',
        '| --- | --- | --- |',
        '| `src/a.ts` | 2 | #1, #2 |',
        '| (review summary, no file) | 1 | #2 |',
        '| `src/b.ts` | 1 | #1 |',
      ].join('\n')
    );
    expect(summary).toContain('| rule/one-home | 2 | #1, #2 |');
    expect(summary).toContain('2 comments cited no `rule/…` id or `CLAUDE.md §` section.');
  });

  it('reports an empty week without tables', () => {
    const summary = summarizeEvidence({
      since: '2026-11-06',
      until: '2026-11-13',
      pullRequests: [],
      comments: [],
    });
    expect(summary).toBe(
      '# Review evidence, 2026-11-06 to 2026-11-13\n\n0 bot review comments on 0 of 0 pull requests merged in this window.\n\n'
    );
  });
});

describe('excerpt', () => {
  it('drops markup that would break the digest, flattens lines, and truncates long bodies', () => {
    const text = excerpt(
      `<!-- marker -->\n> [!NOTE]\n### Verdict\n<details><summary>First</summary> line\nsecond ${'x'.repeat(300)}`
    );
    expect(text.startsWith('Verdict First line second x')).toBe(true);
    expect(text).toHaveLength(200);
    expect(text.endsWith('…')).toBe(true);
  });
});
