import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { parseGuidance } from '../guidance/parseGuidance.ts';
import { summarizeEvidence, type Evidence, type KnownSection } from './digest.ts';

/**
 * `node tooling/evidence/summarize.ts <comments.json> <summary.md>`: writes the Evidence digest
 * summary for the comments the weekly workflow gathered. `CLAUDE.md` headings, read from the
 * current checkout, let the summary group comments by the section they cite.
 */

// Adopters edit this: the guidance file whose headings comments cite by name or anchor.
const GUIDANCE_FILE = 'CLAUDE.md';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(message: string): never {
  throw new Error(`comments.json: ${message}`);
}

function readEvidence(file: string): Evidence {
  const data: unknown = JSON.parse(readFileSync(file, 'utf8'));
  if (!isRecord(data)) fail('expected an object');
  const { since, until, pullRequests, comments } = data;
  if (typeof since !== 'string' || typeof until !== 'string') fail('since and until are dates');
  if (!Array.isArray(pullRequests) || !Array.isArray(comments)) {
    fail('pullRequests and comments are arrays');
  }
  return {
    since,
    until,
    pullRequests: pullRequests.map((pr: unknown) => {
      if (!isRecord(pr) || typeof pr.number !== 'number') fail('a pull request has no number');
      return {
        number: pr.number,
        title: typeof pr.title === 'string' ? pr.title : '',
        files: Array.isArray(pr.files) ? pr.files.filter((f) => typeof f === 'string') : [],
      };
    }),
    comments: comments.map((comment: unknown) => {
      if (!isRecord(comment) || typeof comment.pr !== 'number') fail('a comment has no pr');
      const { kind } = comment;
      if (kind !== 'review-comment' && kind !== 'review' && kind !== 'summary') {
        fail(`unknown comment kind ${String(kind)}`);
      }
      return {
        pr: comment.pr,
        kind,
        author: typeof comment.author === 'string' ? comment.author : 'unknown',
        path: typeof comment.path === 'string' ? comment.path : null,
        url: typeof comment.url === 'string' ? comment.url : '',
        body: typeof comment.body === 'string' ? comment.body : '',
      };
    }),
  };
}

function claudeSections(): KnownSection[] {
  if (!existsSync(GUIDANCE_FILE)) return [];
  return parseGuidance(readFileSync(GUIDANCE_FILE, 'utf8')).headings.map(({ text, slug }) => ({
    text,
    slug,
  }));
}

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node tooling/evidence/summarize.ts <comments.json> <summary.md>');
  process.exitCode = 2;
} else {
  writeFileSync(output, summarizeEvidence(readEvidence(input), claudeSections()));
}
